namespace AlertaYA.Domain.Tests;

public class TelefonoTests
{
    [Theory]
    [InlineData("300 123 4567")]
    [InlineData("3001234567")]
    [InlineData("573001234567")]
    [InlineData("+57 300 123 4567")]
    [InlineData("(300) 123-4567")]
    public void Normaliza_celulares_colombianos_a_E164(string entrada)
    {
        Assert.Equal("+573001234567", Telefono.NormalizarCelularColombia(entrada));
    }

    [Theory]
    [InlineData("6011234567")]
    [InlineData("30012345")]
    [InlineData("abc")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("+1 300 123 4567")]
    [InlineData("30012345678")]
    public void Rechaza_lo_que_no_es_celular_colombiano(string? entrada)
    {
        Assert.Null(Telefono.NormalizarCelularColombia(entrada));
    }
}
