import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../presentation/viewmodels/contacts_viewmodel.dart';
import '../../presentation/viewmodels/home_viewmodel.dart';
import '../../theme/app_theme.dart';
import '../../widgets/pressable_scale.dart';

class ActiveAlertScreen extends StatelessWidget {
  final HomeViewModel viewModel;

  const ActiveAlertScreen({super.key, required this.viewModel});

  String _formatElapsed(int seconds) {
    if (seconds < 60) return '${seconds}s';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final contactsVm = Get.find<ContactsViewModel>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: AppColors.primary, size: 24),
            SizedBox(width: 8),
            Text(
              'AlertaYA',
              style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 18),
            ),
          ],
        ),
        actions: [
          Obx(() => Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: Row(
                  children: [
                    const Icon(Icons.circle, color: Colors.green, size: 8),
                    const SizedBox(width: 4),
                    Text(
                      _formatElapsed(viewModel.elapsedSeconds.value),
                      style: const TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                          fontSize: 13),
                    ),
                  ],
                ),
              )),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),
              Pulse(
                infinite: true,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.5),
                        blurRadius: 40,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.emergency,
                      color: Colors.white, size: 48),
                ),
              ),
              const SizedBox(height: 24),
              BounceInUp(
                duration: const Duration(milliseconds: 700),
                child: const Text(
                  '¡ALERTA ENVIADA!',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 8),
              FadeIn(
                delay: const Duration(milliseconds: 400),
                duration: const Duration(milliseconds: 500),
                child: const Text(
                  'Enviando tu ubicación a tus contactos.',
                  style: TextStyle(color: AppColors.hint, fontSize: 14),
                ),
              ),
              const SizedBox(height: 32),

              // GPS section
              FadeInUp(
              delay: const Duration(milliseconds: 300),
              duration: const Duration(milliseconds: 550),
              child: Obx(() {
                final alert = viewModel.activeAlert.value;
                final lat = alert?.lat;
                final lng = alert?.lng;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'GPS EN VIVO',
                          style: TextStyle(
                              color: AppColors.hint,
                              fontSize: 10,
                              letterSpacing: 1.0,
                              fontWeight: FontWeight.bold),
                        ),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.green,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'Transmitiendo',
                              style: TextStyle(
                                  color: Colors.green, fontSize: 10),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: Colors.grey[800],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.map,
                                color: Colors.white54),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  lat != null && lng != null
                                      ? '${lat.toStringAsFixed(4)}° N, ${lng.abs().toStringAsFixed(4)}° W'
                                      : 'Obteniendo ubicación...',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold),
                                ),
                                const Text(
                                  'Alta precisión',
                                  style: TextStyle(
                                      color: AppColors.hint, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              }),
              ),

              const SizedBox(height: 32),

              // Notified contacts
              FadeInUp(
                delay: const Duration(milliseconds: 450),
                duration: const Duration(milliseconds: 550),
                child: const Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'CONTACTOS NOTIFICADOS',
                    style: TextStyle(
                        color: AppColors.hint,
                        fontSize: 10,
                        letterSpacing: 1.0,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Obx(() {
                final alert = viewModel.activeAlert.value;
                if (alert == null) return const SizedBox.shrink();

                final notified = contactsVm.contacts
                    .where((c) => alert.notifiedContactIds.contains(c.id))
                    .toList();

                if (notified.isEmpty) {
                  return const Text(
                    'No hay contactos notificados',
                    style: TextStyle(color: AppColors.hint),
                  );
                }

                return Column(
                  children: notified.map((c) {
                    final colorHex = c.colorHex.replaceFirst('#', '');
                    final color =
                        Color(int.parse('FF$colorHex', radix: 16));
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: color,
                            child: Text(
                              c.initials,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  c.name,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  c.phoneNumber,
                                  style: const TextStyle(
                                      color: AppColors.hint,
                                      fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.check_circle,
                              color: Colors.green, size: 20),
                        ],
                      ),
                    );
                  }).toList(),
                );
              }),

              const SizedBox(height: 32),
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                duration: const Duration(milliseconds: 550),
                child: PressableScale(
                  haptic: true,
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side:
                            const BorderSide(color: AppColors.primary, width: 2),
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      onPressed: () async {
                        await viewModel.cancelAlert();
                        if (context.mounted) Navigator.pop(context);
                      },
                      child: const Text(
                        'CANCELAR ALERTA',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, letterSpacing: 1.0),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.phone, color: AppColors.hint),
                label: const Text(
                  'Llamar al 123',
                  style: TextStyle(color: AppColors.hint),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
