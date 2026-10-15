using AlertaYA.Api.Services.Abstractions;
using AlertaYA.Domain.Entities;

namespace AlertaYA.Api.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public Task NotifySosAsync(Alert alert, IReadOnlyList<EmergencyContact> contactos, CancellationToken cancellationToken)
    {
        // STUB deliberado (sección 7/9 de la especificación): el proveedor de notificaciones
        // (push, SMS, etc.) aún no está definido. Este registro deja constancia de la intención
        // de notificación (qué contactos, con qué ubicación) para sustituirlo por el proveedor
        // real sin cambiar el flujo de los workers.
        foreach (var contacto in contactos)
        {
            _logger.LogInformation(
                "[SOS-STUB] Notificación a {Contacto} ({Telefono}) para alerta {AlertId}: " +
                "lat {Lat}, lon {Lon}, precision {Precision}m, fuente {Fuente}",
                contacto.Nombre,
                contacto.Telefono,
                alert.Id,
                alert.Ubicacion?.Y,
                alert.Ubicacion?.X,
                alert.UbicacionPrecisionMetros,
                alert.UbicacionFuente);
        }

        return Task.CompletedTask;
    }
}