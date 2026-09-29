namespace AlertaYA.Domain.Entities;

/// <summary>
/// Preferencias de la cuenta. <see cref="VoiceActivationEnabled"/> y
/// <see cref="PoliceAutoCall"/> se persisten pero no tienen comportamiento
/// asociado en este alcance: ver la capacidad ajustes-usuario.
/// </summary>
public sealed class UserSettings
{
    /// <summary>Cota inferior: por debajo, el reenvío resulta indistinguible de un duplicado.</summary>
    public const int MinSmsIntervalSeconds = 30;

    /// <summary>Cota superior: diez minutos entre reenvíos durante una emergencia.</summary>
    public const int MaxSmsIntervalSeconds = 600;

    public const int DefaultSmsIntervalSeconds = 60;

    public Guid UserId { get; }
    public bool VoiceActivationEnabled { get; private set; }
    public string? VoiceKeyword { get; private set; }
    public bool PoliceAutoCall { get; private set; }
    public int SmsIntervalSeconds { get; private set; }

    private UserSettings(
        Guid userId,
        bool voiceActivationEnabled,
        string? voiceKeyword,
        bool policeAutoCall,
        int smsIntervalSeconds)
    {
        UserId = userId;
        VoiceActivationEnabled = voiceActivationEnabled;
        VoiceKeyword = voiceKeyword;
        PoliceAutoCall = policeAutoCall;
        SmsIntervalSeconds = smsIntervalSeconds;
    }

    /// <summary>
    /// Ajustes por defecto para una cuenta que nunca los ha modificado. Se devuelven
    /// sin requerir escritura previa.
    /// </summary>
    public static UserSettings Defaults(Guid userId) =>
        new(userId, false, null, false, DefaultSmsIntervalSeconds);

    public static UserSettings Create(
        Guid userId,
        bool voiceActivationEnabled,
        string? voiceKeyword,
        bool policeAutoCall,
        int smsIntervalSeconds)
    {
        Validate(voiceActivationEnabled, voiceKeyword, smsIntervalSeconds);

        return new UserSettings(
            userId,
            voiceActivationEnabled,
            Normalize(voiceKeyword),
            policeAutoCall,
            smsIntervalSeconds);
    }

    /// <summary>
    /// Aplica todos los cambios o ninguno: un valor inválido no debe alterar el resto.
    /// </summary>
    public void Update(
        bool voiceActivationEnabled,
        string? voiceKeyword,
        bool policeAutoCall,
        int smsIntervalSeconds)
    {
        Validate(voiceActivationEnabled, voiceKeyword, smsIntervalSeconds);

        VoiceActivationEnabled = voiceActivationEnabled;
        VoiceKeyword = Normalize(voiceKeyword);
        PoliceAutoCall = policeAutoCall;
        SmsIntervalSeconds = smsIntervalSeconds;
    }

    private static void Validate(bool voiceActivationEnabled, string? voiceKeyword, int smsIntervalSeconds)
    {
        if (smsIntervalSeconds < MinSmsIntervalSeconds || smsIntervalSeconds > MaxSmsIntervalSeconds)
        {
            throw new ArgumentOutOfRangeException(
                nameof(smsIntervalSeconds),
                smsIntervalSeconds,
                $"El intervalo debe estar entre {MinSmsIntervalSeconds} y {MaxSmsIntervalSeconds} segundos.");
        }

        if (voiceActivationEnabled && string.IsNullOrWhiteSpace(voiceKeyword))
        {
            throw new ArgumentException(
                "La palabra clave es obligatoria cuando la activación por voz está habilitada.",
                nameof(voiceKeyword));
        }
    }

    private static string? Normalize(string? keyword) =>
        string.IsNullOrWhiteSpace(keyword) ? null : keyword.Trim();
}
