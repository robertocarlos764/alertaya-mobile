import 'package:animate_do/animate_do.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../presentation/viewmodels/home_viewmodel.dart';
import '../presentation/viewmodels/profile_viewmodel.dart';
import 'alert/active_alert_screen.dart';
import '../theme/app_theme.dart';
import '../widgets/pressable_scale.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = Get.find<HomeViewModel>();
    final profileVm = Get.find<ProfileViewModel>();

    return Obx(() {
      if (vm.sosState.value == SosState.active) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.to(() => ActiveAlertScreen(viewModel: vm));
        });
      }

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
          child: Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: 24.0, vertical: 16.0),
            child: Column(
              children: [
                const SizedBox(height: 20),
                FadeInDown(
                  duration: const Duration(milliseconds: 450),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.greenAccent,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Protección activa',
                          style:
                              TextStyle(color: AppColors.white, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                FadeIn(
                  delay: const Duration(milliseconds: 150),
                  duration: const Duration(milliseconds: 500),
                  child: PressableScale(
                    scale: 0.92,
                    haptic: true,
                    onLongPress: () {
                      final userId =
                          FirebaseAuth.instance.currentUser?.uid ?? '';
                      vm.activateSos(userId);
                    },
                    child: Pulse(
                      infinite: true,
                      child: Obx(() => AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            curve: Curves.easeOut,
                            width: 220,
                            height: 220,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color:
                                  vm.sosState.value == SosState.activating
                                      ? AppColors.primary.withOpacity(0.6)
                                      : AppColors.primary,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.4),
                                  blurRadius: 60,
                                  spreadRadius: 20,
                                ),
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.2),
                                  blurRadius: 100,
                                  spreadRadius: 40,
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  vm.sosState.value == SosState.activating
                                      ? '...'
                                      : 'SOS',
                                  style: const TextStyle(
                                    fontSize: 56,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: 2.0,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Icon(Icons.touch_app,
                                    color: Colors.white, size: 32),
                              ],
                            ),
                          )),
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                FadeInUp(
                  delay: const Duration(milliseconds: 300),
                  duration: const Duration(milliseconds: 500),
                  child: const Text(
                    'Mantén presionado 3\nsegundos para activar.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.hint, fontSize: 16),
                  ),
                ),
                const Spacer(),
                FadeInUp(
                  delay: const Duration(milliseconds: 420),
                  duration: const Duration(milliseconds: 500),
                  child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.map_outlined,
                            color: AppColors.hint),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'UBICACIÓN ACTUAL',
                              style: TextStyle(
                                color: AppColors.hint,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'GPS activo — listo para transmitir',
                              style: TextStyle(
                                color: AppColors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.my_location, color: AppColors.primary),
                    ],
                  ),
                ),
                ),
              ],
            ),
          ),
        ),
      );
    });
  }
}
