namespace AlertaYA.Api.Options;

/// <summary>Configuración de validación de JWT emitidos por Supabase Auth.</summary>
public class JwtOptions
{
    /// <summary>URL base de Supabase Auth, ej. https://&lt;ref&gt;.supabase.co/auth/v1. Se usa para
    /// descubrir la metadata OIDC y las claves públicas de firma (JWKS) de los tokens asimétricos.</summary>
    public string Authority { get; set; } = string.Empty;

    /// <summary>Clave simétrica HS256 para proyectos legacy que firmen con el JWT Secret clásico.
    /// No es necesaria si el proyecto usa claves asimétricas (recomendado por Supabase).</summary>
    public string SigningKey { get; set; } = string.Empty;

    /// <summary>Issuer de los tokens, ej. https://&lt;ref&gt;.supabase.co/auth/v1</summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>Audiencia esperada; Supabase usa "authenticated".</summary>
    public string Audience { get; set; } = "authenticated";
}