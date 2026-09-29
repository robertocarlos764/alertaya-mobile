namespace AlertaYA.Domain.ValueObjects;

/// <summary>
/// Nombre de una persona. Las iniciales se derivan aquí y nunca se persisten,
/// para que no puedan quedar desincronizadas del nombre.
/// </summary>
public readonly record struct PersonName
{
    public string Value { get; }

    private PersonName(string value) => Value = value;

    public static bool IsValid(string? candidate) => !string.IsNullOrWhiteSpace(candidate);

    public static PersonName Create(string? candidate)
    {
        if (!IsValid(candidate))
        {
            throw new ArgumentException("El nombre es obligatorio.", nameof(candidate));
        }

        return new PersonName(candidate!.Trim());
    }

    /// <summary>
    /// Iniciales derivadas: primera letra del primer y último componente del nombre.
    /// </summary>
    public string Initials
    {
        get
        {
            var parts = Value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length switch
            {
                0 => string.Empty,
                1 => parts[0][..1].ToUpperInvariant(),
                _ => (parts[0][..1] + parts[^1][..1]).ToUpperInvariant()
            };
        }
    }

    public override string ToString() => Value;

    public static implicit operator string(PersonName name) => name.Value;
}
