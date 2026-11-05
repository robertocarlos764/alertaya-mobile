namespace AlertaYA.Domain.Entities;

public class TrackingLink
{
    public Guid Id { get; set; }
    public Guid AlertId { get; set; }
    public byte[] TokenHash { get; set; } = Array.Empty<byte>();
    public DateTimeOffset? RevocadoEn { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
}
