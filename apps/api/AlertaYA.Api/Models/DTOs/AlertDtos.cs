using AlertaYA.Application.Alerts;
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

public record UbicacionConfirmadaDto(double Lat, double Lon, decimal? PrecisionMetros, DateTimeOffset CapturadaEn);

// Estado es el valor crudo de notification_deliveries.estado; la app lo traduce en un solo componente.
public record EntregaContactoDto(Guid? ContactId, string Nombre, string Telefono, string Estado, int Intentos);

public record AlertStatusResponse(
    Guid Id,
    string Estado,
    string CanalActivacion,
    DateTimeOffset? CreadoEn,
    DateTimeOffset? FinalizadaEn,
    DateTimeOffset ServerNow,
    string TrackingUrl,
    UbicacionConfirmadaDto? UltimaUbicacion,
    IReadOnlyList<EntregaContactoDto> Contactos)
{
    public static AlertStatusResponse From(EstadoAlerta e) => new(
        e.Alerta.Id,
        e.Alerta.Estado,
        e.Alerta.CanalActivacion,
        e.Alerta.CreadoEn,
        e.Alerta.FinalizadaEn,
        e.ServerNow,
        e.TrackingUrl,
        e.UltimaUbicacion is { } l
            ? new UbicacionConfirmadaDto(l.Ubicacion.Y, l.Ubicacion.X, l.PrecisionMetros, (l.CapturadaEn ?? l.CreadoEn)!.Value)
            : null,
        e.Entregas.Select(d => new EntregaContactoDto(d.ContactId, d.ContactoNombre, d.ContactoTelefono, d.Estado, d.Intentos)).ToList());
}

public record UpdateAlertLocationRequest(
    double Lat,
    double Lon,
    decimal? PrecisionMetros = null,
    string? Fuente = null,
    DateTimeOffset? Timestamp = null);
