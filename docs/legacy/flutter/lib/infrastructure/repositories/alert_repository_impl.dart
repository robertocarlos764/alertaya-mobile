import 'package:cloud_firestore/cloud_firestore.dart';
import '../../core/domain/entities/alert_event.dart';
import '../../core/domain/repositories/alert_repository.dart';

class AlertRepositoryImpl implements AlertRepository {
  final _db = FirebaseFirestore.instance;

  @override
  Future<List<AlertEvent>> getAlertHistory(String userId) async {
    final snap = await _db
        .collection('users')
        .doc(userId)
        .collection('alerts')
        .orderBy('timestamp', descending: true)
        .get();
    return snap.docs.map((d) {
      final data = d.data();
      return AlertEvent(
        id: d.id,
        userId: userId,
        title: data['title'] ?? '',
        subtitle: data['subtitle'] ?? '',
        timestamp: (data['timestamp'] as Timestamp).toDate(),
        duration: Duration(seconds: data['durationSeconds'] ?? 0),
        location: data['location'],
        lat: (data['lat'] as num?)?.toDouble(),
        lng: (data['lng'] as num?)?.toDouble(),
        status: AlertStatus.values.firstWhere(
          (s) => s.name == data['status'],
          orElse: () => AlertStatus.completed,
        ),
        type: AlertType.values.firstWhere(
          (t) => t.name == data['type'],
          orElse: () => AlertType.standard,
        ),
        notifiedContactIds:
            List<String>.from(data['notifiedContactIds'] ?? []),
      );
    }).toList();
  }

  @override
  Future<void> saveAlertEvent(AlertEvent event) =>
      _db.collection('users').doc(event.userId).collection('alerts').doc(event.id).set({
        'title': event.title,
        'subtitle': event.subtitle,
        'timestamp': Timestamp.fromDate(event.timestamp),
        'durationSeconds': event.duration.inSeconds,
        'location': event.location,
        'lat': event.lat,
        'lng': event.lng,
        'status': event.status.name,
        'type': event.type.name,
        'notifiedContactIds': event.notifiedContactIds,
      });

  @override
  Future<void> updateAlertStatus(
    String userId,
    String alertId,
    AlertStatus status, {
    int? durationSeconds,
  }) async {
    final data = <String, dynamic>{'status': status.name};
    if (durationSeconds != null) data['durationSeconds'] = durationSeconds;
    await _db
        .collection('users')
        .doc(userId)
        .collection('alerts')
        .doc(alertId)
        .update(data);
  }
}
