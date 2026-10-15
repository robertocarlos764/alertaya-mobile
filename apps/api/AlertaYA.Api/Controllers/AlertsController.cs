using AlertaYA.Api.Extensions;
using AlertaYA.Api.Models.DTOs;
using AlertaYA.Api.Services.Abstractions;
using AlertaYA.Domain;
using AlertaYA.Domain.Entities;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace AlertaYA.Api.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    // Estados en los que la alerta sigue vigente y puede ir acumulando ubicaciones en su historial.
    private static readonly string[] EstadosReceptoresDeUbicacion =
    {
        AlertEstados.Activa, AlertEstados.Verificando, AlertEstados.Escalada,
    };

    private readonly AppDbContext _db;
    private readonly IAlertEventQueue _queue;

    public AlertsController(AppDbContext db, IAlertEventQueue queue)
    {
        _db = db;
        _queue = queue;
    }

    private Guid GetUserIdOrFail() => User.GetUserId() ?? throw new UnauthorizedAccessException();

    private bool EsEstadoReceptorDeUbicacion(string estado) => EstadosReceptoresDeUbicacion.Contains(estado);

    /// <summary>
    /// Crea una alerta. Es IDEMPOTENTE (sección 6): el cliente envía un <c>clientGeneratedId</c>
    /// y si el backend ya registró una alerta con ese id para el usuario, devuelve la existente en
    /// lugar de duplicar. La escritura en <c>alerts</c> es síncrona; la verificación IA y las
    /// notificaciones se encolan y nunca retrasan la respuesta.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AlertResponse>> Create([FromBody] CreateAlertRequest request, CancellationToken cancellationToken)
    {
        Guid userId;
        try
        {
            userId = GetUserIdOrFail();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        if (!AlertCanalActivacion.EsValido(request.CanalActivacion))
        {
            return BadRequest(new
            {
                error = $"'canalActivacion' inválido. Permitidos: {string.Join(", ", AlertCanalActivacion.Todos)}.",
            });
        }

        if (!request.ClientGeneratedId.HasValue)
        {
            return BadRequest(new { error = "'clientGeneratedId' es obligatorio para garantizar idempotencia ante reintentos." });
        }

        if (request.Fuente is not null && !FuenteUbicacion.EsValido(request.Fuente))
        {
            return BadRequest(new { error = $"'fuente' inválido. Permitidos: {string.Join(", ", FuenteUbicacion.Todos)}." });
        }

        // Idempotencia: ¿ya existe una alerta con este clientGeneratedId para ESTE usuario?
        var existente = await _db.Alerts
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.UserId == userId && a.ClientGeneratedId == request.ClientGeneratedId,
                cancellationToken);

        if (existente is not null)
        {
            return CreatedAtAction(nameof(GetStatus), new { id = existente.Id }, AlertResponse.From(existente));
        }

        var ahora = DateTimeOffset.UtcNow;
        var alerta = new Alert
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Estado = AlertEstados.Pendiente,
            CanalActivacion = request.CanalActivacion,
            Ubicacion = request.UbicacionInicial is null ? null : GeoPointExtensions.ToPoint4326(request.UbicacionInicial.Lat, request.UbicacionInicial.Lon),
            UbicacionPrecisionMetros = request.PrecisionMetros,
            UbicacionFuente = request.Fuente,
            ClientGeneratedId = request.ClientGeneratedId,
            CreadoEn = ahora,
        };

        _db.Alerts.Add(alerta);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsViolacionUnico(ex))
        {
            // Carrera: otra réplica (o reintento concurrente del cliente) creó la alerta primero.
            // El índice único (user_id, client_generated_id) protege contra duplicados; se devuelve
            // la existente para que el cliente siga el mismo flujo que una creación normal.
            var duplicada = await _db.Alerts
                .AsNoTracking()
                .FirstAsync(
                    a => a.UserId == userId && a.ClientGeneratedId == request.ClientGeneratedId,
                    cancellationToken);
            return CreatedAtAction(nameof(GetStatus), new { id = duplicada.Id }, AlertResponse.From(duplicada));
        }

        // Disparo asíncrono de verificación IA y notificaciones (sección 7). No bloquea la respuesta.
        _queue.Enqueue(new AlertCreatedEvent(alerta.Id, userId));

        return CreatedAtAction(nameof(GetStatus), new { id = alerta.Id }, AlertResponse.From(alerta));
    }

    /// <summary>
    /// Actualiza el estado de la alerta validando pertenencia y que la transición sea válida
    /// según la máquina de estados (sección 8).
    /// </summary>
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<AlertStatusResponse>> UpdateState(Guid id, [FromBody] UpdateAlertStateRequest request, CancellationToken cancellationToken)
    {
        Guid userId;
        try
        {
            userId = GetUserIdOrFail();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var alerta = await _db.Alerts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, cancellationToken);

        if (alerta is null)
        {
            return NotFound(new { error = "Alerta no encontrada." });
        }

        if (!AlertEstados.EsValido(request.Estado))
        {
            return BadRequest(new { error = $"'estado' inválido. Permitidos: {string.Join(", ", AlertEstados.Todos)}." });
        }

        if (!AlertStateMachine.PuedeTransicionar(alerta.Estado, request.Estado))
        {
            return BadRequest(new
            {
                error = $"Transición de estado no permitida: '{alerta.Estado}' → '{request.Estado}'.",
                estadoActual = alerta.Estado,
                transicionesPermitidas = AlertStateMachine.TransicionesPermitidas(alerta.Estado),
            });
        }

        alerta.Estado = request.Estado;
        alerta.ActualizadoEn = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(AlertStatusResponse.From(alerta));
    }

    /// <summary>
    /// Registra una ubicación nueva en el historial (<c>alert_locations</c>) y actualiza
    /// <c>alerts.ubicacion</c> con el mismo valor, en la misma transacción (sección 6/7 de la
    /// especificación y esquema de <c>alert_locations</c>).
    /// </summary>
    [HttpPost("{id:guid}/location")]
    public async Task<ActionResult<AlertStatusResponse>> AddLocation(Guid id, [FromBody] UpdateAlertLocationRequest request, CancellationToken cancellationToken)
    {
        Guid userId;
        try
        {
            userId = GetUserIdOrFail();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var alerta = await _db.Alerts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, cancellationToken);

        if (alerta is null)
        {
            return NotFound(new { error = "Alerta no encontrada." });
        }

        if (!EsEstadoReceptorDeUbicacion(alerta.Estado))
        {
            return Conflict(new
            {
                error = $"La alerta está en estado '{alerta.Estado}' y no acepta actualizaciones de ubicación.",
                estadoActual = alerta.Estado,
            });
        }

        var fuente = string.IsNullOrWhiteSpace(request.Fuente) ? FuenteUbicacion.Gps : request.Fuente;
        if (!FuenteUbicacion.EsValido(fuente))
        {
            return BadRequest(new { error = $"'fuente' inválido. Permitidos: {string.Join(", ", FuenteUbicacion.Todos)}." });
        }

        var ubicacionPoint = GeoPointExtensions.ToPoint4326(request.Lat, request.Lon);

        // Insertar fila nueva en alert_locations y sobrescribir la última ubicación de la alerta.
        _db.AlertLocations.Add(new AlertLocation
        {
            Id = Guid.NewGuid(),
            AlertId = alerta.Id,
            Ubicacion = ubicacionPoint,
            PrecisionMetros = request.PrecisionMetros,
            Fuente = fuente,
            CreadoEn = DateTimeOffset.UtcNow,
        });

        alerta.Ubicacion = ubicacionPoint;
        alerta.UbicacionPrecisionMetros = request.PrecisionMetros;
        alerta.UbicacionFuente = fuente;
        alerta.ActualizadoEn = DateTimeOffset.UtcNow;

        // SaveChanges ejecuta ambas operaciones en una sola transacción.
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(AlertStatusResponse.From(alerta));
    }

    /// <summary>Devuelve el estado actual de la alerta, validando que pertenezca al usuario autenticado.</summary>
    [HttpGet("{id:guid}/status")]
    public async Task<ActionResult<AlertStatusResponse>> GetStatus(Guid id, CancellationToken cancellationToken)
    {
        Guid userId;
        try
        {
            userId = GetUserIdOrFail();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var alerta = await _db.Alerts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, cancellationToken);

        if (alerta is null)
        {
            return NotFound(new { error = "Alerta no encontrada." });
        }

        return Ok(AlertStatusResponse.From(alerta));
    }

    /// <summary>Historial de alertas del usuario autenticado, de más reciente a más antigua.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AlertResponse>>> List(CancellationToken cancellationToken)
    {
        Guid userId;
        try
        {
            userId = GetUserIdOrFail();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var alertas = await _db.Alerts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreadoEn)
            .ToListAsync(cancellationToken);

        return Ok(alertas.Select(AlertResponse.From).ToList());
    }

    /// <summary>
    /// Fallback SMS (sección 9 de la especificación). NO requiere JWT: el usuario puede no tener
    /// datos móviles funcionando. El parsing crudo del SMS entrante depende del proveedor SMS
    /// (Twilio u otro) — decisión pendiente — y ocurre en una capa anterior; este endpoint recibe
    /// el payload ya parseado y validado con autenticación ligera (hash HMAC).
    /// </summary>
    [HttpPost("sms-fallback")]
    [AllowAnonymous]
    public async Task<ActionResult<AlertResponse>> SmsFallback([FromBody] SmsFallbackRequest request, CancellationToken cancellationToken)
    {
        var auth = HttpContext.RequestServices.GetRequiredService<ISmsFallbackAuthService>();
        if (!auth.Validate(request.UserId, request.Lat, request.Lon, request.Timestamp, request.Hash))
        {
            return Unauthorized(new { error = "Hash de autenticación inválido o expirado." });
        }

        var canalActivacion = string.IsNullOrWhiteSpace(request.CanalActivacion)
            ? AlertCanalActivacion.BotonFisico
            : request.CanalActivacion;

        if (!AlertCanalActivacion.EsValido(canalActivacion))
        {
            return BadRequest(new { error = $"'canalActivacion' inválido. Permitidos: {string.Join(", ", AlertCanalActivacion.Todos)}." });
        }

        // Idempotencia opcional también en este canal: si el SMS se reenvía, no se duplica la alerta.
        if (request.ClientGeneratedId.HasValue)
        {
            var existente = await _db.Alerts
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    a => a.UserId == request.UserId && a.ClientGeneratedId == request.ClientGeneratedId,
                    cancellationToken);
            if (existente is not null)
            {
                return CreatedAtAction(nameof(GetStatus), new { id = existente.Id }, AlertResponse.From(existente));
            }
        }

        var ahora = DateTimeOffset.UtcNow;
        var alerta = new Alert
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Estado = AlertEstados.Pendiente,
            CanalActivacion = canalActivacion,
            Ubicacion = GeoPointExtensions.ToPoint4326(request.Lat, request.Lon),
            UbicacionPrecisionMetros = null,
            UbicacionFuente = FuenteUbicacion.Celular,
            ClientGeneratedId = request.ClientGeneratedId,
            CreadoEn = ahora,
        };

        _db.Alerts.Add(alerta);

        try
        {
            // FK alertas.user_id → profiles.id: si el usuario no existe, la inserción fallará y se
            // devuelve un error claro (el perfil se crea al registrarse vía Supabase Auth).
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            return Conflict(new { error = "No se pudo crear la alerta vía SMS. Verifica el userId y que el perfil exista.", detalle = ex.Message });
        }

        _queue.Enqueue(new AlertCreatedEvent(alerta.Id, request.UserId));

        return CreatedAtAction(nameof(GetStatus), new { id = alerta.Id }, AlertResponse.From(alerta));
    }

    private static bool IsViolacionUnico(DbUpdateException ex)
        => ex.InnerException is PostgresException pg && pg.SqlState == "23505";
}