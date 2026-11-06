import 'package:get/get.dart';
import '../../core/domain/entities/user_settings.dart';
import '../../core/domain/use_cases/save_settings_use_case.dart';

class SettingsViewModel extends GetxController {
  final SaveSettingsUseCase _saveSettingsUseCase;

  final settings = const UserSettings(
    voiceActivationEnabled: true,
    voiceKeyword: 'Auxilio',
    policeAutoCall: false,
    smsIntervalSeconds: 30,
  ).obs;

  SettingsViewModel({required SaveSettingsUseCase saveSettingsUseCase})
      : _saveSettingsUseCase = saveSettingsUseCase;

  void toggleVoiceActivation(bool value) =>
      settings.value = settings.value.copyWith(voiceActivationEnabled: value);

  void setSmsInterval(int seconds) =>
      settings.value = settings.value.copyWith(smsIntervalSeconds: seconds);

  void togglePoliceCall(bool value) =>
      settings.value = settings.value.copyWith(policeAutoCall: value);

  Future<void> saveSettings(String userId) =>
      _saveSettingsUseCase.execute(userId, settings.value);
}
