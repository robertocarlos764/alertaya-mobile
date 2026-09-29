using AlertaYA.Api.Models.Entities;

namespace AlertaYA.Api.Services.Abstractions;

/// <summary>
/// Envío de notificaciones SOS a los contactos de emergencia.
/// El proveedor real (push, SMS, etc.) aún no está definido en esta fase; la implementación
/// provista registra la intención de notificación para poder reemplazarla por un proveedor
/// real sin cambiar el flujo.
/// </summary>
public interface INotificationService
{
    Task NotifySosAsync(Alert alert, IReadOnlyList<EmergencyContact> contactos, CancellationToken cancellationToken);
}