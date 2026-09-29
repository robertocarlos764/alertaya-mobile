import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/domain/entities/alert_event.dart';
import '../../presentation/viewmodels/contacts_viewmodel.dart';
import '../../theme/app_theme.dart';
import '../../widgets/pressable_scale.dart';

class AlertDetailScreen extends StatelessWidget {
  final AlertEvent alert;

  const AlertDetailScreen({super.key, required this.alert});

  Color get _statusColor {
    switch (alert.status) {
      case AlertStatus.active:
        return Colors.green;
      case AlertStatus.cancelled:
        return AppColors.hint;
      case AlertStatus.completed:
        return AppColors.primary;
    }
  }

  String get _statusLabel {
    switch (alert.status) {
      case AlertStatus.active:
        return 'Activa';
      case AlertStatus.cancelled:
        return 'Cancelada';
      case AlertStatus.completed:
        return 'Completada';
    }
  }

  String get _formattedDateTime =>
      DateFormat("d 'de' MMMM yyyy, HH:mm", 'es_CO').format(alert.timestamp);

  String get _duration {
    final secs = alert.duration.inSeconds;
    if (secs < 60) return '${secs} segundos';
    final m = secs ~/ 60;
    final s = secs % 60;
    return s > 0 ? '$m minutos $s segundos' : '$m minutos';
  }

  Future<void> _openMaps() async {
    final url = alert.location ??
        (alert.lat != null && alert.lng != null
            ? 'https://maps.google.com/?q=${alert.lat},${alert.lng}'
            : null);
    if (url == null) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final contactsVm = Get.find<ContactsViewModel>();
    final notifiedContacts = contactsVm.contacts
        .where((c) => alert.notifiedContactIds.contains(c.id))
        .toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.white),
          onPressed: () => Get.back(),
        ),
        title: const Text(
          'Detalle de Alerta',
          style: TextStyle(
              color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              FadeInUp(
                duration: const Duration(milliseconds: 450),
                child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            alert.title,
                            style: const TextStyle(
                                color: AppColors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _statusColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _statusLabel,
                            style: TextStyle(
                                color: _statusColor,
                                fontSize: 12,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      alert.subtitle,
                      style:
                          const TextStyle(color: AppColors.hint, fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                    _infoRow(Icons.calendar_today, 'Fecha y hora',
                        _formattedDateTime),
                    const SizedBox(height: 8),
                    _infoRow(
                        Icons.timer_outlined, 'Duración', _duration),
                  ],
                ),
              ),
              ),
              const SizedBox(height: 24),
              FadeInUp(
                delay: const Duration(milliseconds: 150),
                duration: const Duration(milliseconds: 450),
                child: const Text(
                  'UBICACIÓN GPS',
                  style: TextStyle(
                      color: AppColors.hint,
                      fontSize: 10,
                      letterSpacing: 1.0,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              FadeInUp(
                delay: const Duration(milliseconds: 250),
                duration: const Duration(milliseconds: 450),
                child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (alert.lat != null && alert.lng != null) ...[
                      Row(
                        children: [
                          const Icon(Icons.location_on,
                              color: AppColors.primary, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            '${alert.lat!.toStringAsFixed(6)}°, ${alert.lng!.toStringAsFixed(6)}°',
                            style: const TextStyle(
                                color: AppColors.white,
                                fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ] else
                      const Text(
                        'Ubicación no disponible',
                        style: TextStyle(color: AppColors.hint),
                      ),
                    if (alert.location != null)
                      PressableScale(
                        haptic: true,
                        child: SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: _openMaps,
                            icon: const Icon(Icons.map_outlined,
                                color: AppColors.primary),
                            label: const Text(
                              'Ver en Google Maps',
                              style: TextStyle(color: AppColors.primary),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.primary),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              ),
              const SizedBox(height: 24),
              FadeInUp(
                delay: const Duration(milliseconds: 350),
                duration: const Duration(milliseconds: 450),
                child: const Text(
                  'CONTACTOS NOTIFICADOS',
                  style: TextStyle(
                      color: AppColors.hint,
                      fontSize: 10,
                      letterSpacing: 1.0,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              if (notifiedContacts.isEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline,
                          color: AppColors.hint, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        alert.notifiedContactIds.isEmpty
                            ? 'No se notificaron contactos'
                            : '${alert.notifiedContactIds.length} contacto(s) notificado(s)',
                        style: const TextStyle(color: AppColors.hint),
                      ),
                    ],
                  ),
                )
              else
                ...notifiedContacts.map((c) {
                  final colorHex =
                      c.colorHex.replaceFirst('#', '');
                  final color =
                      Color(int.parse('FF$colorHex', radix: 16));
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: color,
                          child: Text(
                            c.initials,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(c.name,
                                  style: const TextStyle(
                                      color: AppColors.white,
                                      fontWeight: FontWeight.bold)),
                              Text(c.phoneNumber,
                                  style: const TextStyle(
                                      color: AppColors.hint, fontSize: 12)),
                            ],
                          ),
                        ),
                        const Icon(Icons.check_circle,
                            color: Colors.green, size: 20),
                      ],
                    ),
                  );
                }),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.hint, size: 16),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(
                      color: AppColors.hint, fontSize: 11)),
              Text(value,
                  style: const TextStyle(
                      color: AppColors.white, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      );
}
