using AlertaYA.Domain.Entities;

namespace AlertaYA.Api.Models.DTOs;

public record UbicacionDto(
    double? Lat,
    double? Lon,
    decimal? PrecisionMetros,
    string? Fuente);

public record AlertResponse(
    Guid Id,
    Guid UserId,
    string Estado,
    string CanalActivacion,
    string? NivelPrioridadIa,
    UbicacionDto? Ubicacion,
    DateTimeOffset? CreadoEn,
    DateTimeOffset? ActualizadoEn,
    Guid? ClientGeneratedId)
{
    public static AlertResponse From(Alert a) => new(
        a.Id,
        a.UserId,
        a.Estado,
        a.CanalActivacion,
        a.NivelPrioridadIa,
        a.Ubicacion is null ? null : new UbicacionDto(a.Ubicacion.Y, a.Ubicacion.X, a.UbicacionPrecisionMetros, a.UbicacionFuente),
        a.CreadoEn,
        a.ActualizadoEn,
        a.ClientGeneratedId);
}

public record AlertStatusResponse(
    Guid Id,
    string Estado,
    string CanalActivacion,
    string? NivelPrioridadIa,
    UbicacionDto? Ubicacion,
    DateTimeOffset? CreadoEn,
    DateTimeOffset? ActualizadoEn)
{
    public static AlertStatusResponse From(Alert a) => new(
        a.Id,
        a.Estado,
        a.CanalActivacion,
        a.NivelPrioridadIa,
        a.Ubicacion is null ? null : new UbicacionDto(a.Ubicacion.Y, a.Ubicacion.X, a.UbicacionPrecisionMetros, a.UbicacionFuente),
        a.CreadoEn,
        a.ActualizadoEn);
}

public record UpdateAlertLocationRequest(
    double Lat,
    double Lon,
    decimal? PrecisionMetros = null,
    string? Fuente = null,
    DateTimeOffset? Timestamp = null);
