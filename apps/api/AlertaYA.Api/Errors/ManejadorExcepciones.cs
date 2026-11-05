using Microsoft.AspNetCore.Diagnostics;

namespace AlertaYA.Api.Errors;

public sealed class ManejadorExcepciones : IExceptionHandler
{
    private readonly ILogger<ManejadorExcepciones> _logger;

    public ManejadorExcepciones(ILogger<ManejadorExcepciones> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        // Solo metodo y ruta: el body puede traer telefonos y coordenadas (Pitfall 16).
        _logger.LogError(exception, "Error no controlado en {Metodo} {Ruta}", httpContext.Request.Method, httpContext.Request.Path);

        var problema = Problemas.Crear(
            StatusCodes.Status500InternalServerError,
            Problemas.CodigoInterno,
            "Ocurrió un error inesperado. Intenta de nuevo.");
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(problema, (System.Text.Json.JsonSerializerOptions?)null, "application/problem+json", cancellationToken);
        return true;
    }
}
