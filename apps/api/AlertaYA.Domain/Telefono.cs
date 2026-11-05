using System.Text.RegularExpressions;

namespace AlertaYA.Domain;

public static class Telefono
{
    private static readonly Regex Separadores = new(@"[\s\-()]", RegexOptions.Compiled);
    private static readonly Regex CelularColombia = new(@"^\+573\d{9}$", RegexOptions.Compiled);

    // Solo celulares +57 en esta fase: Twilio no envia SMS a fijos colombianos.
    public static string? NormalizarCelularColombia(string? entrada)
    {
        if (entrada is null)
        {
            return null;
        }

        var limpio = Separadores.Replace(entrada, string.Empty);
        if (limpio.StartsWith("+57", StringComparison.Ordinal))
        {
            limpio = limpio[3..];
        }
        else if (limpio.StartsWith("57", StringComparison.Ordinal) && limpio.Length == 12)
        {
            limpio = limpio[2..];
        }

        var candidato = "+57" + limpio;
        return CelularColombia.IsMatch(candidato) ? candidato : null;
    }
}
