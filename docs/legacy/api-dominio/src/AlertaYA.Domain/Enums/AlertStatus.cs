namespace AlertaYA.Domain.Enums;

/// <summary>
/// Estado de una alerta. Solo <see cref="Active"/> admite transiciones.
/// </summary>
public enum AlertStatus
{
    Active,
    Completed,
    Cancelled
}
