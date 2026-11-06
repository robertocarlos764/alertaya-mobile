using AlertaYA.Domain.Entities;

namespace AlertaYA.Domain.Tests;

public class UserProfileTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    private static UserProfile Sample(string name = "Roberto Barrera") =>
        UserProfile.Create(Guid.NewGuid(), name, "+573001234567", Now);

    // Escenario "Teléfono con formato inválido" de perfil-usuario
    [Theory]
    [InlineData("3001234567")]
    [InlineData("+0300123456")]
    [InlineData("")]
    [InlineData(null)]
    public void Create_RechazaTelefonosMalFormados(string? phone)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => UserProfile.Create(Guid.NewGuid(), "Roberto", phone, Now));

        Assert.Contains("E.164", ex.Message);
    }

    // Escenario "Nombre vacío" de perfil-usuario
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Create_RechazaNombreVacio(string? name)
    {
        Assert.Throws<ArgumentException>(
            () => UserProfile.Create(Guid.NewGuid(), name, "+573001234567", Now));
    }

    // Escenario "Iniciales tras cambiar el nombre" de perfil-usuario
    [Fact]
    public void Initials_SeRecalculanAlCambiarElNombre()
    {
        var profile = Sample("Roberto Barrera");
        Assert.Equal("RB", profile.Initials);

        profile.Rename("Ana Gómez");

        Assert.Equal("AG", profile.Initials);
    }

    [Theory]
    [InlineData("Roberto Barrera", "RB")]
    [InlineData("Ana", "A")]
    [InlineData("Ana María Gómez Díaz", "AD")]
    [InlineData("  Ana   Gómez  ", "AG")]
    public void Initials_SeDerivanDelNombre(string name, string expected)
    {
        Assert.Equal(expected, Sample(name).Initials);
    }

    [Fact]
    public void ChangePhone_RechazaFormatoInvalidoYConservaElAnterior()
    {
        var profile = Sample();
        var original = profile.Phone.Value;

        Assert.Throws<ArgumentException>(() => profile.ChangePhone("3001234567"));
        Assert.Equal(original, profile.Phone.Value);
    }

    [Fact]
    public void Rename_RechazaVacioYConservaElAnterior()
    {
        var profile = Sample("Roberto Barrera");

        Assert.Throws<ArgumentException>(() => profile.Rename("  "));
        Assert.Equal("Roberto Barrera", profile.Name.Value);
    }
}
