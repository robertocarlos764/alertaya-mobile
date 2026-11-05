using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace AlertaYA.Api.IntegrationTests;

[Trait("Category", "Integration")]
[Collection("BD remota")]
public class ContactsTests
{
    private readonly BdRemotaFixture _bd;

    public ContactsTests(BdRemotaFixture bd)
    {
        _bd = bd;
    }

    private static Task<HttpResponseMessage> CrearAsync(HttpClient client, string nombre, string telefono)
        => client.PostAsJsonAsync("/api/emergency-contacts", new { nombre, telefono, relacion = "Mamá" });

    [Fact]
    public async Task Guarda_el_telefono_normalizado()
    {
        var userId = await _bd.CrearUsuarioAsync("Normaliza");
        using var client = _bd.ClienteDe(userId);

        var resp = await CrearAsync(client, "María García", "300 123 4567");

        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        Assert.Equal("+573001234567", (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("telefono").GetString());
        Assert.Equal(1, await _bd.EscalarAsync<long>(
            "select count(*) from public.emergency_contacts where user_id = @id and telefono = '+573001234567'",
            ("id", userId)));
    }

    [Fact]
    public async Task Telefono_invalido_o_nombre_vacio_dan_400_validation_error()
    {
        var userId = await _bd.CrearUsuarioAsync("Invalido");
        using var client = _bd.ClienteDe(userId);

        await CreateAlertTests.AfirmarProblemaAsync(await CrearAsync(client, "Fijo", "601 123 4567"), HttpStatusCode.BadRequest, "validation_error");
        await CreateAlertTests.AfirmarProblemaAsync(await CrearAsync(client, "  ", "300 123 4567"), HttpStatusCode.BadRequest, "validation_error");
    }

    [Fact]
    public async Task Mismo_telefono_dos_veces_da_409_duplicate_contact()
    {
        var userId = await _bd.CrearUsuarioAsync("Duplicado");
        using var client = _bd.ClienteDe(userId);

        Assert.Equal(HttpStatusCode.Created, (await CrearAsync(client, "Uno", "3001234567")).StatusCode);
        var resp = await CrearAsync(client, "Otro", "+57 300 123 4567");

        await CreateAlertTests.AfirmarProblemaAsync(resp, HttpStatusCode.Conflict, "duplicate_contact");
    }

    [Fact]
    public async Task El_contacto_11_da_409_contact_limit()
    {
        var userId = await _bd.CrearUsuarioAsync("Limite");
        for (var i = 0; i < 10; i++)
        {
            await _bd.CrearContactoAsync(userId, $"Contacto {i}", $"+57300000000{i}");
        }

        using var client = _bd.ClienteDe(userId);
        var resp = await CrearAsync(client, "Once", "3009999999");

        await CreateAlertTests.AfirmarProblemaAsync(resp, HttpStatusCode.Conflict, "contact_limit");
    }

    [Fact]
    public async Task Contacto_ajeno_da_404_y_no_aparece_en_la_lista()
    {
        var dueno = await _bd.CrearUsuarioAsync("Dueño");
        var ajeno = await _bd.CrearUsuarioAsync("Ajeno");
        var contactoId = await _bd.CrearContactoAsync(dueno, "Privado", "+573001112233");
        using var client = _bd.ClienteDe(ajeno);

        var put = await client.PutAsJsonAsync($"/api/emergency-contacts/{contactoId}", new { nombre = "Robado" });
        var delete = await client.DeleteAsync($"/api/emergency-contacts/{contactoId}");
        var lista = await client.GetFromJsonAsync<JsonElement>("/api/emergency-contacts");

        await CreateAlertTests.AfirmarProblemaAsync(put, HttpStatusCode.NotFound, "contact_not_found");
        await CreateAlertTests.AfirmarProblemaAsync(delete, HttpStatusCode.NotFound, "contact_not_found");
        Assert.Equal(0, lista.GetArrayLength());
        Assert.Equal(1, await _bd.EscalarAsync<long>(
            "select count(*) from public.emergency_contacts where id = @id and nombre = 'Privado'",
            ("id", contactoId)));
    }

    [Fact]
    public async Task La_alerta_11_en_una_hora_da_429_rate_limited()
    {
        var userId = await _bd.CrearUsuarioAsync("Abuso");
        using var client = _bd.ClienteDe(userId);

        for (var i = 0; i < 10; i++)
        {
            var ok = await client.PostAsJsonAsync("/api/alerts", new { canalActivacion = "boton_pulsado", clientGeneratedId = Guid.NewGuid() });
            Assert.Equal(HttpStatusCode.Created, ok.StatusCode);
        }

        var resp = await client.PostAsJsonAsync("/api/alerts", new { canalActivacion = "boton_pulsado", clientGeneratedId = Guid.NewGuid() });

        await CreateAlertTests.AfirmarProblemaAsync(resp, HttpStatusCode.TooManyRequests, "rate_limited");
    }
}
