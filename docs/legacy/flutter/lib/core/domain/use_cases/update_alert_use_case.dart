import '../entities/alert_event.dart';
import '../repositories/alert_repository.dart';

class UpdateAlertUseCase {
  final AlertRepository _alertRepo;

  UpdateAlertUseCase({required AlertRepository alertRepo})
      : _alertRepo = alertRepo;

  Future<void> execute(String userId, String alertId, AlertStatus status,
          {int? durationSeconds}) =>
      _alertRepo.updateAlertStatus(userId, alertId, status,
          durationSeconds: durationSeconds);
}
