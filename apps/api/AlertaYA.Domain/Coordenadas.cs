namespace AlertaYA.Domain;

public static class Coordenadas
{
    // (0,0) es la coordenada centinela de un valor por defecto (UBIC-02).
    public static bool EsValida(double lat, double lon)
        => double.IsFinite(lat) && double.IsFinite(lon)
           && lat is >= -90 and <= 90
           && lon is >= -180 and <= 180
           && !(lat == 0 && lon == 0);
}
