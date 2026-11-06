using AlertaYA.Domain.ValueObjects;

namespace AlertaYA.Domain.Tests;

public class GeoLocationTests
{
    /// <summary>
    /// Coordenada que el adaptador Flutter devolvía en silencio al denegarse el
    /// permiso. Se conserva en las pruebas para dejar constancia de que el nuevo
    /// dominio no la produce por ninguna ruta.
    /// </summary>
    private const double BogotaLat = 4.7110;
    private const double BogotaLng = -74.0721;

    [Fact]
    public void TryCreate_DevuelveNullSinCoordenadas()
    {
        Assert.Null(GeoLocation.TryCreate(null, null));
        Assert.Null(GeoLocation.TryCreate(4.65, null));
        Assert.Null(GeoLocation.TryCreate(null, -74.05));
    }

    // "MUST NOT devolverse ninguna coordenada por defecto, aproximada o de respaldo"
    [Fact]
    public void TryCreate_SinDatosNoSustituyePorBogota()
    {
        var result = GeoLocation.TryCreate(null, null);

        Assert.Null(result);
        Assert.False(result.HasValue && result.Value.Latitude == BogotaLat);
    }

    [Theory]
    [InlineData(91, 0)]
    [InlineData(-91, 0)]
    [InlineData(0, 181)]
    [InlineData(0, -181)]
    [InlineData(double.NaN, 0)]
    public void TryCreate_DevuelveNullConCoordenadasInvalidas(double lat, double lng)
    {
        Assert.Null(GeoLocation.TryCreate(lat, lng));
    }

    [Theory]
    [InlineData(91, 0)]
    [InlineData(0, 181)]
    [InlineData(double.NaN, 0)]
    public void Create_LanzaConCoordenadasInvalidas(double lat, double lng)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => GeoLocation.Create(lat, lng));
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(90, 180)]
    [InlineData(-90, -180)]
    [InlineData(BogotaLat, BogotaLng)]
    public void Create_AceptaCoordenadasValidas(double lat, double lng)
    {
        var location = GeoLocation.Create(lat, lng);

        Assert.Equal(lat, location.Latitude);
        Assert.Equal(lng, location.Longitude);
    }

    // Escenario "Apertura del mapa desde una alerta" de ubicacion
    [Fact]
    public void ToMapUrl_SeDerivaDeLasCoordenadas()
    {
        var url = GeoLocation.Create(4.6789, -74.0512).ToMapUrl();

        Assert.Equal("https://maps.google.com/?q=4.6789,-74.0512", url);
    }

    [Fact]
    public void ToMapUrl_UsaPuntoDecimalIndependienteDeLaCultura()
    {
        var original = Thread.CurrentThread.CurrentCulture;
        try
        {
            // es-CO usa coma decimal; el enlace debe seguir siendo válido
            Thread.CurrentThread.CurrentCulture = new System.Globalization.CultureInfo("es-CO");

            Assert.Equal(
                "https://maps.google.com/?q=4.6789,-74.0512",
                GeoLocation.Create(4.6789, -74.0512).ToMapUrl());
        }
        finally
        {
            Thread.CurrentThread.CurrentCulture = original;
        }
    }
}
