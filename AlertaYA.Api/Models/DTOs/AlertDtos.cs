using AlertaYA.Api.Models.Entities;

namespace AlertaYA.Api.Models.DTOs;

public record GeoPointDto(double Lat, double Lon)
{
    public static GeoPointDto? From(NetTopologySuite.Geometries.Point? p)
    {
        // NetTopologySuite usa SRID 4326 con X = longitud, Y = latitud.
        return p is null ? null : new GeoPointDto(p.Y, p.X);
    }
}

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

public record CreateAlertRequest(
    string CanalActivacion,
    Guid? ClientGeneratedId,
    GeoPointDto? UbicacionInicial,
    decimal? PrecisionMetros,
    string? Fuente);

public record UpdateAlertStateRequest(string Estado);

public record UpdateAlertLocationRequest(
    double Lat,
    double Lon,
    decimal? PrecisionMetros = null,
    string? Fuente = null,
    DateTimeOffset? Timestamp = null);

/// <summary>
/// Payload del fallback SMS. El parsing crudo del SMS entrante ocurre en una capa anterior
/// (depende del proveedor SMS elegido, decisión pendiente — ver sección 9 de la especificación);
/// este endpoint recibe el resultado ya parseado.
/// </summary>
public record SmsFallbackRequest(
    Guid UserId,
    double Lat,
    double Lon,
    DateTimeOffset Timestamp,
    string Hash,
    Guid? ClientGeneratedId = null,
    string? CanalActivacion = null);