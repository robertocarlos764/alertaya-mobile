enum AlertStatus { active, completed, cancelled }

enum AlertType { standard, critical }

class AlertEvent {
  final String id;
  final String userId;
  final String title;
  final String subtitle;
  final DateTime timestamp;
  final Duration duration;
  final String? location;
  final double? lat;
  final double? lng;
  final AlertStatus status;
  final AlertType type;
  final List<String> notifiedContactIds;

  AlertEvent({
    required this.id,
    required this.userId,
    required this.title,
    required this.subtitle,
    required this.timestamp,
    required this.duration,
    this.location,
    this.lat,
    this.lng,
    required this.status,
    required this.type,
    required this.notifiedContactIds,
  });

  AlertEvent copyWith({
    Duration? duration,
    AlertStatus? status,
  }) =>
      AlertEvent(
        id: id,
        userId: userId,
        title: title,
        subtitle: subtitle,
        timestamp: timestamp,
        duration: duration ?? this.duration,
        location: location,
        lat: lat,
        lng: lng,
        status: status ?? this.status,
        type: type,
        notifiedContactIds: notifiedContactIds,
      );
}
