namespace AlertaYA.Domain;

// "enviado" = el proveedor acepto el mensaje; "entregado" solo lo escribe el webhook firmado.
public static class DeliveryEstados
{
    public const string EnCola = "en_cola";
    public const string Enviando = "enviando";
    public const string Enviado = "enviado";
    public const string Entregado = "entregado";
    public const string Fallido = "fallido";
    public const string Reintento = "reintento";
    public const string Cancelado = "cancelado";

    public static readonly string[] Todos =
    {
        EnCola, Enviando, Enviado, Entregado, Fallido, Reintento, Cancelado,
    };

    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}

public static class DeliveryTipos
{
    public const string Alerta = "alerta";
    public const string ASalvo = "a_salvo";

    public static readonly string[] Todos =
    {
        Alerta, ASalvo,
    };

    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}

public static class DeliveryCanales
{
    public const string Sms = "sms";

    public static readonly string[] Todos =
    {
        Sms,
    };

    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}
