using NetTopologySuite.Geometries;

namespace AlertaYA.Domain.Entities;

public class AlertLocation
{
    public Guid Id { get; set; }
    public Guid AlertId { get; set; }
    public Point Ubicacion { get; set; } = null!;
    public decimal? PrecisionMetros { get; set; }
    public string Fuente { get; set; } = FuenteUbicacion.Gps;
    public DateTimeOffset? CreadoEn { get; set; }
    public DateTimeOffset? CapturadaEn { get; set; }
}