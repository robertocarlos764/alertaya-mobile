using System.Security.Claims;

namespace AlertaYA.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Extrae el <c>sub</c> del JWT de Supabase como el id de usuario.
    /// El backend NUNCA debe confiar en un user_id del body o de la URL: siempre se toma del token
    /// validado (sección 3 de la especificación). <c>ClaimTypes.NameIdentifier</c> es el nombre en
    /// el que JwtBearer mapea el claim "sub" por defecto; se consulta "sub" directamente como
    /// respaldo por robustez.
    /// </summary>
    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirst("sub")?.Value
                  ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(sub, out var userId) ? userId : null;
    }
}