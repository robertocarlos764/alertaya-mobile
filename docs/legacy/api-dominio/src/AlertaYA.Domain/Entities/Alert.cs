using AlertaYA.Domain.Enums;
using AlertaYA.Domain.ValueObjects;

namespace AlertaYA.Domain.Entities;

/// <summary>
/// Alerta de emergencia. Los textos de presentación (título, subtítulo) y la
/// duración no se almacenan: se derivan. Ver la capacidad alertas-sos.
/// </summary>
public sealed class Alert
{
    private readonly List<AlertNotification> _notifications = [];

    public Guid Id { get; }
    public Guid UserId { get; }
    public AlertStatus Status { get; private set; }
    public AlertType Type { get; }
    public DateTimeOffset StartedAt { get; }
    public DateTimeOffset? EndedAt { get; private set; }

    /// <summary><c>null</c> cuando la ubicación no pudo determinarse.</summary>
    public GeoLocation? Location { get; }

    public IReadOnlyList<AlertNotification> Notifications => _notifications;

    /// <summary>Derivada del intervalo. No existe como columna.</summary>
    public TimeSpan? Duration => EndedAt is null ? null : EndedAt.Value - StartedAt;

    public bool IsActive => Status == AlertStatus.Active;

    private Alert(
        Guid id,
        Guid userId,
        AlertType type,
        DateTimeOffset startedAt,
        GeoLocation? location)
    {
        Id = id;
        UserId = userId;
        Status = AlertStatus.Active;
        Type = type;
        StartedAt = startedAt;
        Location = location;
    }

    public static Alert Activate(
        Guid id,
        Guid userId,
        DateTimeOffset startedAt,
        GeoLocation? location,
        AlertType type = AlertType.Critical)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("La alerta debe pertenecer a una cuenta.", nameof(userId));
        }

        return new Alert(id, userId, type, startedAt, location);
    }

    /// <summary>
    /// Registra un destinatario copiando sus datos actuales, para que el historial
    /// sobreviva a la baja del contacto.
    /// </summary>
    public AlertNotification AddRecipient(Contact contact)
    {
        ArgumentNullException.ThrowIfNull(contact);

        if (!contact.BelongsTo(UserId))
        {
            throw new InvalidOperationException(
                "Un contacto de otra cuenta no puede ser destinatario de esta alerta.");
        }

        var notification = AlertNotification.Pending(Guid.NewGuid(), Id, contact);
        _notifications.Add(notification);
        return notification;
    }

    public void Complete(DateTimeOffset endedAt) => Finish(AlertStatus.Completed, endedAt);

    public void Cancel(DateTimeOffset endedAt) => Finish(AlertStatus.Cancelled, endedAt);

    private void Finish(AlertStatus newStatus, DateTimeOffset endedAt)
    {
        if (!IsActive)
        {
            throw new InvalidOperationException(
                $"Una alerta en estado '{Status}' ya finalizó y no admite cambios.");
        }

        if (endedAt < StartedAt)
        {
            throw new ArgumentOutOfRangeException(
                nameof(endedAt),
                "El cierre no puede ser anterior al inicio.");
        }

        Status = newStatus;
        EndedAt = endedAt;
    }

    public bool BelongsTo(Guid userId) => UserId == userId;
}
