namespace AlertaYA.Api.Options;

/// <summary>Configuración del endpoint de fallback SMS (sección 9 de la especificación).</summary>
public class SmsFallbackOptions
{
    /// <summary>Secreto compartido para la autenticación ligera del payload (HMAC).</summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>Antigüedad máxima aceptada del timestamp del payload (anti-replay), en segundos.</summary>
    public int MaxAgeSeconds { get; set; } = 300;
}