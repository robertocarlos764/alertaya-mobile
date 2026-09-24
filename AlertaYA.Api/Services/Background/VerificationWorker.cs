using AlertaYA.Api.Data;
using AlertaYA.Api.Domain;
using AlertaYA.Api.Models.Entities;
using AlertaYA.Api.Services.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace AlertaYA.Api.Services.Background;

/// <summary>
/// Consume los eventos <c>AlertCreated</c> y ejecuta la verificación heurística de la alerta
/// (sección 7 de la especificación). Guarda el resultado en <c>verification_logs</c> y
/// actualiza <c>alerts.nivel_prioridad_ia</c> y <c>alerts.estado</c>.
/// Nunca bloquea el endpoint de creación: el evento llega por la cola.
/// </summary>
public class VerificationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IAlertEventQueue _queue;
    private readonly ILogger<VerificationWorker> _logger;

    public VerificationWorker(
        IServiceScopeFactory scopeFactory,
        IAlertEventQueue queue,
        ILogger<VerificationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _queue = queue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var alertaEvent = await _queue.DequeueForVerificationAsync(stoppingToken);
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
                    "Verificación falló para la alerta {AlertId}",
                    alertaEvent.AlertId);
            }
        }
    }

    private async Task ProcesarAsync(AlertCreatedEvent alertaEvent, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var alerta = await db.Alerts.FirstOrDefaultAsync(a => a.Id == alertaEvent.AlertId, cancellationToken);
        if (alerta is null)
        {
            _logger.LogWarning("Alerta {AlertId} no encontrada al verificar. Se omite.", alertaEvent.AlertId);
            return;
        }

        var verificacion = await scope.ServiceProvider
            .GetRequiredService<IVerificationService>()
            .EvaluateAsync(alerta, cancellationToken);

        db.VerificationLogs.Add(new VerificationLog
        {
            Id = Guid.NewGuid(),
            AlertId = alerta.Id,
            MovimientoScore = verificacion.MovimientoScore,
            AudioAmbienteScore = verificacion.AudioAmbienteScore,
            ConsistenciaUbicacion = verificacion.ConsistenciaUbicacion,
            HoraDelDia = verificacion.HoraDelDia,
            NivelAsignado = verificacion.NivelAsignado,
            CreadoEn = DateTimeOffset.UtcNow,
        });

        alerta.NivelPrioridadIa = verificacion.NivelAsignado;

        // La máquina de estados (sección 8) no permite "pendiente → verificando". La heurística
        // puede sugerir "verificando" para un posible falso positivo recién creado, pero ese
        // resultado se registra en verification_logs y el nivel se conserva para el panel del CAI;
        // solo se aplica "verificando" si la alerta ya estaba "activa" (transición válida). En la
        // práctica, una alerta nueva con posible falso positivo queda "activa" marcada para revisión.
        var objetivo = verificacion.EstadoResultante;
        if (!AlertStateMachine.PuedeTransicionar(alerta.Estado, objetivo))
        {
            _logger.LogInformation(
                "Alerta {AlertId}: transición {Actual} → {Objetivo} no permitida por la máquina de " +
                "estados; se mantiene/activa. Resultado verificación: {Nivel}",
                alerta.Id, alerta.Estado, objetivo, verificacion.NivelAsignado);
            objetivo = AlertEstados.Activa;
        }

        if (alerta.Estado != objetivo)
        {
            alerta.Estado = objetivo;
            alerta.ActualizadoEn = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}