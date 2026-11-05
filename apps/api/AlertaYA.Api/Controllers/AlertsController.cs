using AlertaYA.Api.Errors;
using AlertaYA.Api.Extensions;
using AlertaYA.Api.Models.DTOs;
using AlertaYA.Application.Alerts;
using AlertaYA.Domain;
using AlertaYA.Domain.Entities;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlertaYA.Api.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AlertsController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetUserIdOrFail() => User.GetUserId() ?? throw new UnauthorizedAccessException();

    // El 201 significa "guardada y en cola", no "enviada": el estado real sale de /status.
    [HttpPost]
    public async Task<ActionResult<AlertResponse>> Create(
        [FromBody] CreateAlertRequest request,
        [FromServices] CreateAlertHandler handler,
        CancellationToken cancellationToken)
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

        var resultado = await handler.EjecutarAsync(userId, request, cancellationToken);
        if (resultado.Alerta is null)
        {
            return Problemas.Validacion(resultado.Error ?? "Solicitud inválida.");
        }

        return CreatedAtAction(nameof(GetStatus), new { id = resultado.Alerta.Id }, AlertResponse.From(resultado.Alerta));
    }

    [HttpPost("{id:guid}/location")]
    public async Task<ActionResult<AlertStatusResponse>> AddLocation(
        Guid id,
        [FromBody] UpdateAlertLocationRequest request,
        [FromServices] GetAlertStatusHandler estado,
        CancellationToken cancellationToken)
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
            return Problemas.AlertaNoEncontrada();
        }

        if (!AlertEstados.EnCurso.Contains(alerta.Estado))
        {
            return Problemas.AlertaFinalizada($"La alerta está en estado '{alerta.Estado}' y no acepta actualizaciones de ubicación.");
        }

        var fuente = string.IsNullOrWhiteSpace(request.Fuente) ? FuenteUbicacion.Gps : request.Fuente;
        if (!FuenteUbicacion.EsValido(fuente))
        {
            return Problemas.Validacion($"'fuente' inválido. Permitidos: {string.Join(", ", FuenteUbicacion.Todos)}.");
        }

        var ubicacionPoint = GeoPointExtensions.ToPoint4326(request.Lat, request.Lon);

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

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(AlertStatusResponse.From((await estado.ObtenerAsync(userId, alerta.Id, cancellationToken))!));
    }

    [HttpGet("{id:guid}/status")]
    public async Task<ActionResult<AlertStatusResponse>> GetStatus(
        Guid id,
        [FromServices] GetAlertStatusHandler handler,
        CancellationToken cancellationToken)
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

        var estado = await handler.ObtenerAsync(userId, id, cancellationToken);
        return estado is null ? Problemas.AlertaNoEncontrada() : Ok(AlertStatusResponse.From(estado));
    }

    // 204 sin alerta en curso: la app solo reabre la pantalla de alerta activa con un 200 (D-12).
    [HttpGet("active")]
    [ProducesResponseType(typeof(AlertStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<AlertStatusResponse>> GetActive(
        [FromServices] GetAlertStatusHandler handler,
        CancellationToken cancellationToken)
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

        var estado = await handler.ObtenerActivaAsync(userId, cancellationToken);
        return estado is null ? NoContent() : Ok(AlertStatusResponse.From(estado));
    }

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
}
