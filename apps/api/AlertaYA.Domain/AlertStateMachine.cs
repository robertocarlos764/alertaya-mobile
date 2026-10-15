namespace AlertaYA.Domain;

/// <summary>
/// Máquina de estados de <c>alerts</c>. Es el ÚNICO lugar donde se validan
/// las transiciones de estado (sección 8 de la especificación):
///
///   pendiente   → activa | descartada | finalizada
///   activa      → verificando | finalizada
///   verificando → escalada | atendida | descartada | finalizada
///   escalada    → atendida | descartada | finalizada
///   atendida / descartada / finalizada → (estados terminales)
///
/// <c>finalizada</c> es "Estoy a salvo" (D-09): la persona cierra su propia alerta desde
/// cualquier estado no terminal.
///
/// Toda transición que no esté en esta tabla debe ser rechazada por el
/// endpoint correspondiente con un error claro.
/// </summary>
public static class AlertStateMachine
{
    private static readonly IReadOnlyDictionary<string, string[]> TransicionesValidas =
        new Dictionary<string, string[]>
        {
            [AlertEstados.Pendiente] = new[] { AlertEstados.Activa, AlertEstados.Descartada, AlertEstados.Finalizada },
            [AlertEstados.Activa] = new[] { AlertEstados.Verificando, AlertEstados.Finalizada },
            [AlertEstados.Verificando] = new[] { AlertEstados.Escalada, AlertEstados.Atendida, AlertEstados.Descartada, AlertEstados.Finalizada },
            [AlertEstados.Escalada] = new[] { AlertEstados.Atendida, AlertEstados.Descartada, AlertEstados.Finalizada },
            [AlertEstados.Atendida] = Array.Empty<string>(),
            [AlertEstados.Descartada] = Array.Empty<string>(),
            [AlertEstados.Finalizada] = Array.Empty<string>(),
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