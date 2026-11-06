import '../entities/alert_event.dart';
import '../repositories/alert_repository.dart';

class GetAlertHistoryUseCase {
  final AlertRepository _alertRepo;

  GetAlertHistoryUseCase({required AlertRepository alertRepo})
      : _alertRepo = alertRepo;

  Future<List<AlertEvent>> execute(String userId) =>
      _alertRepo.getAlertHistory(userId);
}
