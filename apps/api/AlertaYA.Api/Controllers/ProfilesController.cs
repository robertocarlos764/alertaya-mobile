using AlertaYA.Api.Extensions;
using AlertaYA.Api.Models.DTOs;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlertaYA.Api.Controllers;

[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfilesController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Devuelve el perfil del usuario autenticado. El id se toma del JWT, nunca de la URL.</summary>
    [HttpGet("me")]
    public async Task<ActionResult<ProfileDto>> GetMe(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var perfil = await _db.Profiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);

        if (perfil is null)
        {
            return NotFound(new { error = "No existe perfil para este usuario." });
        }

        return Ok(ProfileDto.From(perfil));
    }

    /// <summary>
    /// Actualiza los campos editables por el usuario: <c>nombre</c>, <c>telefono</c> y <c>palabra_clave</c>.
    /// Regla de negocio (sección 4): <c>ventanaConfirmacionSegundos</c> y <c>modoSilencioso</c> solo pueden
    /// ser modificados por un rol de administrador; cualquier intento aquí se rechaza explícitamente.
    /// </summary>
    [HttpPatch("me")]
    public async Task<ActionResult<ProfileDto>> PatchMe([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        if (request.VentanaConfirmacionSegundos is not null || request.ModoSilencioso is not null)
        {
            return BadRequest(new
            {
                error = "los campos 'ventanaConfirmacionSegundos' y 'modoSilencioso' son de administración y no pueden editarse desde el perfil del usuario.",
            });
        }

        var perfil = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);
        if (perfil is null)
        {
            return NotFound(new { error = "No existe perfil para este usuario." });
        }

        if (!string.IsNullOrWhiteSpace(request.Nombre))
        {
            perfil.Nombre = request.Nombre.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Telefono))
        {
            perfil.Telefono = request.Telefono.Trim();
        }

        // palabra_clave admite limpieza (vacío → null); no se hashea por diseño de la tabla actual.
        if (request.PalabraClave is not null)
        {
            perfil.PalabraClave = string.IsNullOrWhiteSpace(request.PalabraClave) ? null : request.PalabraClave.Trim();
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ProfileDto.From(perfil));
    }
}