using AlertaYA.Api.Extensions;
using AlertaYA.Api.Models.DTOs;
using AlertaYA.Domain.Entities;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlertaYA.Api.Controllers;

[ApiController]
[Route("api/emergency-contacts")]
[Authorize]
public class EmergencyContactsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EmergencyContactsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Lista los contactos de emergencia del usuario autenticado.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EmergencyContactDto>>> List(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var contactos = await _db.EmergencyContacts
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.CreadoEn)
            .ToListAsync(cancellationToken);

        return Ok(contactos.Select(EmergencyContactDto.From).ToList());
    }

    /// <summary>Crea un contacto asociado automáticamente al usuario del JWT (nunca del body).</summary>
    [HttpPost]
    public async Task<ActionResult<EmergencyContactDto>> Create([FromBody] CreateEmergencyContactRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Telefono))
        {
            return BadRequest(new { error = "'nombre' y 'telefono' son obligatorios." });
        }

        var contacto = new EmergencyContact
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Nombre = request.Nombre.Trim(),
            Telefono = request.Telefono.Trim(),
            Relacion = string.IsNullOrWhiteSpace(request.Relacion) ? null : request.Relacion.Trim(),
            CreadoEn = DateTimeOffset.UtcNow,
        };

        _db.EmergencyContacts.Add(contacto);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(List), EmergencyContactDto.From(contacto));
    }

    /// <summary>Actualiza un contacto validando que pertenezca al usuario autenticado.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EmergencyContactDto>> Update(Guid id, [FromBody] UpdateEmergencyContactRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var contacto = await _db.EmergencyContacts
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);

        // 404 también si existe pero no es del usuario: no se filtra la existencia del recurso.
        if (contacto is null)
        {
            return NotFound(new { error = "Contacto no encontrado." });
        }

        if (!string.IsNullOrWhiteSpace(request.Nombre))
        {
            contacto.Nombre = request.Nombre.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Telefono))
        {
            contacto.Telefono = request.Telefono.Trim();
        }

        if (request.Relacion is not null)
        {
            contacto.Relacion = string.IsNullOrWhiteSpace(request.Relacion) ? null : request.Relacion.Trim();
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(EmergencyContactDto.From(contacto));
    }

    /// <summary>Elimina un contacto validando que pertenezca al usuario autenticado.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var contacto = await _db.EmergencyContacts
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);

        if (contacto is null)
        {
            return NotFound(new { error = "Contacto no encontrado." });
        }

        _db.EmergencyContacts.Remove(contacto);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}