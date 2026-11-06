class AlertEvent {
  final String title;
  final String subtitle;
  final String date;
  final String time;
  final String duration;
  final String? location;
  final String status;
  final bool isCritical;

  AlertEvent({
    required this.title,
    required this.subtitle,
    required this.date,
    required this.time,
    required this.duration,
    this.location,
    required this.status,
    required this.isCritical,
  });
}
