namespace AlertaYA.Api.Models.Entities;

public class VerificationLog
{
    public Guid Id { get; set; }
    public Guid AlertId { get; set; }
    public decimal? MovimientoScore { get; set; }
    public decimal? AudioAmbienteScore { get; set; }
    public bool? ConsistenciaUbicacion { get; set; }
    public TimeOnly? HoraDelDia { get; set; }
    public string? NivelAsignado { get; set; }
    public DateTimeOffset? CreadoEn { get; set; }
}