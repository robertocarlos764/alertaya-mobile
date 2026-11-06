using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

// Todas las clases en serie: comparten la BD remota y el claim del outbox es global.
[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace AlertaYA.Api.IntegrationTests;

[CollectionDefinition("BD remota")]
public class BdRemotaColeccion : ICollectionFixture<BdRemotaFixture>
{
}

public sealed class BdRemotaFixture : IAsyncLifetime
{
    public const string PrefijoCorreo = "it-alertaya-";
    private const string PatronCorreo = PrefijoCorreo + "%";

    // Hijo -> padre según las FKs de 01-03-SUMMARY. officer_decisions.alert_id es "no action":
    // sin borrarla antes, una decisión sobre una alerta de prueba bloquearía la limpieza.
    private const string SqlLimpieza = $"""
        create temp table it_usuarios on commit drop as
            select id from auth.users where email like '{PatronCorreo}';
        create temp table it_alertas on commit drop as
            select id from public.alerts where user_id in (select id from it_usuarios);
        delete from public.notification_deliveries where alert_id in (select id from it_alertas);
        delete from public.tracking_links where alert_id in (select id from it_alertas);
        delete from public.alert_locations where alert_id in (select id from it_alertas);
        delete from public.verification_logs where alert_id in (select id from it_alertas);
        delete from public.officer_decisions where alert_id in (select id from it_alertas);
        delete from public.alerts where id in (select id from it_alertas);
        delete from public.emergency_contacts where user_id in (select id from it_usuarios);
        delete from public.profiles where id in (select id from it_usuarios);
        delete from auth.users where id in (select id from it_usuarios);
        """;

    private string _cadena = string.Empty;

    public ApiFactory Api { get; } = new();

    public async Task InitializeAsync()
    {
        var cadena = ApiFactory.ConnectionString;
        if (string.IsNullOrWhiteSpace(cadena))
        {
            throw new InvalidOperationException(
                "Falta la variable de entorno ALERTAYA_TEST_DB: las pruebas de integración corren contra la BD "
                + "remota de pruebas (D-22). Defínela como variable de usuario de Windows (ver user_setup de 01-03-PLAN.md) "
                + "o corre solo dotnet test --filter \"Category!=Integration\".");
        }

        _cadena = cadena;
        await ExigirApiRealApagadoAsync();
        await ExigirRelojSincronizadoAsync();
        await LimpiarAsync();

        var reclamables = await EscalarAsync<long>($"""
            select count(*)
            from public.notification_deliveries d
            join public.alerts a on a.id = d.alert_id
            left join auth.users u on u.id = a.user_id
            where d.estado in ('en_cola', 'reintento', 'enviando')
              and coalesce(u.email, '') not like '{PatronCorreo}'
            """);
        if (reclamables > 0)
        {
            throw new InvalidOperationException(
                $"Hay {reclamables} entregas en_cola/reintento/enviando de usuarios reales. Un claim de prueba se las "
                + "llevaría: finaliza esas alertas o deja que el dispatcher del API real termine antes de correr las pruebas.");
        }
    }

    public async Task DisposeAsync()
    {
        try
        {
            if (_cadena.Length > 0)
            {
                await LimpiarAsync();
            }
        }
        finally
        {
            await Api.DisposeAsync();
        }
    }

    // El perfil lo crea el trigger on_auth_user_created.
    public async Task<Guid> CrearUsuarioAsync(string nombre, string telefono = "")
    {
        var id = Guid.NewGuid();
        await EjecutarAsync(
            """
            insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                                    raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
            values (@id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', @correo, '',
                    now(), '{}'::jsonb, jsonb_build_object('nombre', @nombre::text, 'telefono', @telefono::text), now(), now())
            """,
            ("id", id),
            ("correo", $"{PrefijoCorreo}{id}@example.com"),
            ("nombre", nombre),
            ("telefono", telefono));
        return id;
    }

    public async Task<Guid> CrearContactoAsync(Guid userId, string nombre, string telefono)
    {
        var id = Guid.NewGuid();
        await EjecutarAsync(
            "insert into public.emergency_contacts (id, user_id, nombre, telefono, creado_en) values (@id, @user, @nombre, @telefono, now())",
            ("id", id),
            ("user", userId),
            ("nombre", nombre),
            ("telefono", telefono));
        return id;
    }

    public static string TokenPara(Guid userId)
    {
        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = ApiFactory.TestIssuer,
            Audience = ApiFactory.TestAudience,
            Subject = new ClaimsIdentity(new[] { new Claim("sub", userId.ToString()) }),
            Expires = DateTime.UtcNow.AddMinutes(10),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ApiFactory.TestSigningKey)),
                SecurityAlgorithms.HmacSha256),
        };
        return new JsonWebTokenHandler().CreateToken(descriptor);
    }

    public HttpClient ClienteDe(Guid userId)
    {
        var client = Api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TokenPara(userId));
        return client;
    }

    public async Task<T> EscalarAsync<T>(string sql, params (string Nombre, object Valor)[] parametros)
    {
        await using var conn = await AbrirAsync();
        await using var cmd = Comando(sql, conn, parametros);
        return (T)(await cmd.ExecuteScalarAsync())!;
    }

    public async Task EjecutarAsync(string sql, params (string Nombre, object Valor)[] parametros)
    {
        await using var conn = await AbrirAsync();
        await using var cmd = Comando(sql, conn, parametros);
        await cmd.ExecuteNonQueryAsync();
    }

    private async Task LimpiarAsync()
    {
        await using var conn = await AbrirAsync();
        await using var tx = await conn.BeginTransactionAsync();
        await using (var cmd = new NpgsqlCommand(SqlLimpieza, conn, tx))
        {
            await cmd.ExecuteNonQueryAsync();
        }

        await tx.CommitAsync();
    }

    private static async Task ExigirApiRealApagadoAsync()
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        try
        {
            await http.GetAsync("http://localhost:5016/health");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return;
        }

        throw new InvalidOperationException(
            "El API real está corriendo en http://localhost:5016: su dispatcher enviaría por Twilio las entregas de prueba. "
            + "Detenlo antes de correr las pruebas de integración.");
    }

    private async Task ExigirRelojSincronizadoAsync()
    {
        await using var conn = await AbrirAsync();
        await using var cmd = new NpgsqlCommand("select now()", conn);
        var antes = DateTimeOffset.UtcNow;
        var servidor = (DateTime)(await cmd.ExecuteScalarAsync())!;
        var despues = DateTimeOffset.UtcNow;
        var local = antes + ((despues - antes) / 2);
        var desfase = (new DateTimeOffset(servidor, TimeSpan.Zero) - local).Duration();
        if (desfase > TimeSpan.FromSeconds(2))
        {
            throw new InvalidOperationException(
                $"El reloj del PC difiere {desfase.TotalSeconds:F1} s del servidor de BD (máximo 2 s). Los handlers fijan "
                + "proximo_intento_en con el reloj del API y el claim compara con el de la BD: sincroniza con 'w32tm /resync'.");
        }
    }

    private async Task<NpgsqlConnection> AbrirAsync()
    {
        var conn = new NpgsqlConnection(_cadena);
        await conn.OpenAsync();
        return conn;
    }

    private static NpgsqlCommand Comando(string sql, NpgsqlConnection conn, (string Nombre, object Valor)[] parametros)
    {
        var cmd = new NpgsqlCommand(sql, conn);
        foreach (var (nombre, valor) in parametros)
        {
            cmd.Parameters.AddWithValue(nombre, valor);
        }

        return cmd;
    }
}
