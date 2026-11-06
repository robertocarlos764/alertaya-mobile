using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace AlertaYA.Api.IntegrationTests;

[Trait("Category", "Integration")]
[Collection("BD remota")]
public class CreateAlertTests
{
    private readonly BdRemotaFixture _bd;

    public CreateAlertTests(BdRemotaFixture bd)
    {
        _bd = bd;
    }

    private static object Cuerpo(Guid? clientGeneratedId, object? ubicacion = null) => new
    {
        canalActivacion = "boton_pulsado",
        clientGeneratedId,
        ubicacionInicial = ubicacion,
        precisionMetros = ubicacion is null ? (decimal?)null : 12m,
        fuente = ubicacion is null ? null : "gps",
    };

    private async Task<Guid> UsuarioConDosContactosAsync()
    {
        var userId = await _bd.CrearUsuarioAsync("Ana Prueba");
        await _bd.CrearContactoAsync(userId, "Bruno", "+573001112233");
        await _bd.CrearContactoAsync(userId, "Carla", "+573004445566");
        return userId;
    }

    private Task<long> ContarAsync(string sql, Guid id) => _bd.EscalarAsync<long>(sql, ("id", id));

    [Fact]
    public async Task Crea_alerta_activa_con_enlace_y_una_entrega_en_cola_por_contacto()
    {
        var userId = await UsuarioConDosContactosAsync();
        using var client = _bd.ClienteDe(userId);

        var resp = await client.PostAsJsonAsync("/api/alerts", Cuerpo(Guid.NewGuid(), new { lat = 10.98, lon = -74.8 }));

        Assert.True(resp.StatusCode == HttpStatusCode.Created, await resp.Content.ReadAsStringAsync());
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("activa", json.GetProperty("estado").GetString());
        var alertId = json.GetProperty("id").GetGuid();

        Assert.Equal(1, await ContarAsync("select count(*) from public.alerts where user_id = @id", userId));
        Assert.Equal(1, await ContarAsync("select count(*) from public.tracking_links where alert_id = @id", alertId));
        Assert.Equal(2, await ContarAsync(
            """
            select count(*) from public.notification_deliveries
            where alert_id = @id and estado = 'en_cola' and tipo = 'alerta' and canal = 'sms' and intentos = 0
              and ((contacto_nombre = 'Bruno' and contacto_telefono = '+573001112233')
                or (contacto_nombre = 'Carla' and contacto_telefono = '+573004445566'))
            """,
            alertId));
    }

    [Fact]
    public async Task Mismo_clientGeneratedId_en_serie_devuelve_la_misma_alerta_sin_entregas_nuevas()
    {
        var userId = await UsuarioConDosContactosAsync();
        using var client = _bd.ClienteDe(userId);
        var clientId = Guid.NewGuid();

        var primera = await (await client.PostAsJsonAsync("/api/alerts", Cuerpo(clientId))).Content.ReadFromJsonAsync<JsonElement>();
        var segunda = await client.PostAsJsonAsync("/api/alerts", Cuerpo(clientId));

        Assert.Equal(HttpStatusCode.Created, segunda.StatusCode);
        var alertId = primera.GetProperty("id").GetGuid();
        Assert.Equal(alertId, (await segunda.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid());
        Assert.Equal(1, await ContarAsync("select count(*) from public.alerts where user_id = @id", userId));
        Assert.Equal(2, await ContarAsync("select count(*) from public.notification_deliveries where alert_id = @id", alertId));
    }

    [Fact]
    public async Task Dos_POST_concurrentes_con_el_mismo_id_crean_una_sola_alerta()
    {
        var userId = await UsuarioConDosContactosAsync();
        using var client = _bd.ClienteDe(userId);
        var clientId = Guid.NewGuid();

        var respuestas = await Task.WhenAll(
            client.PostAsJsonAsync("/api/alerts", Cuerpo(clientId)),
            client.PostAsJsonAsync("/api/alerts", Cuerpo(clientId)));

        Assert.All(respuestas, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
        var ids = new List<Guid>();
        foreach (var r in respuestas)
        {
            ids.Add((await r.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid());
        }

        Assert.Single(ids.Distinct());
        Assert.Equal(1, await ContarAsync("select count(*) from public.alerts where user_id = @id", userId));
        Assert.Equal(2, await ContarAsync("select count(*) from public.notification_deliveries where alert_id = @id", ids[0]));
    }

    [Fact]
    public async Task Sin_clientGeneratedId_responde_400_validation_error()
    {
        var userId = await _bd.CrearUsuarioAsync("Sin Id");
        using var client = _bd.ClienteDe(userId);

        var resp = await client.PostAsJsonAsync("/api/alerts", Cuerpo(null));

        await AfirmarProblemaAsync(resp, HttpStatusCode.BadRequest, "validation_error");
        Assert.Equal(0, await ContarAsync("select count(*) from public.alerts where user_id = @id", userId));
    }

    [Fact]
    public async Task Ubicacion_inicial_cero_cero_responde_400_validation_error()
    {
        var userId = await _bd.CrearUsuarioAsync("Centinela");
        using var client = _bd.ClienteDe(userId);

        var resp = await client.PostAsJsonAsync("/api/alerts", Cuerpo(Guid.NewGuid(), new { lat = 0.0, lon = 0.0 }));

        await AfirmarProblemaAsync(resp, HttpStatusCode.BadRequest, "validation_error");
        Assert.Equal(0, await ContarAsync("select count(*) from public.alerts where user_id = @id", userId));
    }

    [Fact]
    public async Task Sin_JWT_responde_401()
    {
        using var client = _bd.Api.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/alerts", Cuerpo(Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Sin_ubicacion_se_crea_igual_y_sin_coordenada()
    {
        var userId = await _bd.CrearUsuarioAsync("Sin GPS");
        using var client = _bd.ClienteDe(userId);

        var resp = await client.PostAsJsonAsync("/api/alerts", Cuerpo(Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Null, json.GetProperty("ubicacion").ValueKind);
        Assert.Equal(1, await ContarAsync(
            "select count(*) from public.alerts where user_id = @id and ubicacion is null and ubicacion_fuente is null",
            userId));
    }

    internal static async Task AfirmarProblemaAsync(HttpResponseMessage resp, HttpStatusCode esperado, string codigo)
    {
        Assert.Equal(esperado, resp.StatusCode);
        Assert.Equal("application/problem+json", resp.Content.Headers.ContentType?.MediaType);
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(codigo, json.GetProperty("code").GetString());
    }
}
