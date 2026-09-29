import '../entities/alert_event.dart';

abstract class AlertRepository {
  Future<List<AlertEvent>> getAlertHistory(String userId);
  Future<void> saveAlertEvent(AlertEvent event);
  Future<void> updateAlertStatus(String userId, String alertId, AlertStatus status,
      {int? durationSeconds});
}
