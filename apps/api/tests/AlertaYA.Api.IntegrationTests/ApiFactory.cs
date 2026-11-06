using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AlertaYA.Api.IntegrationTests;

/// <summary>
/// Host del API para las pruebas de integración. La configuración va con <c>UseSetting</c>
/// porque así llega a <c>builder.Configuration</c> antes de que <c>Program.cs</c> lea la
/// sección <c>Jwt</c>. Secretos de prueba únicamente; nunca los de un entorno real.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public const string TestSigningKey = "alertaya-test-signing-key-solo-para-pruebas-0123456789";
    public const string TestIssuer = "alertaya-test";
    public const string TestAudience = "authenticated";
    public const string TestWebBaseUrl = "https://web.prueba.alertaya.local";

    public static readonly string TestSecretoSeguimiento = Convert.ToBase64String(
        System.Text.Encoding.UTF8.GetBytes("secreto-de-seguimiento-de-prueba"));

    public static string? ConnectionString => Environment.GetEnvironmentVariable("ALERTAYA_TEST_DB");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:SigningKey", TestSigningKey);
        builder.UseSetting("Jwt:Issuer", TestIssuer);
        builder.UseSetting("Jwt:Audience", TestAudience);
        builder.UseSetting("Jwt:Authority", string.Empty);
        builder.UseSetting("Public:ApiBaseUrl", "https://api.prueba.alertaya.local");
        builder.UseSetting("Public:WebBaseUrl", TestWebBaseUrl);
        builder.UseSetting("Public:SecretoSeguimiento", TestSecretoSeguimiento);
        if (!string.IsNullOrWhiteSpace(ConnectionString))
        {
            builder.UseSetting("ConnectionStrings:Default", ConnectionString);
        }
    }
}
