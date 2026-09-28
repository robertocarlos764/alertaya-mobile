namespace AlertaYA.Api.Services.Abstractions;

/// <summary>
/// Autenticación ligera del endpoint de fallback SMS (sección 9 de la especificación).
/// Como el usuario puede no tener datos móviles, el endpoint no usa JWT, pero debe
/// rechazar payloads no autenticados (envío de SMS falsos = spoofing). La implementación
/// usa HMAC sobre el contenido del payload usando un secreto compartido fuera de banda.
/// </summary>
public interface ISmsFallbackAuthService
{
    bool Validate(Guid userId, double lat, double lon, DateTimeOffset timestamp, string? hash);
}