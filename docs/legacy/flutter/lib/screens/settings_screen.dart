import 'package:animate_do/animate_do.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../injection_container.dart';
import '../presentation/viewmodels/profile_viewmodel.dart';
import '../presentation/viewmodels/settings_viewmodel.dart';
import 'auth/login_screen.dart';
import 'profile/change_password_screen.dart';
import 'profile/profile_screen.dart';
import '../theme/app_theme.dart';
import '../widgets/pressable_scale.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = Get.find<SettingsViewModel>();
    final profileVm = Get.find<ProfileViewModel>();

    return Obx(() {
      final s = vm.settings.value;
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                FadeInDown(
                  duration: const Duration(milliseconds: 450),
                  child: const Text(
                    'Configuración',
                    style: TextStyle(
                        color: AppColors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 32),
                FadeInDown(
                  delay: const Duration(milliseconds: 100),
                  duration: const Duration(milliseconds: 450),
                  child: const Text(
                    'PROTOCOLOS DE EMERGENCIA',
                    style: TextStyle(
                        color: AppColors.hint,
                        fontSize: 10,
                        letterSpacing: 1.0,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 16),
                FadeInUp(
                  delay: const Duration(milliseconds: 150),
                  duration: const Duration(milliseconds: 500),
                  child: _buildSettingCard(
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(children: [
                            Icon(Icons.mic, color: AppColors.hint),
                            SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Activación por Voz',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold)),
                                Text('Activar alerta con frase',
                                    style: TextStyle(
                                        color: AppColors.hint, fontSize: 12)),
                              ],
                            ),
                          ]),
                          Switch(
                            value: s.voiceActivationEnabled,
                            activeColor: AppColors.primary,
                            onChanged: vm.toggleVoiceActivation,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                ),
                const SizedBox(height: 12),
                FadeInUp(
                  delay: const Duration(milliseconds: 250),
                  duration: const Duration(milliseconds: 500),
                  child: _buildSettingCard(
                  child: Column(
                    children: [
                      const Row(children: [
                        Icon(Icons.timer_outlined, color: AppColors.hint),
                        SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Intervalo SMS',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold)),
                            Text('Frecuencia de actualizaciones',
                                style: TextStyle(
                                    color: AppColors.hint, fontSize: 12)),
                          ],
                        ),
                      ]),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _buildIntervalBtn(vm, 15, s.smsIntervalSeconds),
                          const SizedBox(width: 8),
                          _buildIntervalBtn(vm, 30, s.smsIntervalSeconds),
                          const SizedBox(width: 8),
                          _buildIntervalBtn(vm, 60, s.smsIntervalSeconds),
                        ],
                      ),
                    ],
                  ),
                ),
                ),
                const SizedBox(height: 12),
                FadeInUp(
                  delay: const Duration(milliseconds: 350),
                  duration: const Duration(milliseconds: 500),
                  child: _buildSettingCard(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(children: [
                        Icon(Icons.local_police_outlined,
                            color: AppColors.primary),
                        SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Llamada a Policía',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold)),
                            Text('Auto-llamar 123 al activar',
                                style: TextStyle(
                                    color: AppColors.hint, fontSize: 12)),
                          ],
                        ),
                      ]),
                      Switch(
                        value: s.policeAutoCall,
                        activeColor: AppColors.primary,
                        onChanged: vm.togglePoliceCall,
                      ),
                    ],
                  ),
                ),
                ),
                const SizedBox(height: 32),
                FadeInDown(
                  delay: const Duration(milliseconds: 400),
                  duration: const Duration(milliseconds: 450),
                  child: const Text(
                    'CUENTA Y SEGURIDAD',
                    style: TextStyle(
                        color: AppColors.hint,
                        fontSize: 10,
                        letterSpacing: 1.0,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 16),
                FadeInUp(
                  delay: const Duration(milliseconds: 500),
                  duration: const Duration(milliseconds: 500),
                  child: _buildActionTile(
                    Icons.person_outline,
                    'Editar perfil',
                    'Gestionar información personal',
                    onTap: () => Get.to(() => const ProfileScreen()),
                  ),
                ),
                FadeInUp(
                  delay: const Duration(milliseconds: 600),
                  duration: const Duration(milliseconds: 500),
                  child: _buildActionTile(
                    Icons.lock_outline,
                    'Cambiar contraseña',
                    'Actualiza tu contraseña de acceso',
                    onTap: () => Get.to(() => const ChangePasswordScreen()),
                  ),
                ),
                FadeInUp(
                  delay: const Duration(milliseconds: 700),
                  duration: const Duration(milliseconds: 500),
                  child: _buildActionTile(
                    Icons.logout,
                    'Cerrar sesión',
                    'Salir de tu cuenta',
                    isDestructive: true,
                    onTap: () => _confirmLogout(context),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      );
    });
  }

  Widget _buildSettingCard({required Widget child}) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: child,
      );

  Widget _buildIntervalBtn(
      SettingsViewModel vm, int seconds, int current) {
    final isSelected = current == seconds;
    return Expanded(
      child: PressableScale(
        scale: 0.9,
        haptic: true,
        onTap: () => vm.setSmsInterval(seconds),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : AppColors.background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.4),
                      blurRadius: 10,
                      spreadRadius: 1,
                    ),
                  ]
                : const [],
          ),
          child: Center(
            child: Text(
              '${seconds}s',
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.hint,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }

Widget _buildActionTile(IconData icon, String title, String subtitle,
        {bool isDestructive = false, VoidCallback? onTap}) =>
    PressableScale(
      scale: 0.97,
      haptic: true,
      onTap: onTap,
      child: SizedBox(
        width: double.infinity,
        child: ListTile(
          contentPadding: EdgeInsets.zero,
          leading: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon,
                color: isDestructive ? AppColors.primary : AppColors.hint),
          ),
          title: Text(
            title,
            style: TextStyle(
              color: isDestructive ? AppColors.primary : Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          subtitle: Text(subtitle,
              style: const TextStyle(color: AppColors.hint, fontSize: 12)),
          trailing: const Icon(Icons.chevron_right, color: AppColors.hint),
        ),
      ),
    );

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(children: [
          Icon(Icons.logout, color: AppColors.primary, size: 20),
          SizedBox(width: 10),
          Text('Cerrar sesión',
              style: TextStyle(color: AppColors.white, fontSize: 18)),
        ]),
        content: const Text(
          '¿Estás seguro de que deseas cerrar sesión?',
          style: TextStyle(color: AppColors.hint, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(foregroundColor: AppColors.hint),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await FirebaseAuth.instance.signOut();
              InjectionContainer.reset();
              Get.offAll(() => const LoginScreen());
            },
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );
  }
}
