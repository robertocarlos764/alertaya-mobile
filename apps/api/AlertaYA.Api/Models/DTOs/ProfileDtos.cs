using AlertaYA.Domain.Entities;

namespace AlertaYA.Api.Models.DTOs;

public record ProfileDto(
    Guid Id,
    string Nombre,
    string Telefono,
    string? Correo,
    string? PalabraClave,
    int VentanaConfirmacionSegundos,
    bool ModoSilencioso,
    DateTimeOffset? CreadoEn)
{
    public static ProfileDto From(Profile p) => new(
        p.Id,
        p.Nombre,
        p.Telefono,
        p.Correo,
        p.PalabraClave,
        p.VentanaConfirmacionSegundos,
        p.ModoSilencioso,
        p.CreadoEn);
}

/// <summary>
/// Los campos <c>ventanaConfirmacionSegundos</c> y <c>modoSilencioso</c> se incluyen solo
/// para poder DETECTAR que vienen en el body y rechazarlos (regla de negocio: solo un rol de
/// administrador puede modificarlos, sección 4 de la especificación).
/// </summary>
public record UpdateProfileRequest(
    string? Nombre,
    string? Telefono,
    string? PalabraClave,
    int? VentanaConfirmacionSegundos = null,
    bool? ModoSilencioso = null);