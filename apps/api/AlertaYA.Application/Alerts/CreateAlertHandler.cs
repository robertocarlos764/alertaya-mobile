using AlertaYA.Application.Abstractions;
using AlertaYA.Application.Options;
using AlertaYA.Domain;
using AlertaYA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AlertaYA.Application.Alerts;

public record CrearAlertaResultado(Alert? Alerta, string? Error);

public class CreateAlertHandler
{
    private readonly IApplicationDbContext _db;
    private readonly TimeProvider _reloj;
    private readonly PublicOptions _public;

    public CreateAlertHandler(IApplicationDbContext db, TimeProvider reloj, IOptions<PublicOptions> opciones)
    {
        _db = db;
        _reloj = reloj;
        _public = opciones.Value;
    }

    public async Task<CrearAlertaResultado> EjecutarAsync(Guid userId, CreateAlertRequest request, CancellationToken cancellationToken)
    {
        if (!AlertCanalActivacion.EsValido(request.CanalActivacion))
        {
            return Rechazo($"'canalActivacion' inválido. Permitidos: {string.Join(", ", AlertCanalActivacion.Todos)}.");
        }

        if (!request.ClientGeneratedId.HasValue)
        {
            return Rechazo("'clientGeneratedId' es obligatorio para garantizar idempotencia ante reintentos.");
        }

        if (request.Fuente is not null && !FuenteUbicacion.EsValido(request.Fuente))
        {
            return Rechazo($"'fuente' inválido. Permitidos: {string.Join(", ", FuenteUbicacion.Todos)}.");
        }

        var ubicacion = request.UbicacionInicial;
        if (ubicacion is not null && !Coordenadas.EsValida(ubicacion.Lat, ubicacion.Lon))
        {
            return Rechazo("'ubicacionInicial' fuera de rango o en (0,0).");
        }

        var existente = await BuscarAsync(userId, request.ClientGeneratedId.Value, cancellationToken);
        if (existente is not null)
        {
            return new CrearAlertaResultado(existente, null);
        }

        var ahora = _reloj.GetUtcNow();
        var alerta = new Alert
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            // Nace activa: la cuenta regresiva del cliente ya la confirmo (Pitfall 3).
            Estado = AlertEstados.Activa,
            CanalActivacion = request.CanalActivacion,
            // Sin ubicacion no se guarda ni coordenada ni precision ni fuente (UBIC-02).
            Ubicacion = ubicacion is null ? null : GeoPointExtensions.ToPoint4326(ubicacion.Lat, ubicacion.Lon),
            UbicacionPrecisionMetros = ubicacion is null ? null : request.PrecisionMetros,
            UbicacionFuente = ubicacion is null ? null : request.Fuente,
            ClientGeneratedId = request.ClientGeneratedId,
            CreadoEn = ahora,
        };
        _db.Alerts.Add(alerta);

        _db.TrackingLinks.Add(new TrackingLink
        {
            Id = Guid.NewGuid(),
            AlertId = alerta.Id,
            TokenHash = TrackingToken.Hash(TrackingToken.Derivar(_public.SecretoSeguimientoBytes(), alerta.Id)),
            CreadoEn = ahora,
        });

        var contactos = await _db.EmergencyContacts
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .ToListAsync(cancellationToken);

        foreach (var contacto in contactos)
        {
            _db.NotificationDeliveries.Add(new NotificationDelivery
            {
                Id = Guid.NewGuid(),
                AlertId = alerta.Id,
                ContactId = contacto.Id,
                Canal = DeliveryCanales.Sms,
                Tipo = DeliveryTipos.Alerta,
                Estado = DeliveryEstados.EnCola,
                ContactoNombre = contacto.Nombre,
                ContactoTelefono = contacto.Telefono,
                ProximoIntentoEn = ahora,
                CreadoEn = ahora,
                ActualizadoEn = ahora,
            });
        }

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (_db.EsViolacionDeUnicidad(ex))
        {
            // Carrera: un reintento concurrente del cliente creo la alerta primero. El indice unico
            // (user_id, client_generated_id) evita el duplicado y se devuelve la existente.
            var duplicada = await BuscarAsync(userId, request.ClientGeneratedId.Value, cancellationToken)
                            ?? throw new InvalidOperationException("Violación de unicidad sin alerta existente.", ex);
            return new CrearAlertaResultado(duplicada, null);
        }

        return new CrearAlertaResultado(alerta, null);
    }

    private Task<Alert?> BuscarAsync(Guid userId, Guid clientGeneratedId, CancellationToken cancellationToken)
        => _db.Alerts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId && a.ClientGeneratedId == clientGeneratedId, cancellationToken);

    private static CrearAlertaResultado Rechazo(string error) => new(null, error);
}
