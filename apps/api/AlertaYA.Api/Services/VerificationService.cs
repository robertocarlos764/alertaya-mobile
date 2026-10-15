using AlertaYA.Api.Services.Abstractions;
using AlertaYA.Domain;
using AlertaYA.Domain.Entities;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace AlertaYA.Api.Services;

/// <summary>
/// Heurística inicial de verificación de alertas, basada en reglas simples y explícitas.
///
/// IMPORTANTE (sección 7 de la especificación): cada regla está documentada con el "porqué"
/// para poder reemplazarla en una fase posterior por un modelo entrenado sin perder el
/// razonamiento original.
/// </summary>
public class VerificationService : IVerificationService
{
    private readonly AppDbContext _db;

    /// <summary>Umbral en metros sobre el que una ubicación GPS reciente contradice una celular.</summary>
    private const double UmbralContradiccionMetros = 500;

    /// <summary>Ventana en minutos para considerar una ubicación GPS "reciente".</summary>
    private const double VentanaRecienteMinutos = 5;

    public VerificationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<VerificationResult> EvaluateAsync(Alert alert, CancellationToken cancellationToken)
    {
        decimal? movimientoScore = null;
        decimal? audioAmbienteScore = null;
        bool? consistenciaUbicacion = null;
        string nivel;

        // REGLA R1 — canal "voz" o "boton_fisico" → prioridad critica por defecto.
        // POR QUÉ: ambos canales implican una acción física/intencional de la persona (hablar
        // por micrófono, pulsar un botón físico dedicado). Son canales mucho menos propensos a
        // activación accidental que un botón táctil de la app, y en un botón físico la persona
        // suele no tener el teléfono a mano (p. ej. colgada). El sistema debe tratar la alerta
        // como de máxima urgencia mientras no haya evidencia en contra.
        if (alert.CanalActivacion is AlertCanalActivacion.Voz or AlertCanalActivacion.BotonFisico)
        {
            nivel = NivelPrioridadIa.Critico;
        }
        // REGLA R2 — canal "boton_pulsado" → prioridad "medio" por defecto.
        // POR QUÉ: el botón táctil de la app puede activarse por accidente (bolsillo, pantalla
        // bloqueada). Partimos de urgencia media y se ajusta con la verificación posterior.
        else
        {
            nivel = NivelPrioridadIa.Medio;
        }

        // REGLA R3 — consistencia de ubicacion.
        // POR QUÉ: si la alerta llega con fuente "celular" (red/antena, poco precisa) pero en
        // los minutos inmediatamente previos existía una ubicación GPS reciente que la contradice
        // a más de un umbral, hay evidencia de que la alerta no refleja la posición real de la
        // persona → posible falso positivo o al menos señal de que la ubicación no es confiable.
        if (alert.UbicacionFuente == FuenteUbicacion.Celular && alert.CreadoEn.HasValue && alert.Ubicacion is not null)
        {
            consistenciaUbicacion = await EsConsistenteConGpsRecienteAsync(alert, cancellationToken);
            if (consistenciaUbicacion == false)
            {
                nivel = NivelPrioridadIa.PosibleFalsoPositivo;
            }
        }

        // REGLA R4 — hora del día como señal contextual.
        // POR QUÉ: no aporta en si misma un nivel, pero queda registrada para el panel del CAI
        // y para un futuro modelo, que podrá correlacionar franjas horarias de mayor riesgo.
        var horaDelDia = TimeOnly.FromTimeSpan(alert.CreadoEn?.TimeOfDay
                                               ?? DateTimeOffset.UtcNow.TimeOfDay);

        // REGLA R5 — puntaje de movimiento aproximado por la fuente de ubicación.
        // POR QUÉ: la fuente de la ubicación es el único proxy disponible en esta fase de la
        // fiabilidad de la posición (GPS = confiable, cache = desconocido). No hay datos de
        // sensores todavía; cuando existan, esta regla se reemplaza por el modelo.
        movimientoScore = alert.UbicacionFuente switch
        {
            FuenteUbicacion.Gps => 0.8m,
            FuenteUbicacion.Celular => 0.5m,
            _ => null,
        };

        // Mapeo de resultado → estado. Ver nota en VerificationWorker sobre el compromiso
        // con la máquina de estados de la sección 8.
        var estadoResultante = nivel == NivelPrioridadIa.PosibleFalsoPositivo
            ? AlertEstados.Verificando
            : AlertEstados.Activa;

        return new VerificationResult(
            MovimientoScore: movimientoScore,
            AudioAmbienteScore: audioAmbienteScore,
            ConsistenciaUbicacion: consistenciaUbicacion,
            HoraDelDia: horaDelDia,
            NivelAsignado: nivel,
            EstadoResultante: estadoResultante);
    }

    /// <summary>
    /// Regla R3 (detalle): true si la ubicacion celular de la alerta es consistente con el
    /// último GPS reciente conocido del usuario; false si hay una contradiccion clara;
    /// null si no hay evidencia suficiente para juzgar.
    /// </summary>
    private async Task<bool?> EsConsistenteConGpsRecienteAsync(Alert alert, CancellationToken cancellationToken)
    {
        // Buscar en el historial de la alerta una ubicación GPS previa que contraste con la
        // celular recibida. En esta fase se consulta la propia alerta (alert_locations + la
        // última ubicación conocida); en una fase posterior puede ampliarse al historial del
        // dispositivo si la base de datos lo soporta.
        var gpsReciente = await _db.AlertLocations
            .AsNoTracking()
            .Where(l => l.AlertId == alert.Id
                        && l.Fuente == FuenteUbicacion.Gps
                        && l.CreadoEn != null)
            .OrderByDescending(l => l.CreadoEn)
            .FirstOrDefaultAsync(cancellationToken);

        if (gpsReciente is null || gpsReciente.CreadoEn is null || !alert.CreadoEn.HasValue)
        {
            return null;
        }

        var diferencia = (alert.CreadoEn.Value - gpsReciente.CreadoEn.Value).TotalMinutes;
        if (diferencia > VentanaRecienteMinutos)
        {
            return null;
        }

        var distanciaMetros = ObtenerDistanciaMetros(gpsReciente.Ubicacion, alert.Ubicacion!);
        return distanciaMetros <= UmbralContradiccionMetros;
    }

    private static double ObtenerDistanciaMetros(Point a, Point b)
    {
        // Aproximación de distancia plano-esférica (fórmula de haversine) suficiente para el
        // umbral de cientos de metros; no se necesita precisión sub-métrica en esta heurística.
        const double radioTierra = 6371000.0;
        var dLat = ToRadians(b.Y - a.Y);
        var dLon = ToRadians(b.X - a.X);
        var sinLat = Math.Sin(dLat / 2);
        var sinLon = Math.Sin(dLon / 2);
        var h = sinLat * sinLat + Math.Cos(ToRadians(a.Y)) * Math.Cos(ToRadians(b.Y)) * sinLon * sinLon;
        return 2 * radioTierra * Math.Asin(Math.Sqrt(h));
    }

    private static double ToRadians(double grados) => grados * Math.PI / 180.0;
}