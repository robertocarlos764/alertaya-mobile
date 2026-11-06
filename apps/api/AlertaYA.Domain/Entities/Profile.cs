namespace AlertaYA.Domain.Entities;

public class Profile
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string? Correo { get; set; }
    public string? PalabraClave { get; set; }
    public int VentanaConfirmacionSegundos { get; set; } = 4;
    public bool ModoSilencioso { get; set; }
    public DateTimeOffset? CreadoEn { get; set; }
}