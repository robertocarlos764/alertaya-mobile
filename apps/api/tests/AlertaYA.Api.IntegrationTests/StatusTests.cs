using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AlertaYA.Domain;
using Microsoft.AspNetCore.Hosting;

namespace AlertaYA.Api.IntegrationTests;

[Trait("Category", "Integration")]
[Collection("BD remota")]
public class StatusTests
{
    private readonly BdRemotaFixture _bd;

    public StatusTests(BdRemotaFixture bd)
    {
        _bd = bd;
    }

    private static async Task<Guid> CrearAlertaAsync(HttpClient client)
    {
        var resp = await client.PostAsJsonAsync("/api/alerts", new { canalActivacion = "boton_pulsado", clientGeneratedId = Guid.NewGuid() });
        Assert.True(resp.StatusCode == HttpStatusCode.Created, await resp.Content.ReadAsStringAsync());
        return (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    [Fact]
    public async Task El_dueno_ve_cada_contacto_en_cola_con_serverNow_y_trackingUrl()
    {
        var userId = await _bd.CrearUsuarioAsync("Dueña");
        await _bd.CrearContactoAsync(userId, "Bruno", "+573001112233");
        await _bd.CrearContactoAsync(userId, "Ana", "+573004445566");
        using var client = _bd.ClienteDe(userId);
        var alertId = await CrearAlertaAsync(client);

        var resp = await client.GetAsync($"/api/alerts/{alertId}/status");

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(alertId, json.GetProperty("id").GetGuid());
        var contactos = json.GetProperty("contactos").EnumerateArray().ToList();
        Assert.Equal(new[] { "Ana", "Bruno" }, contactos.Select(c => c.GetProperty("nombre").GetString()));
        Assert.All(contactos, c =>
        {
            Assert.Equal("en_cola", c.GetProperty("estado").GetString());
            Assert.Equal(0, c.GetProperty("intentos").GetInt32());
        });
        Assert.True(json.GetProperty("serverNow").GetDateTimeOffset() > DateTimeOffset.UtcNow.AddMinutes(-1));

        var url = json.GetProperty("trackingUrl").GetString()!;
        var prefijo = ApiFactory.TestWebBaseUrl + "/t/";
        Assert.StartsWith(prefijo, url);
        var token = url[prefijo.Length..];
        Assert.Matches("^[A-Za-z0-9_-]{22}$", token);
        Assert.Equal(1, await _bd.EscalarAsync<long>(
            "select count(*) from public.tracking_links where alert_id = @id and token_hash = @hash",
            ("id", alertId),
            ("hash", TrackingToken.Hash(token))));
    }

    [Fact]
    public async Task Otro_usuario_recibe_404_alert_not_found()
    {
        var dueno = await _bd.CrearUsuarioAsync("Dueño");
        var ajeno = await _bd.CrearUsuarioAsync("Ajeno");
        using var clienteDueno = _bd.ClienteDe(dueno);
        var alertId = await CrearAlertaAsync(clienteDueno);
        using var clienteAjeno = _bd.ClienteDe(ajeno);

        var resp = await clienteAjeno.GetAsync($"/api/alerts/{alertId}/status");

        await CreateAlertTests.AfirmarProblemaAsync(resp, HttpStatusCode.NotFound, "alert_not_found");
    }

    [Fact]
    public async Task Active_responde_204_sin_alerta_y_200_con_la_activa()
    {
        var userId = await _bd.CrearUsuarioAsync("Activa");
        using var client = _bd.ClienteDe(userId);

        var vacia = await client.GetAsync("/api/alerts/active");
        Assert.Equal(HttpStatusCode.NoContent, vacia.StatusCode);

        var alertId = await CrearAlertaAsync(client);
        var activa = await client.GetAsync("/api/alerts/active");

        Assert.Equal(HttpStatusCode.OK, activa.StatusCode);
        Assert.Equal(alertId, (await activa.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Excepcion_no_controlada_da_500_internal_error_sin_el_mensaje_interno()
    {
        // Puerto 1 cerrado: la consulta lanza una NpgsqlException real con el host en su mensaje.
        using var rota = _bd.Api.WithWebHostBuilder(b =>
            b.UseSetting("ConnectionStrings:Default", "Host=127.0.0.1;Port=1;Database=nada;Username=nadie;Timeout=3"));
        using var client = rota.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", BdRemotaFixture.TokenPara(Guid.NewGuid()));

        var resp = await client.GetAsync("/api/alerts/active");

        await CreateAlertTests.AfirmarProblemaAsync(resp, HttpStatusCode.InternalServerError, "internal_error");
        var cuerpo = await resp.Content.ReadAsStringAsync();
        Assert.DoesNotContain("127.0.0.1", cuerpo);
        Assert.DoesNotContain("Npgsql", cuerpo);
        Assert.DoesNotContain("exception", cuerpo, StringComparison.OrdinalIgnoreCase);
    }
}
