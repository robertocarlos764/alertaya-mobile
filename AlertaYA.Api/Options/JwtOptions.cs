namespace AlertaYA.Api.Options;

/// <summary>Configuración de validación de JWT emitidos por Supabase Auth.</summary>
public class JwtOptions
{
    /// <summary>Clave de firma HS256 de Supabase (JWT Secret del dashboard).</summary>
    public string SigningKey { get; set; } = string.Empty;

    /// <summary>Issuer de los tokens, ej. https://&lt;ref&gt;.supabase.co/auth/v1</summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>Audiencia esperada; Supabase usa "authenticated".</summary>
    public string Audience { get; set; } = "authenticated";
}