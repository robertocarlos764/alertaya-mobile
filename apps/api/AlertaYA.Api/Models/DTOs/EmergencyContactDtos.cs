using AlertaYA.Domain.Entities;

namespace AlertaYA.Api.Models.DTOs;

public record EmergencyContactDto(
    Guid Id,
    string Nombre,
    string Telefono,
    string? Relacion,
    DateTimeOffset? CreadoEn)
{
    public static EmergencyContactDto From(EmergencyContact c) => new(
        c.Id,
        c.Nombre,
        c.Telefono,
        c.Relacion,
        c.CreadoEn);
}

public record CreateEmergencyContactRequest(string Nombre, string Telefono, string? Relacion = null);

public record UpdateEmergencyContactRequest(string? Nombre, string? Telefono, string? Relacion);