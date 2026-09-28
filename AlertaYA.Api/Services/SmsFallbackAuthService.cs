using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using AlertaYA.Api.Options;
using AlertaYA.Api.Services.Abstractions;
using Microsoft.Extensions.Options;

namespace AlertaYA.Api.Services;

public class SmsFallbackAuthService : ISmsFallbackAuthService
{
    private readonly SmsFallbackOptions _options;

    public SmsFallbackAuthService(IOptions<SmsFallbackOptions> options)
    {
        _options = options.Value;
    }

    public bool Validate(Guid userId, double lat, double lon, DateTimeOffset timestamp, string? hash)
    {
        var expected = ComputeHash(userId, lat, lon, timestamp);

        // Comparación en tiempo constante: evita ataques de timing para adivinar el hash.
        var okHash = hash is not null
                     && CryptographicOperations.FixedTimeEquals(
                         Encoding.UTF8.GetBytes(hash),
                         Encoding.UTF8.GetBytes(expected));

        // Anti-replay: el timestamp del payload no puede ser demasiado viejo (ni futuro).
        var antiguedad = Math.Abs((DateTimeOffset.UtcNow - timestamp).TotalSeconds);
        var okTimestamp = antiguedad <= _options.MaxAgeSeconds;

        return okHash && okTimestamp;
    }

    /// <summary>
    /// HMAC-SHA256 del payload normalizado usando el secreto compartido (SmsFallback:Secret).
    /// Tanto el emisor (capa de parsing SMS a definir) como el backend deben construirlo
    /// idénticamente: userId | lat | lon | timestamp ISO-8601, firmado con el mismo secreto.
    /// </summary>
    public string ComputeHash(Guid userId, double lat, double lon, DateTimeOffset timestamp)
    {
        // Normalización invariante de cultura para que el emisor y el receptor generen el mismo hash.
        var invariante = CultureInfo.InvariantCulture;
        var crudo = string.Join(
            '|',
            userId.ToString(),
            lat.ToString("0.000000", invariante),
            lon.ToString("0.000000", invariante),
            timestamp.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", invariante));

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_options.Secret));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(crudo))).ToLowerInvariant();
    }
}