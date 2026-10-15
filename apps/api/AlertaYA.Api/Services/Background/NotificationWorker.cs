using AlertaYA.Api.Services.Abstractions;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AlertaYA.Api.Services.Background;

/// <summary>
/// Consume los eventos <c>AlertCreated</c> y notifica a los contactos de emergencia del usuario
/// con la ubicación disponible en ese momento (sección 7 de la especificación).
/// El envío real queda en manos de <c>INotificationService</c> (stub en esta fase).
/// </summary>
public class NotificationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IAlertEventQueue _queue;
    private readonly ILogger<NotificationWorker> _logger;

    public NotificationWorker(
        IServiceScopeFactory scopeFactory,
        IAlertEventQueue queue,
        ILogger<NotificationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _queue = queue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var alertaEvent = await _queue.DequeueForNotificationAsync(stoppingToken);
            if (alertaEvent is null)
            {
                continue;
            }

            try
            {
                await ProcesarAsync(alertaEvent, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Notificación falló para la alerta {AlertId}",
                    alertaEvent.AlertId);
            }
        }
    }

    private async Task ProcesarAsync(AlertCreatedEvent alertaEvent, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var alerta = await db.Alerts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == alertaEvent.AlertId, cancellationToken);
        if (alerta is null)
        {
            _logger.LogWarning("Alerta {AlertId} no encontrada al notificar. Se omite.", alertaEvent.AlertId);
            return;
        }

        // Todos los contactos se notifican a la vez; no hay prioridad ni escalonamiento (sección 4).
        var contactos = await db.EmergencyContacts
            .AsNoTracking()
            .Where(c => c.UserId == alerta.UserId)
            .ToListAsync(cancellationToken);

        var notificador = scope.ServiceProvider.GetRequiredService<INotificationService>();
        await notificador.NotifySosAsync(alerta, contactos, cancellationToken);
    }
}