using System.Text.RegularExpressions;

namespace AlertaYA.Domain.ValueObjects;

/// <summary>
/// Teléfono en formato E.164. Se valida en el dominio porque es el dato que se
/// usa directamente para el envío: un teléfono mal formado es una notificación
/// que no llega.
/// </summary>
public readonly partial record struct PhoneNumber
{
    public string Value { get; }

    private PhoneNumber(string value) => Value = value;

    [GeneratedRegex(@"^\+[1-9]\d{1,14}$")]
    private static partial Regex E164();

    public static bool IsValid(string? candidate) =>
        !string.IsNullOrWhiteSpace(candidate) && E164().IsMatch(candidate);

    public static PhoneNumber Create(string? candidate)
    {
        if (!IsValid(candidate))
        {
            throw new ArgumentException(
                $"El teléfono debe estar en formato E.164 (ej. +573001234567). Recibido: '{candidate}'.",
                nameof(candidate));
        }

        return new PhoneNumber(candidate!);
    }

    public override string ToString() => Value;

    public static implicit operator string(PhoneNumber phone) => phone.Value;
}
