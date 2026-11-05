using AlertaYA.Api.Errors;
using AlertaYA.Api.Extensions;
using AlertaYA.Api.Models.DTOs;
using AlertaYA.Domain;
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
    // Tope contra el abuso del canal SMS (Pitfall 18).
    public const int MaximoContactos = 10;

    private const string MensajeTelefono = "Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567).";
    private const string MensajeNombre = "El nombre es obligatorio.";

    private readonly AppDbContext _db;

    public EmergencyContactsController(AppDbContext db)
    {
        _db = db;
    }

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

    [HttpPost]
    public async Task<ActionResult<EmergencyContactDto>> Create([FromBody] CreateEmergencyContactRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var nombre = request.Nombre?.Trim();
        if (string.IsNullOrEmpty(nombre) || nombre.Length > 100)
        {
            return Problemas.Validacion(MensajeNombre);
        }

        var telefono = Telefono.NormalizarCelularColombia(request.Telefono);
        if (telefono is null)
        {
            return Problemas.Validacion(MensajeTelefono);
        }

        var relacion = string.IsNullOrWhiteSpace(request.Relacion) ? null : request.Relacion.Trim();
        if (relacion is { Length: > 30 })
        {
            return Problemas.Validacion("La relación admite máximo 30 caracteres.");
        }

        // ponytail: sin unique (user_id, telefono) en BD, dos POST concurrentes pueden duplicar; migracion si importa.
        if (await _db.EmergencyContacts.AnyAsync(c => c.UserId == userId && c.Telefono == telefono, cancellationToken))
        {
            return Problemas.ContactoDuplicado();
        }

        if (await _db.EmergencyContacts.CountAsync(c => c.UserId == userId, cancellationToken) >= MaximoContactos)
        {
            return Problemas.LimiteContactos(MaximoContactos);
        }

        var contacto = new EmergencyContact
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Nombre = nombre,
            Telefono = telefono,
            Relacion = relacion,
            CreadoEn = DateTimeOffset.UtcNow,
        };

        _db.EmergencyContacts.Add(contacto);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(List), EmergencyContactDto.From(contacto));
    }

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
            return Problemas.ContactoNoEncontrado();
        }

        if (request.Nombre is not null)
        {
            var nombre = request.Nombre.Trim();
            if (nombre.Length == 0 || nombre.Length > 100)
            {
                return Problemas.Validacion(MensajeNombre);
            }

            contacto.Nombre = nombre;
        }

        if (request.Telefono is not null)
        {
            var telefono = Telefono.NormalizarCelularColombia(request.Telefono);
            if (telefono is null)
            {
                return Problemas.Validacion(MensajeTelefono);
            }

            if (await _db.EmergencyContacts.AnyAsync(c => c.UserId == userId && c.Telefono == telefono && c.Id != id, cancellationToken))
            {
                return Problemas.ContactoDuplicado();
            }

            contacto.Telefono = telefono;
        }

        if (request.Relacion is not null)
        {
            var relacion = string.IsNullOrWhiteSpace(request.Relacion) ? null : request.Relacion.Trim();
            if (relacion is { Length: > 30 })
            {
                return Problemas.Validacion("La relación admite máximo 30 caracteres.");
            }

            contacto.Relacion = relacion;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(EmergencyContactDto.From(contacto));
    }

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
            return Problemas.ContactoNoEncontrado();
        }

        _db.EmergencyContacts.Remove(contacto);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
