namespace AlertaYA.Api.IntegrationTests;

/// <summary>Prueba de humo: host -> DI -> endpoint con la estructura de cuatro proyectos.</summary>
[Trait("Category", "Smoke")]
public class HealthTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public HealthTests(ApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Health_responde_200_Healthy()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }
}
