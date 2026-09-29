namespace AlertaYA.Api.Services.Abstractions;

/// <summary>Evento publicado al crear una alerta. Consumido de forma asíncrona por los workers.</summary>
public sealed record AlertCreatedEvent(Guid AlertId, Guid UserId);

/// <summary>
/// Cola interna de procesamiento asíncrono (sección 7 de la especificación).
/// Pensada para fase inicial: <c>Channel</c> en memoria, sin infraestructura externa de
/// mensajería. Cada suscriptor recibe una copia del evento (el mismo alert se procesa
/// tanto por verificación como por notificación).
/// </summary>
public interface IAlertEventQueue
{
    void Enqueue(AlertCreatedEvent alertEvent);

    ValueTask<AlertCreatedEvent?> DequeueForVerificationAsync(CancellationToken cancellationToken);

    ValueTask<AlertCreatedEvent?> DequeueForNotificationAsync(CancellationToken cancellationToken);
}