namespace AlertaYA.Domain.Tests;

/// <summary>
/// Fija la tabla de transiciones de <see cref="AlertStateMachine"/> (sección 8 + D-09
/// "Estoy a salvo"): cada par origen x destino está cubierto.
/// </summary>
public class AlertStateMachineTests
{
    private static readonly HashSet<(string, string)> Permitidas = new()
    {
        ("pendiente", "activa"),
        ("pendiente", "descartada"),
        ("pendiente", "finalizada"),
        ("activa", "verificando"),
        ("activa", "finalizada"),
        ("verificando", "escalada"),
        ("verificando", "atendida"),
        ("verificando", "descartada"),
        ("verificando", "finalizada"),
        ("escalada", "atendida"),
        ("escalada", "descartada"),
        ("escalada", "finalizada"),
    };

    // Literales y no AlertEstados.Todos: si falta un estado, la matriz lo detecta.
    private static readonly string[] Estados =
    {
        "pendiente", "activa", "verificando", "escalada", "atendida", "descartada", "finalizada",
    };

    public static IEnumerable<object[]> TodosLosPares()
        => from origen in Estados
           from destino in Estados
           select new object[] { origen, destino };

    [Theory]
    [MemberData(nameof(TodosLosPares))]
    public void PuedeTransicionar_sigue_la_tabla(string origen, string destino)
    {
        Assert.Equal(Permitidas.Contains((origen, destino)), AlertStateMachine.PuedeTransicionar(origen, destino));
    }

    [Fact]
    public void La_matriz_cubre_49_pares()
    {
        Assert.Equal(49, TodosLosPares().Count());
    }

    [Theory]
    [InlineData("finalizada")]
    [InlineData("atendida")]
    [InlineData("descartada")]
    public void Estados_terminales_no_tienen_transiciones(string estado)
    {
        Assert.Empty(AlertStateMachine.TransicionesPermitidas(estado));
    }

    [Theory]
    [InlineData(null, "activa")]
    [InlineData("activa", null)]
    [InlineData("inexistente", "activa")]
    [InlineData("pendiente", "inexistente")]
    public void Entradas_nulas_o_inexistentes_se_rechazan(string? origen, string? destino)
    {
        Assert.False(AlertStateMachine.PuedeTransicionar(origen, destino));
    }

    [Fact]
    public void Finalizada_es_un_estado_valido_y_hay_siete()
    {
        Assert.True(AlertEstados.EsValido("finalizada"));
        Assert.Equal(7, AlertEstados.Todos.Length);
        Assert.Equal(Estados.Order(), AlertEstados.Todos.Order());
    }
}
