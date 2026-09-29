import '../../../core/domain/services/notification_service.dart';

class MockNotificationAdapter implements NotificationService {
  @override
  Future<void> sendNotification(String to, String message) async {
    print('[MockNotification] SMS a ' + to + ': ' + message);
  }
}
