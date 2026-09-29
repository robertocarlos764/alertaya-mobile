using AlertaYA.Domain.Enums;
using AlertaYA.Domain.ValueObjects;

namespace AlertaYA.Domain.Entities;

/// <summary>
/// Envío a un destinatario concreto. Copia nombre y teléfono del contacto en el
/// instante de la alerta: un registro de emergencias debe reflejar el estado del
/// mundo cuando ocurrió, aunque el contacto se elimine después.
/// </summary>
public sealed class AlertNotification
{
    public const int MaxAttempts = 3;

    public Guid Id { get; }
    public Guid AlertId { get; }

    /// <summary><c>null</c> si el contacto se eliminó después de la alerta.</summary>
    public Guid? ContactId { get; private set; }

    public string ContactName { get; }
    public PhoneNumber ContactPhone { get; }
    public DeliveryStatus Status { get; private set; }
    public string? ProviderId { get; private set; }
    public string? Error { get; private set; }
    public int Attempts { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }

    public bool CanRetry => Status == DeliveryStatus.Failed && Attempts < MaxAttempts;

    private AlertNotification(
        Guid id,
        Guid alertId,
        Guid? contactId,
        string contactName,
        PhoneNumber contactPhone)
    {
        Id = id;
        AlertId = alertId;
        ContactId = contactId;
        ContactName = contactName;
        ContactPhone = contactPhone;
        Status = DeliveryStatus.Pending;
        Attempts = 0;
    }

    public static AlertNotification Pending(Guid id, Guid alertId, Contact contact)
    {
        ArgumentNullException.ThrowIfNull(contact);

        return new AlertNotification(
            id,
            alertId,
            contact.Id,
            contact.Name.Value,
            contact.Phone);
    }

    /// <summary>
    /// Marca el envío como entregado. Un destinatario ya entregado no vuelve a
    /// enviarse: evita el duplicado tras un reintento.
    /// </summary>
    public void MarkSent(string providerId, DateTimeOffset sentAt)
    {
        if (Status == DeliveryStatus.Sent)
        {
            throw new InvalidOperationException(
                "Este destinatario ya fue notificado; reenviarlo lo duplicaría.");
        }

        if (string.IsNullOrWhiteSpace(providerId))
        {
            throw new ArgumentException(
                "El proveedor debe devolver un identificador de mensaje.", nameof(providerId));
        }

        Attempts++;
        Status = DeliveryStatus.Sent;
        ProviderId = providerId;
        Error = null;
        SentAt = sentAt;
    }

    public void MarkFailed(string error)
    {
        if (Status == DeliveryStatus.Sent)
        {
            throw new InvalidOperationException(
                "Un envío ya entregado no puede marcarse como fallido.");
        }

        Attempts++;
        Status = DeliveryStatus.Failed;
        Error = string.IsNullOrWhiteSpace(error) ? "Error no especificado." : error;
    }

    /// <summary>El contacto se eliminó; el registro histórico conserva sus datos.</summary>
    public void DetachContact() => ContactId = null;
}
