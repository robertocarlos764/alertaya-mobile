namespace AlertaYA.Domain;

/// <summary>
/// Máquina de estados de <c>alerts</c>. Es el ÚNICO lugar donde se validan
/// las transiciones de estado (sección 8 de la especificación):
///
///   pendiente  → activa | descartada
///   activa     → verificando
///   verificando → escalada | atendida | descartada
///   escalada   → atendida | descartada
///   atendida / descartada  → (estados terminales)
///
/// Toda transición que no esté en esta tabla debe ser rechazada por el
/// endpoint correspondiente con un error claro.
/// </summary>
public static class AlertStateMachine
{
    private static readonly IReadOnlyDictionary<string, string[]> TransicionesValidas =
        new Dictionary<string, string[]>
        {
            [AlertEstados.Pendiente] = new[] { AlertEstados.Activa, AlertEstados.Descartada },
            [AlertEstados.Activa] = new[] { AlertEstados.Verificando },
            [AlertEstados.Verificando] = new[] { AlertEstados.Escalada, AlertEstados.Atendida, AlertEstados.Descartada },
            [AlertEstados.Escalada] = new[] { AlertEstados.Atendida, AlertEstados.Descartada },
            [AlertEstados.Atendida] = Array.Empty<string>(),
            [AlertEstados.Descartada] = Array.Empty<string>(),
        };

    /// <summary>Devuelve true si la transición actual → nuevo está permitida por la máquina de estados.</summary>
    public static bool PuedeTransicionar(string? estadoActual, string? estadoNuevo)
    {
        if (estadoActual is null || estadoNuevo is null)
        {
            return false;
        }

        return TransicionesValidas.TryGetValue(estadoActual, out var destinos)
               && destinos.Contains(estadoNuevo);
    }

    /// <summary>
    /// Transiciones permitidas desde un estado, para devolverlas en mensajes de
    /// error claros al cliente.
    /// </summary>
    public static IReadOnlyList<string> TransicionesPermitidas(string? estadoActual)
    {
        if (estadoActual is null || !TransicionesValidas.TryGetValue(estadoActual, out var destinos))
        {
            return Array.Empty<string>();
        }

        return destinos;
    }
}