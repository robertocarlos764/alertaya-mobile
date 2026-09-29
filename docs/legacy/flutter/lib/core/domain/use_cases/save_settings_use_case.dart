import '../entities/user_settings.dart';
import '../repositories/settings_repository.dart';

class SaveSettingsUseCase {
  final SettingsRepository settingsRepo;

  SaveSettingsUseCase({required this.settingsRepo});

  Future<void> execute(String userId, UserSettings settings) => settingsRepo.saveSettings(userId, settings);
}
