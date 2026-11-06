namespace AlertaYA.Domain.Entities;

// ContactoNombre/ContactoTelefono son copia del contacto al crear la alerta: editarlo despues no cambia el aviso.
public class NotificationDelivery
{
    public Guid Id { get; set; }
    public Guid AlertId { get; set; }
    public Guid? ContactId { get; set; }
    public string Canal { get; set; } = DeliveryCanales.Sms;
    public string Tipo { get; set; } = DeliveryTipos.Alerta;
    public string Estado { get; set; } = DeliveryEstados.EnCola;
    public string ContactoNombre { get; set; } = string.Empty;
    public string ContactoTelefono { get; set; } = string.Empty;
    public int Intentos { get; set; }
    public DateTimeOffset ProximoIntentoEn { get; set; }
    public DateTimeOffset? LeaseHasta { get; set; }
    public string? ProveedorSid { get; set; }
    public int? CodigoError { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public DateTimeOffset ActualizadoEn { get; set; }
}
