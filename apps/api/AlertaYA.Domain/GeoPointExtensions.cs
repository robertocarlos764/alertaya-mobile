using NetTopologySuite.Geometries;

namespace AlertaYA.Domain;

/// <summary>
/// Conversión entre lat/lon y <c>Point</c> de NetTopologySuite, respetando la convención de
/// SRID 4326 en columnas geography de PostGIS: el eje X es longitud y el eje Y es latitud.
/// </summary>
public static class GeoPointExtensions
{
    public static Point ToPoint4326(double lat, double lon) => new(lon, lat) { SRID = 4326 };

    public static (double Lat, double Lon)? ToLatLon(Point? point)
        => point is null ? null : (point.Y, point.X);
}