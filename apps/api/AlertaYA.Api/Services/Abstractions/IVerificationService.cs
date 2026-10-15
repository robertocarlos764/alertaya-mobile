using AlertaYA.Domain.Entities;

namespace AlertaYA.Api.Services.Abstractions;

public sealed record VerificationResult(
    decimal? MovimientoScore,
    decimal? AudioAmbienteScore,
    bool? ConsistenciaUbicacion,
    TimeOnly HoraDelDia,
    string NivelAsignado,
    string EstadoResultante);

/// <summary>
/// Motor de verificación de alerta. En esta fase es una heurística basada en reglas
/// simples y explícitas (no un modelo entrenado — sección 7 de la especificación).
/// Cada regla debe estar documentada para poder reemplazarla después por un modelo real
/// sin perder el razonamiento original.
/// </summary>
public interface IVerificationService
{
    Task<VerificationResult> EvaluateAsync(Alert alert, CancellationToken cancellationToken);
}