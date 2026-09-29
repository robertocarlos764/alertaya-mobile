using AlertaYA.Domain.Entities;

namespace AlertaYA.Domain.Tests;

public class ContactTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    [Theory]
    [InlineData("+573001234567")]
    [InlineData("+12025550143")]
    [InlineData("+441632960961")]
    public void Create_AceptaTelefonosE164(string phone)
    {
        var contact = Contact.Create(Guid.NewGuid(), UserId, "Ana Gómez", phone, Now);

        Assert.Equal(phone, contact.Phone.Value);
    }

    // Escenario "Teléfono con formato inválido" de contactos-confianza
    [Theory]
    [InlineData("3001234567")]     // sin prefijo +
    [InlineData("+0300123456")]    // no puede empezar por 0
    [InlineData("+57 300 123 45")] // espacios
    [InlineData("+57-300-1234")]   // guiones
    [InlineData("abc")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    [InlineData("+1234567890123456")] // 16 dígitos, excede E.164
    public void Create_RechazaTelefonosMalFormados(string? phone)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => Contact.Create(Guid.NewGuid(), UserId, "Ana Gómez", phone, Now));

        Assert.Contains("E.164", ex.Message);
    }

    // Escenario "Nombre vacío" de contactos-confianza
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Create_RechazaNombreVacio(string? name)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => Contact.Create(Guid.NewGuid(), UserId, name, "+573001234567", Now));

        Assert.Contains("nombre", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_ExigeCuentaPropietaria()
    {
        Assert.Throws<ArgumentException>(
            () => Contact.Create(Guid.NewGuid(), Guid.Empty, "Ana", "+573001234567", Now));
    }

    // Soporta el aislamiento por cuenta exigido en contactos-confianza
    [Fact]
    public void BelongsTo_DistingueLaCuentaPropietaria()
    {
        var contact = Contact.Create(Guid.NewGuid(), UserId, "Ana", "+573001234567", Now);

        Assert.True(contact.BelongsTo(UserId));
        Assert.False(contact.BelongsTo(Guid.NewGuid()));
    }

    [Fact]
    public void Create_RecortaEspaciosDelNombre()
    {
        var contact = Contact.Create(Guid.NewGuid(), UserId, "  Ana Gómez  ", "+573001234567", Now);

        Assert.Equal("Ana Gómez", contact.Name.Value);
    }
}
