using Npgsql;

namespace AlertaYA.Api.IntegrationTests;

/// <summary>
/// Pruebas contra la BD remota de pruebas (D-22: sin Docker no hay BD local).
/// <c>CatalogoCoincide</c> detecta deriva del esquema (reemplaza a <c>db diff</c>) y
/// <c>PgTap</c> corre cada <c>supabase/tests/*.sql</c> dentro de begin/rollback.
/// Lee <c>ALERTAYA_TEST_DB</c> y nunca la imprime.
/// </summary>
[Trait("Category", "Integration")]
public class BdRemotaTests
{
    private static readonly string Raiz = BuscarRaiz();

    [Fact]
    public async Task CatalogoCoincide()
    {
        var sql = await File.ReadAllTextAsync(Path.Combine(Raiz, "supabase", "catalog", "inventario.sql"));
        var actual = new List<string>();
        await using (var conn = await AbrirAsync())
        await using (var cmd = new NpgsqlCommand(sql, conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                actual.Add(reader.GetString(0));
            }
        }

        var archivo = Path.Combine(Raiz, "supabase", "catalog", "remoto.txt");
        if (Environment.GetEnvironmentVariable("ALERTAYA_ACTUALIZAR_CATALOGO") == "1")
        {
            await File.WriteAllTextAsync(archivo, string.Join("\n", actual) + "\n");
            return;
        }

        var esperado = (await File.ReadAllTextAsync(archivo))
            .Replace("\r\n", "\n")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var faltan = esperado.Except(actual).ToList();
        var sobran = actual.Except(esperado).ToList();
        Assert.True(
            faltan.Count == 0 && sobran.Count == 0,
            "El catalogo remoto no coincide con supabase/catalog/remoto.txt.\n"
            + $"En remoto.txt pero no en la BD:\n  {string.Join("\n  ", faltan)}\n"
            + $"En la BD pero no en remoto.txt:\n  {string.Join("\n  ", sobran)}");
    }

    public static IEnumerable<object[]> ArchivosPgTap() =>
        Directory.GetFiles(Path.Combine(Raiz, "supabase", "tests"), "*.sql")
            .OrderBy(f => f, StringComparer.Ordinal)
            .Select(f => new object[] { Path.GetFileName(f) });

    /// <summary>
    /// Un archivo que no empiece con <c>begin;</c> y termine con <c>rollback;</c> no se ejecuta:
    /// ninguna prueba puede confirmar cambios en la BD de la demo. Con <c>ALERTAYA_PGTAP_PRELUDIO</c>
    /// (rutas relativas a la raiz separadas por <c>;</c>) se inyectan migraciones justo despues del
    /// <c>begin;</c> para el ensayo de 01-05: migracion y pruebas en una sola transaccion revertida.
    /// </summary>
    [Theory]
    [MemberData(nameof(ArchivosPgTap))]
    public async Task PgTap(string archivo)
    {
        var lineas = (await File.ReadAllLinesAsync(Path.Combine(Raiz, "supabase", "tests", archivo))).ToList();
        var utiles = lineas.Select(l => l.Trim()).Where(l => l.Length > 0).ToList();
        if (utiles.Count < 2
            || !utiles[0].Equals("begin;", StringComparison.OrdinalIgnoreCase)
            || !utiles[^1].Equals("rollback;", StringComparison.OrdinalIgnoreCase))
        {
            Assert.Fail($"{archivo} debe empezar con 'begin;' y terminar con 'rollback;'; no se ejecuto.");
        }

        var preludio = Environment.GetEnvironmentVariable("ALERTAYA_PGTAP_PRELUDIO");
        if (!string.IsNullOrWhiteSpace(preludio))
        {
            var migraciones = preludio
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(r => File.ReadAllText(Path.Combine(Raiz, r)));
            var posBegin = lineas.FindIndex(l => l.Trim().Equals("begin;", StringComparison.OrdinalIgnoreCase));
            lineas.InsertRange(posBegin + 1, migraciones);
        }

        var salida = new List<string>();
        try
        {
            await using var conn = await AbrirAsync();
            await using var cmd = new NpgsqlCommand(string.Join("\n", lineas), conn);
            await using var reader = await cmd.ExecuteReaderAsync();
            do
            {
                while (await reader.ReadAsync())
                {
                    if (reader.FieldCount > 0 && !reader.IsDBNull(0))
                    {
                        salida.Add(reader.GetValue(0).ToString() ?? string.Empty);
                    }
                }
            }
            while (await reader.NextResultAsync());
        }
        catch (PostgresException ex)
        {
            // La conexion se descarta sin pool: el servidor revierte la transaccion abierta.
            Assert.Fail($"{archivo}: error de Postgres {ex.SqlState}: {ex.MessageText}{(ex.Where is null ? "" : $" ({ex.Where})")}");
        }

        var fallos = salida.Where(l => l.StartsWith("not ok", StringComparison.Ordinal)
                                       || l.StartsWith("# Looks like", StringComparison.Ordinal)).ToList();
        Assert.True(fallos.Count == 0, $"{archivo}:\n{string.Join("\n", salida)}");
        Assert.True(salida.Any(l => l.StartsWith("ok", StringComparison.Ordinal)), $"{archivo}: no hubo ninguna linea 'ok'.");
    }

    private static async Task<NpgsqlConnection> AbrirAsync()
    {
        var cadena = Environment.GetEnvironmentVariable("ALERTAYA_TEST_DB");
        if (string.IsNullOrWhiteSpace(cadena))
        {
            Assert.Fail(
                "Falta la variable de entorno ALERTAYA_TEST_DB. Definela como variable de usuario de Windows con la "
                + "cadena Npgsql del Session pooler (Dashboard -> Connect, puerto 5432, usuario postgres.<ref>, "
                + "la clave de la BD, SSL Mode=Require y Maximum Pool Size=5). Ver user_setup de 01-03-PLAN.md.");
        }

        // Sin pool: ninguna conexion con una transaccion a medias vuelve a reutilizarse.
        var builder = new NpgsqlConnectionStringBuilder(cadena) { Pooling = false };
        var conn = new NpgsqlConnection(builder.ConnectionString);
        await conn.OpenAsync();
        return conn;
    }

    private static string BuscarRaiz()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            if (Directory.Exists(Path.Combine(dir.FullName, "supabase", "migrations")))
            {
                return dir.FullName;
            }
        }

        throw new DirectoryNotFoundException("No se encontro la raiz del repo (carpeta con supabase/migrations).");
    }
}
