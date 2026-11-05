using Microsoft.AspNetCore.Mvc;

namespace AlertaYA.Api.Errors;

public static class Problemas
{
    public const string CodigoValidacion = "validation_error";
    public const string CodigoAlertaNoEncontrada = "alert_not_found";
    public const string CodigoContactoNoEncontrado = "contact_not_found";
    public const string CodigoContactoDuplicado = "duplicate_contact";
    public const string CodigoLimiteContactos = "contact_limit";
    public const string CodigoAlertaFinalizada = "alert_finalized";
    public const string CodigoRateLimited = "rate_limited";
    public const string CodigoInterno = "internal_error";

    public static ProblemDetails Crear(int status, string codigo, string titulo, string? detalle = null)
    {
        var problema = new ProblemDetails { Status = status, Title = titulo, Detail = detalle };
        problema.Extensions["code"] = codigo;
        return problema;
    }

    public static ObjectResult Resultado(int status, string codigo, string titulo, string? detalle = null)
    {
        var resultado = new ObjectResult(Crear(status, codigo, titulo, detalle)) { StatusCode = status };
        resultado.ContentTypes.Add("application/problem+json");
        return resultado;
    }

    public static ObjectResult Validacion(string detalle)
        => Resultado(StatusCodes.Status400BadRequest, CodigoValidacion, "Datos inválidos.", detalle);

    public static ObjectResult AlertaNoEncontrada()
        => Resultado(StatusCodes.Status404NotFound, CodigoAlertaNoEncontrada, "Alerta no encontrada.");

    public static ObjectResult ContactoNoEncontrado()
        => Resultado(StatusCodes.Status404NotFound, CodigoContactoNoEncontrado, "Contacto no encontrado.");

    public static ObjectResult ContactoDuplicado()
        => Resultado(StatusCodes.Status409Conflict, CodigoContactoDuplicado, "Ya tienes un contacto con ese número.");

    public static ObjectResult LimiteContactos(int maximo)
        => Resultado(StatusCodes.Status409Conflict, CodigoLimiteContactos, $"Puedes tener máximo {maximo} contactos.");

    public static ObjectResult AlertaFinalizada(string detalle)
        => Resultado(StatusCodes.Status409Conflict, CodigoAlertaFinalizada, "La alerta ya terminó.", detalle);

    // Para los ProblemDetails que arma el framework (400 de model binding, 500), que no traen code.
    public static string? CodigoPorEstado(int? status) => status switch
    {
        StatusCodes.Status400BadRequest => CodigoValidacion,
        StatusCodes.Status429TooManyRequests => CodigoRateLimited,
        >= 500 => CodigoInterno,
        _ => null,
    };
}
