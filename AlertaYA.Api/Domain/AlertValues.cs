namespace AlertaYA.Api.Domain;

public static class AlertEstados
{
    public const string Pendiente = "pendiente";
    public const string Activa = "activa";
    public const string Verificando = "verificando";
    public const string Escalada = "escalada";
    public const string Atendida = "atendida";
    public const string Descartada = "descartada";

    public static readonly string[] Todos =
    {
        Pendiente, Activa, Verificando, Escalada, Atendida, Descartada,
    };

    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}

public static class AlertCanalActivacion
{
    public const string BotonPulsado = "boton_pulsado";
    public const string Voz = "voz";
    public const string BotonFisico = "boton_fisico";

    public static readonly string[] Todos =
    {
        BotonPulsado, Voz, BotonFisico,
    };

    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}

public static class NivelPrioridadIa
{
    public const string Critico = "critico";
    public const string Medio = "medio";
    public const string PosibleFalsoPositivo = "posible_falso_positivo";

    public static readonly string[] Todos =
    {
        Critico, Medio, PosibleFalsoPositivo,
    };

    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}

public static class FuenteUbicacion
{
    public const string Gps = "gps";
    public const string Celular = "celular";
    public const string Cache = "cache";

    public static readonly string[] Todos =
    {
        Gps, Celular, Cache,
    };

    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}