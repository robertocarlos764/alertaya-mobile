class UserSettings {
  final bool voiceActivationEnabled;
  final String voiceKeyword;
  final bool policeAutoCall;
  final int smsIntervalSeconds;

  const UserSettings({
    required this.voiceActivationEnabled,
    required this.voiceKeyword,
    required this.policeAutoCall,
    required this.smsIntervalSeconds,
  });

  UserSettings copyWith({
    bool? voiceActivationEnabled,
    String? voiceKeyword,
    bool? policeAutoCall,
    int? smsIntervalSeconds,
  }) {
    return UserSettings(
      voiceActivationEnabled: voiceActivationEnabled ?? this.voiceActivationEnabled,
      voiceKeyword: voiceKeyword ?? this.voiceKeyword,
      policeAutoCall: policeAutoCall ?? this.policeAutoCall,
      smsIntervalSeconds: smsIntervalSeconds ?? this.smsIntervalSeconds,
    );
  }
}
