using AlertaYA.Domain.Entities;
using AlertaYA.Domain.Enums;

namespace AlertaYA.Domain.Tests;

public class AlertNotificationTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    private static Alert ActiveAlert() => Alert.Activate(Guid.NewGuid(), UserId, Now, null);

    private static Contact ContactOf(string name, string phone) =>
        Contact.Create(Guid.NewGuid(), UserId, name, phone, Now);

    private static AlertNotification PendingFor(string name = "Ana Gómez", string phone = "+573001234567")
        => ActiveAlert().AddRecipient(ContactOf(name, phone));

    [Fact]
    public void Pending_EmpiezaSinIntentosYSinProveedor()
    {
        var n = PendingFor();

        Assert.Equal(DeliveryStatus.Pending, n.Status);
        Assert.Equal(0, n.Attempts);
        Assert.Null(n.ProviderId);
        Assert.Null(n.SentAt);
    }

    // Escenario "Envío exitoso" de notificaciones-alerta
    [Fact]
    public void MarkSent_RegistraElIdentificadorDelProveedor()
    {
        var n = PendingFor();

        n.MarkSent("SM123abc", Now);

        Assert.Equal(DeliveryStatus.Sent, n.Status);
        Assert.Equal("SM123abc", n.ProviderId);
        Assert.Equal(Now, n.SentAt);
        Assert.Null(n.Error);
    }

    [Fact]
    public void MarkSent_ExigeIdentificadorDelProveedor()
    {
        var n = PendingFor();

        Assert.Throws<ArgumentException>(() => n.MarkSent("  ", Now));
        Assert.Equal(DeliveryStatus.Pending, n.Status);
    }

    // Escenario "Envío fallido" de notificaciones-alerta
    [Fact]
    public void MarkFailed_RegistraElMotivo()
    {
        var n = PendingFor();

        n.MarkFailed("numero invalido");

        Assert.Equal(DeliveryStatus.Failed, n.Status);
        Assert.Equal("numero invalido", n.Error);
        Assert.Equal(1, n.Attempts);
    }

    // Escenario "Fallo transitorio recuperado" de notificaciones-alerta
    [Fact]
    public void Reintento_ExitosoTrasFalloDejaEstadoSent()
    {
        var n = PendingFor();

        n.MarkFailed("timeout");
        Assert.True(n.CanRetry);

        n.MarkSent("SM999", Now);

        Assert.Equal(DeliveryStatus.Sent, n.Status);
        Assert.Equal(2, n.Attempts);
        Assert.Null(n.Error);
    }

    // "Un destinatario MUST NOT recibir el mismo mensaje más de una vez"
    [Fact]
    public void MarkSent_DosVeces_EsRechazado()
    {
        var n = PendingFor();
        n.MarkSent("SM1", Now);

        Assert.Throws<InvalidOperationException>(() => n.MarkSent("SM2", Now));
        Assert.Equal("SM1", n.ProviderId);
        Assert.Equal(1, n.Attempts);
    }

    [Fact]
    public void MarkFailed_TrasEntregaEsRechazado()
    {
        var n = PendingFor();
        n.MarkSent("SM1", Now);

        Assert.Throws<InvalidOperationException>(() => n.MarkFailed("tarde"));
        Assert.Equal(DeliveryStatus.Sent, n.Status);
    }

    // Escenario "Agotamiento de reintentos" de notificaciones-alerta
    [Fact]
    public void CanRetry_EsFalsoAlAgotarLosIntentos()
    {
        var n = PendingFor();

        for (var i = 0; i < AlertNotification.MaxAttempts; i++)
        {
            n.MarkFailed($"fallo {i}");
        }

        Assert.Equal(AlertNotification.MaxAttempts, n.Attempts);
        Assert.Equal(DeliveryStatus.Failed, n.Status);
        Assert.False(n.CanRetry);
    }

    // Escenario "Contacto eliminado tras una alerta" de notificaciones-alerta
    [Fact]
    public void DetachContact_ConservaNombreYTelefonoDelDestinatario()
    {
        var n = PendingFor("Ana Gómez", "+573001234567");
        n.MarkSent("SM1", Now);

        n.DetachContact();

        Assert.Null(n.ContactId);
        Assert.Equal("Ana Gómez", n.ContactName);
        Assert.Equal("+573001234567", n.ContactPhone.Value);
        Assert.Equal(DeliveryStatus.Sent, n.Status);
    }

    // Escenario "Fallo parcial" de notificaciones-alerta
    [Fact]
    public void FalloParcial_CadaDestinatarioConservaSuPropioEstado()
    {
        var alert = ActiveAlert();
        var ok = alert.AddRecipient(ContactOf("Ana", "+573001234567"));
        var ko = alert.AddRecipient(ContactOf("Luis", "+573009876543"));

        ok.MarkSent("SM1", Now);
        ko.MarkFailed("numero invalido");

        Assert.Equal(DeliveryStatus.Sent, alert.Notifications[0].Status);
        Assert.Equal(DeliveryStatus.Failed, alert.Notifications[1].Status);
    }
}
