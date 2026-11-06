import 'package:animate_do/animate_do.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../core/domain/entities/alert_event.dart';
import '../presentation/viewmodels/history_viewmodel.dart';
import '../presentation/viewmodels/profile_viewmodel.dart';
import '../theme/app_theme.dart';
import '../widgets/pressable_scale.dart';
import 'alert/alert_detail_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    final userId = FirebaseAuth.instance.currentUser?.uid ?? '';
    Get.find<HistoryViewModel>().loadHistory(userId);
  }

  @override
  Widget build(BuildContext context) {
    final vm = Get.find<HistoryViewModel>();
    final profileVm = Get.find<ProfileViewModel>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Row(children: [
          Icon(Icons.shield_outlined, color: AppColors.primary, size: 28),
          SizedBox(width: 8),
          Text(
            'AlertaYA',
            style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 20),
          ),
        ]),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Obx(() => CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    profileVm.initials,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                )),
          ),
        ],
      ),
      body: SafeArea(
        child: Obx(() {
          if (vm.isLoading.value) {
            return const Center(
                child: CircularProgressIndicator(color: AppColors.primary));
          }
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                FadeInDown(
                  duration: const Duration(milliseconds: 450),
                  child: const Text(
                    'Historial',
                    style: TextStyle(
                        color: AppColors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 8),
                FadeInDown(
                  delay: const Duration(milliseconds: 100),
                  duration: const Duration(milliseconds: 450),
                  child: Text(
                    '${vm.alerts.length} alerta(s) registrada(s)',
                    style: const TextStyle(color: AppColors.hint, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 24),
                if (vm.alerts.isEmpty)
                  Expanded(
                    child: FadeIn(
                      duration: const Duration(milliseconds: 600),
                      delay: const Duration(milliseconds: 200),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Pulse(
                              infinite: true,
                              child: const Icon(Icons.history,
                                  color: AppColors.hint, size: 64),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Sin alertas aún',
                              style: TextStyle(
                                  color: AppColors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Las alertas SOS aparecerán aquí',
                              style: TextStyle(
                                  color: AppColors.hint, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.only(top: 8, bottom: 32),
                      itemCount: vm.alerts.length,
                      itemBuilder: (context, i) => FadeInDown(
                        delay: Duration(milliseconds: 80 * i),
                        duration: const Duration(milliseconds: 450),
                        child: _AlertItem(
                          alert: vm.alerts[i],
                          isLast: i == vm.alerts.length - 1,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _AlertItem extends StatelessWidget {
  final AlertEvent alert;
  final bool isLast;

  const _AlertItem({required this.alert, required this.isLast});

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

  String get _formattedDate =>
      DateFormat("d 'de' MMMM yyyy", 'es_CO').format(alert.timestamp);

  String get _formattedTime =>
      DateFormat('HH:mm', 'es_CO').format(alert.timestamp);

  String get _duration {
    final secs = alert.duration.inSeconds;
    if (secs < 60) return '${secs}s';
    final m = secs ~/ 60;
    final s = secs % 60;
    return s > 0 ? '${m}m ${s}s' : '${m}m';
  }

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      scale: 0.98,
      haptic: true,
      onTap: () => Get.to(() => AlertDetailScreen(alert: alert)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                margin: const EdgeInsets.only(top: 20),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: alert.type == AlertType.critical
                      ? AppColors.primary
                      : AppColors.hint,
                ),
              ),
              if (!isLast)
                Container(width: 2, height: 80, color: AppColors.border),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
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
                              fontWeight: FontWeight.bold,
                              fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: _statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _statusLabel,
                          style: TextStyle(
                              color: _statusColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(alert.subtitle,
                      style:
                          const TextStyle(color: AppColors.hint, fontSize: 12)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 12,
                    runSpacing: 4,
                    children: [
                      _chip(Icons.calendar_today, _formattedDate),
                      _chip(Icons.access_time, _formattedTime),
                      _chip(Icons.timer_outlined, _duration),
                      _chip(Icons.people_outline,
                          '${alert.notifiedContactIds.length} notif.'),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(IconData icon, String label) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.hint, size: 11),
          const SizedBox(width: 3),
          Text(label,
              style: const TextStyle(color: AppColors.hint, fontSize: 11)),
        ],
      );
}
