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

    /// <summary>Supabase local por defecto; se sobreescribe con la variable ALERTAYA_TEST_DB.</summary>
    public static string ConnectionString =>
        Environment.GetEnvironmentVariable("ALERTAYA_TEST_DB")
        ?? "Host=127.0.0.1;Port=54322;Database=postgres;Username=postgres;Password=postgres";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:SigningKey", TestSigningKey);
        builder.UseSetting("Jwt:Issuer", TestIssuer);
        builder.UseSetting("Jwt:Audience", TestAudience);
        builder.UseSetting("Jwt:Authority", string.Empty);
        builder.UseSetting("ConnectionStrings:Default", ConnectionString);
    }
}
