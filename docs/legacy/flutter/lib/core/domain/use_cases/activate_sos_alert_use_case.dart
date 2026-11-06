import '../entities/alert_event.dart';
import '../repositories/contact_repository.dart';
import '../repositories/alert_repository.dart';
import '../services/location_service.dart';
import '../services/notification_service.dart';

class ActivateSosAlertUseCase {
  final ContactRepository contactRepo;
  final AlertRepository alertRepo;
  final LocationService locationService;
  final NotificationService notificationService;

  ActivateSosAlertUseCase({
    required this.contactRepo,
    required this.alertRepo,
    required this.locationService,
    required this.notificationService,
  });

  Future<AlertEvent> execute(String userId) async {
    final contacts = await contactRepo.getAllContacts();
    final loc = await locationService.getCurrentLocation();
    final locationUrl =
        'https://maps.google.com/?q=${loc.lat},${loc.lng}';
    final alert = AlertEvent(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: userId,
      title: 'Alerta SOS Activada',
      subtitle: 'Alerta enviada a ${contacts.length} contacto(s)',
      timestamp: DateTime.now(),
      duration: Duration.zero,
      location: locationUrl,
      lat: loc.lat,
      lng: loc.lng,
      status: AlertStatus.active,
      type: AlertType.critical,
      notifiedContactIds: contacts.map((c) => c.id).toList(),
    );
    await alertRepo.saveAlertEvent(alert);
    for (final contact in contacts) {
      await notificationService.sendNotification(
        contact.phoneNumber,
        '🆘 AlertaYA: ${contact.name}, necesito ayuda. Mi ubicación: $locationUrl',
      );
    }
    return alert;
  }
}
