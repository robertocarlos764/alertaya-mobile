using AlertaYA.Domain.Entities;

namespace AlertaYA.Domain.Tests;

public class UserSettingsTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    // Escenario "Primera consulta" de ajustes-usuario
    [Fact]
    public void Defaults_DevuelveConjuntoCompletoSinEscrituraPrevia()
    {
        var settings = UserSettings.Defaults(UserId);

        Assert.Equal(UserId, settings.UserId);
        Assert.False(settings.VoiceActivationEnabled);
        Assert.Null(settings.VoiceKeyword);
        Assert.False(settings.PoliceAutoCall);
        Assert.Equal(UserSettings.DefaultSmsIntervalSeconds, settings.SmsIntervalSeconds);
    }

    // Escenario "Actualización válida" de ajustes-usuario
    [Fact]
    public void Update_GuardaValoresValidos()
    {
        var settings = UserSettings.Defaults(UserId);

        settings.Update(true, "auxilio", true, 120);

        Assert.True(settings.VoiceActivationEnabled);
        Assert.Equal("auxilio", settings.VoiceKeyword);
        Assert.True(settings.PoliceAutoCall);
        Assert.Equal(120, settings.SmsIntervalSeconds);
    }

    // Escenario "Intervalo fuera de rango" de ajustes-usuario
    [Theory]
    [InlineData(0)]
    [InlineData(29)]
    [InlineData(601)]
    [InlineData(-5)]
    public void Update_RechazaIntervaloFueraDeRango(int seconds)
    {
        var settings = UserSettings.Defaults(UserId);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => settings.Update(false, null, false, seconds));
    }

    [Theory]
    [InlineData(30)]
    [InlineData(60)]
    [InlineData(600)]
    public void Update_AceptaLosLimitesDelRango(int seconds)
    {
        var settings = UserSettings.Defaults(UserId);

        settings.Update(false, null, false, seconds);

        Assert.Equal(seconds, settings.SmsIntervalSeconds);
    }

    // Escenario "Palabra clave vacía con activación por voz habilitada"
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Update_RechazaVozHabilitadaSinPalabraClave(string? keyword)
    {
        var settings = UserSettings.Defaults(UserId);

        var ex = Assert.Throws<ArgumentException>(
            () => settings.Update(true, keyword, false, 60));

        Assert.Contains("palabra clave", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // "Un valor inválido MUST NOT persistirse ni alterar los demás ajustes"
    [Fact]
    public void Update_NoAlteraNadaCuandoUnValorEsInvalido()
    {
        var settings = UserSettings.Defaults(UserId);
        settings.Update(true, "auxilio", true, 120);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => settings.Update(false, "otra", false, 9999));

        // Todo conserva el estado de la última actualización válida
        Assert.True(settings.VoiceActivationEnabled);
        Assert.Equal("auxilio", settings.VoiceKeyword);
        Assert.True(settings.PoliceAutoCall);
        Assert.Equal(120, settings.SmsIntervalSeconds);
    }

    [Fact]
    public void Update_PermiteDeshabilitarVozSinPalabraClave()
    {
        var settings = UserSettings.Defaults(UserId);
        settings.Update(true, "auxilio", false, 60);

        settings.Update(false, null, false, 60);

        Assert.False(settings.VoiceActivationEnabled);
        Assert.Null(settings.VoiceKeyword);
    }
}
