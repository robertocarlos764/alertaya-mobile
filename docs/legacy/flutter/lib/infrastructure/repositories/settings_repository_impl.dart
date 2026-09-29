import 'package:shared_preferences/shared_preferences.dart';
import '../../core/domain/entities/user_settings.dart';
import '../../core/domain/repositories/settings_repository.dart';

class SettingsRepositoryImpl implements SettingsRepository {
  static const _keyVoice = 'voice_activation';
  static const _keyKeyword = 'voice_keyword';
  static const _keyPolice = 'police_auto_call';
  static const _keySms = 'sms_interval';

  @override
  Future<UserSettings> getSettings(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    return UserSettings(
      voiceActivationEnabled: prefs.getBool(_keyVoice) ?? true,
      voiceKeyword: prefs.getString(_keyKeyword) ?? 'Auxilio',
      policeAutoCall: prefs.getBool(_keyPolice) ?? false,
      smsIntervalSeconds: prefs.getInt(_keySms) ?? 30,
    );
  }

  @override
  Future<void> saveSettings(String userId, UserSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyVoice, settings.voiceActivationEnabled);
    await prefs.setString(_keyKeyword, settings.voiceKeyword);
    await prefs.setBool(_keyPolice, settings.policeAutoCall);
    await prefs.setInt(_keySms, settings.smsIntervalSeconds);
  }
}
