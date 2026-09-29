namespace AlertaYA.Domain.ValueObjects;

/// <summary>
/// Ubicación conocida. El tipo solo puede construirse con coordenadas válidas;
/// la ausencia de ubicación se representa con <c>null</c>, nunca con una coordenada
/// sustituta. Ver la capacidad ubicacion: "Ausencia de ubicación sustituta".
/// </summary>
public readonly record struct GeoLocation
{
    public double Latitude { get; }
    public double Longitude { get; }

    private GeoLocation(double latitude, double longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
    }

    public static bool IsValid(double latitude, double longitude) =>
        latitude is >= -90 and <= 90 &&
        longitude is >= -180 and <= 180 &&
        !double.IsNaN(latitude) && !double.IsNaN(longitude);

    public static GeoLocation Create(double latitude, double longitude)
    {
        if (!IsValid(latitude, longitude))
        {
            throw new ArgumentOutOfRangeException(
                nameof(latitude),
                $"Coordenadas fuera de rango: ({latitude}, {longitude}).");
        }

        return new GeoLocation(latitude, longitude);
    }

    /// <summary>
    /// Intenta construir una ubicación. Devuelve <c>null</c> si no es válida,
    /// en lugar de sustituirla por un valor por defecto.
    /// </summary>
    public static GeoLocation? TryCreate(double? latitude, double? longitude)
    {
        if (latitude is null || longitude is null) return null;
        if (!IsValid(latitude.Value, longitude.Value)) return null;

        return new GeoLocation(latitude.Value, longitude.Value);
    }

    /// <summary>Enlace al mapa derivado en el momento de usarlo, nunca almacenado.</summary>
    public string ToMapUrl() =>
        FormattableString.Invariant($"https://maps.google.com/?q={Latitude},{Longitude}");
}
