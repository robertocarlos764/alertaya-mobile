using NetTopologySuite.Geometries;

namespace AlertaYA.Domain.Entities;

public class Alert
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Estado { get; set; } = AlertEstados.Pendiente;
    public string CanalActivacion { get; set; } = string.Empty;
    public string? NivelPrioridadIa { get; set; }
    public Point? Ubicacion { get; set; }
    public decimal? UbicacionPrecisionMetros { get; set; }
    public string? UbicacionFuente { get; set; }
    public DateTimeOffset? CreadoEn { get; set; }
    public DateTimeOffset? ActualizadoEn { get; set; }
    public Guid? ClientGeneratedId { get; set; }
}