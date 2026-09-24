namespace AlertaYA.Api.Models.Entities;

public class EmergencyContact
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string? Relacion { get; set; }
    public DateTimeOffset? CreadoEn { get; set; }
}