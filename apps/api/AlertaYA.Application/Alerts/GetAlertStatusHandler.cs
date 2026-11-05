using AlertaYA.Application.Abstractions;
using AlertaYA.Application.Options;
using AlertaYA.Domain;
using AlertaYA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AlertaYA.Application.Alerts;

public record EstadoAlerta(
    Alert Alerta,
    IReadOnlyList<NotificationDelivery> Entregas,
    AlertLocation? UltimaUbicacion,
    string TrackingUrl,
    DateTimeOffset ServerNow);

public class GetAlertStatusHandler
{
    private readonly IApplicationDbContext _db;
    private readonly TimeProvider _reloj;
    private readonly PublicOptions _public;

    public GetAlertStatusHandler(IApplicationDbContext db, TimeProvider reloj, IOptions<PublicOptions> opciones)
    {
        _db = db;
        _reloj = reloj;
        _public = opciones.Value;
    }

    public async Task<EstadoAlerta?> ObtenerAsync(Guid userId, Guid alertId, CancellationToken cancellationToken)
    {
        var alerta = await _db.Alerts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == alertId && a.UserId == userId, cancellationToken);
        return alerta is null ? null : await ArmarAsync(alerta, cancellationToken);
    }

    public async Task<EstadoAlerta?> ObtenerActivaAsync(Guid userId, CancellationToken cancellationToken)
    {
        var alerta = await _db.Alerts
            .AsNoTracking()
            .Where(a => a.UserId == userId && AlertEstados.EnCurso.Contains(a.Estado))
            .OrderByDescending(a => a.CreadoEn)
            .FirstOrDefaultAsync(cancellationToken);
        return alerta is null ? null : await ArmarAsync(alerta, cancellationToken);
    }

    private async Task<EstadoAlerta> ArmarAsync(Alert alerta, CancellationToken cancellationToken)
    {
        // El estado de cada contacto sale tal cual de notification_deliveries (SOS-04): nunca se infiere.
        var entregas = await _db.NotificationDeliveries
            .AsNoTracking()
            .Where(d => d.AlertId == alerta.Id && d.Tipo == DeliveryTipos.Alerta)
            .OrderBy(d => d.ContactoNombre)
            .ToListAsync(cancellationToken);

        var ultima = await _db.AlertLocations
            .AsNoTracking()
            .Where(l => l.AlertId == alerta.Id)
            .OrderByDescending(l => l.CapturadaEn ?? l.CreadoEn)
            .FirstOrDefaultAsync(cancellationToken);

        var token = TrackingToken.Derivar(_public.SecretoSeguimientoBytes(), alerta.Id);
        return new EstadoAlerta(alerta, entregas, ultima, _public.UrlSeguimiento(token), _reloj.GetUtcNow());
    }
}
