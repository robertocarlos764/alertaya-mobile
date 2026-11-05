namespace AlertaYA.Application.Alerts;

public record GeoPointDto(double Lat, double Lon);

public record CreateAlertRequest(
    string CanalActivacion,
    Guid? ClientGeneratedId,
    GeoPointDto? UbicacionInicial,
    decimal? PrecisionMetros,
    string? Fuente);
