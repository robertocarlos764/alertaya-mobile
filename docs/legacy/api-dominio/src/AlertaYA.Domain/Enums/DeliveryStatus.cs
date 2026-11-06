namespace AlertaYA.Domain.Enums;

/// <summary>
/// Resultado del envío a un destinatario concreto. Sin equivalente en el modelo
/// Firestore anterior, donde no existía dónde registrar si un envío ocurrió.
/// </summary>
public enum DeliveryStatus
{
    Pending,
    Sent,
    Failed
}
