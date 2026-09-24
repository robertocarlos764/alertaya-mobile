using System.Threading.Channels;

namespace AlertaYA.Api.Services.Abstractions;

public class AlertEventQueue : IAlertEventQueue
{
    private readonly Channel<AlertCreatedEvent> _verificationChannel =
        Channel.CreateUnbounded<AlertCreatedEvent>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
            AllowSynchronousContinuations = false,
        });

    private readonly Channel<AlertCreatedEvent> _notificationChannel =
        Channel.CreateUnbounded<AlertCreatedEvent>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
            AllowSynchronousContinuations = false,
        });

    public void Enqueue(AlertCreatedEvent alertEvent)
    {
        // Cada worker consume el MISMO evento: un canal por consumidor.
        // TryWrite sin await: el endpoint nunca espera por el procesamiento asíncrono.
        _verificationChannel.Writer.TryWrite(alertEvent);
        _notificationChannel.Writer.TryWrite(alertEvent);
    }

    public async ValueTask<AlertCreatedEvent?> DequeueForVerificationAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await _verificationChannel.Reader.ReadAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (ChannelClosedException)
        {
            return null;
        }
    }

    public async ValueTask<AlertCreatedEvent?> DequeueForNotificationAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await _notificationChannel.Reader.ReadAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (ChannelClosedException)
        {
            return null;
        }
    }
}