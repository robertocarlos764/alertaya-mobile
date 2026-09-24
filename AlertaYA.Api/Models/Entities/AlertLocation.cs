using NetTopologySuite.Geometries;

namespace AlertaYA.Api.Models.Entities;

public class AlertLocation
{
    public Guid Id { get; set; }
    public Guid AlertId { get; set; }
    public Point Ubicacion { get; set; } = null!;
    public decimal? PrecisionMetros { get; set; }
    public string Fuente { get; set; } = Domain.FuenteUbicacion.Gps;
    public DateTimeOffset? CreadoEn { get; set; }
}