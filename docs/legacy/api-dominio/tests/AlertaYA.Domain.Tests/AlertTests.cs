using AlertaYA.Domain.Entities;
using AlertaYA.Domain.Enums;
using AlertaYA.Domain.ValueObjects;

namespace AlertaYA.Domain.Tests;

public class AlertTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTimeOffset Start = DateTimeOffset.UtcNow;

    private static Alert Active(GeoLocation? location = null) =>
        Alert.Activate(Guid.NewGuid(), UserId, Start, location);

    private static Contact ContactOf(Guid userId, string name = "Ana") =>
        Contact.Create(Guid.NewGuid(), userId, name, "+573001234567", Start);

    [Fact]
    public void Activate_EmpiezaEnEstadoActivo()
    {
        var alert = Active();

        Assert.Equal(AlertStatus.Active, alert.Status);
        Assert.True(alert.IsActive);
        Assert.Null(alert.EndedAt);
    }

    [Fact]
    public void Activate_ExigeCuentaPropietaria()
    {
        Assert.Throws<ArgumentException>(
            () => Alert.Activate(Guid.NewGuid(), Guid.Empty, Start, null));
    }

    // Escenario "Finalización de una alerta activa" de alertas-sos
    [Fact]
    public void Complete_MarcaCompletedYRegistraElCierre()
    {
        var alert = Active();
        var end = Start.AddMinutes(5);

        alert.Complete(end);

        Assert.Equal(AlertStatus.Completed, alert.Status);
        Assert.Equal(end, alert.EndedAt);
    }

    // Escenario "Cancelación de una alerta activa" de alertas-sos
    [Fact]
    public void Cancel_MarcaCancelledYRegistraElCierre()
    {
        var alert = Active();
        var end = Start.AddMinutes(2);

        alert.Cancel(end);

        Assert.Equal(AlertStatus.Cancelled, alert.Status);
        Assert.Equal(end, alert.EndedAt);
    }

    // Escenario "Cambio sobre una alerta ya finalizada" de alertas-sos
    [Fact]
    public void Complete_RechazaCambioSobreAlertaYaFinalizada()
    {
        var alert = Active();
        alert.Complete(Start.AddMinutes(5));

        Assert.Throws<InvalidOperationException>(() => alert.Complete(Start.AddMinutes(9)));
        Assert.Throws<InvalidOperationException>(() => alert.Cancel(Start.AddMinutes(9)));

        // El estado permanece intacto
        Assert.Equal(AlertStatus.Completed, alert.Status);
        Assert.Equal(Start.AddMinutes(5), alert.EndedAt);
    }

    [Fact]
    public void Cancel_RechazaCambioSobreAlertaYaCancelada()
    {
        var alert = Active();
        alert.Cancel(Start.AddMinutes(1));

        Assert.Throws<InvalidOperationException>(() => alert.Complete(Start.AddMinutes(4)));
        Assert.Equal(AlertStatus.Cancelled, alert.Status);
    }

    // Escenario "Cambio sobre una alerta ajena" de alertas-sos
    [Fact]
    public void BelongsTo_DistingueLaCuentaPropietaria()
    {
        var alert = Active();

        Assert.True(alert.BelongsTo(UserId));
        Assert.False(alert.BelongsTo(Guid.NewGuid()));
    }

    // Escenario "Duración de una alerta finalizada" de alertas-sos
    [Fact]
    public void Duration_CorrespondeAlIntervaloRegistrado()
    {
        var alert = Active();
        alert.Complete(Start.AddSeconds(347));

        Assert.Equal(TimeSpan.FromSeconds(347), alert.Duration);
    }

    // Escenario "Duración de una alerta activa" de alertas-sos
    [Fact]
    public void Duration_EsNulaMientrasLaAlertaSigueActiva()
    {
        Assert.Null(Active().Duration);
    }

    [Fact]
    public void Complete_RechazaCierreAnteriorAlInicio()
    {
        var alert = Active();

        Assert.Throws<ArgumentOutOfRangeException>(() => alert.Complete(Start.AddMinutes(-1)));
        Assert.Equal(AlertStatus.Active, alert.Status);
    }

    // Escenario "Activación con contactos registrados" de alertas-sos
    [Fact]
    public void AddRecipient_RegistraDestinatarioPendiente()
    {
        var alert = Active();
        var contact = ContactOf(UserId, "Ana Gómez");

        var notification = alert.AddRecipient(contact);

        Assert.Single(alert.Notifications);
        Assert.Equal(DeliveryStatus.Pending, notification.Status);
        Assert.Equal("Ana Gómez", notification.ContactName);
    }

    // Escenario "Activación sin contactos registrados" de alertas-sos
    [Fact]
    public void Activate_SinContactos_SeRegistraIgualSinDestinatarios()
    {
        var alert = Active();

        Assert.Equal(AlertStatus.Active, alert.Status);
        Assert.Empty(alert.Notifications);
    }

    // Refuerza "El cliente intenta imponer destinatarios" de alertas-sos
    [Fact]
    public void AddRecipient_RechazaContactoDeOtraCuenta()
    {
        var alert = Active();
        var foreign = ContactOf(Guid.NewGuid());

        Assert.Throws<InvalidOperationException>(() => alert.AddRecipient(foreign));
        Assert.Empty(alert.Notifications);
    }

    // Escenarios de ubicacion: la alerta se registra con ubicación desconocida
    [Fact]
    public void Activate_AceptaUbicacionDesconocida()
    {
        var alert = Active(location: null);

        Assert.Null(alert.Location);
        Assert.Equal(AlertStatus.Active, alert.Status);
    }

    [Fact]
    public void Activate_ConservaLaUbicacionConocida()
    {
        var location = GeoLocation.Create(4.6789, -74.0512);
        var alert = Active(location);

        Assert.NotNull(alert.Location);
        Assert.Equal(4.6789, alert.Location!.Value.Latitude);
    }
}
