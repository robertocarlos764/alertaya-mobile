import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'add_contacts_screen.dart';
import '../../theme/app_theme.dart';
import '../../widgets/pressable_scale.dart';

class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  bool gpsGranted = false;
  bool smsGranted = false;
  bool micGranted = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: Colors.white),
        title: const Text('AlertaYA', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context)),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  FadeInDown(
                    duration: const Duration(milliseconds: 450),
                    child: const Text('Configurar Seguridad',
                        style: TextStyle(
                            color: AppColors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold)),
                  ),
                  FadeInDown(
                    delay: const Duration(milliseconds: 150),
                    duration: const Duration(milliseconds: 450),
                    child: Text('PASO 1 DE 2',
                        style: TextStyle(
                            color: AppColors.hint,
                            fontSize: 12,
                            letterSpacing: 1.0)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              FadeInDown(
                delay: const Duration(milliseconds: 250),
                duration: const Duration(milliseconds: 450),
                child: const Text(
                    'Para garantizar tu protección inmediata, AlertaYA requiere acceso a las siguientes funciones críticas de tu dispositivo.',
                    style: TextStyle(color: AppColors.hint, fontSize: 14, height: 1.5)),
              ),
              const SizedBox(height: 32),

              FadeInUp(
                delay: const Duration(milliseconds: 300),
                duration: const Duration(milliseconds: 550),
                child: _buildPermissionCard(
                icon: Icons.location_on,
                title: 'GPS Location',
                desc: 'Permite rastrear tu ubicación exacta para que los servicios de emergencia lleguen a ti sin demoras.',
                isGranted: gpsGranted,
                onTap: () => setState(() => gpsGranted = true),
              ),
              ),
              const SizedBox(height: 16),
              FadeInUp(
                delay: const Duration(milliseconds: 400),
                duration: const Duration(milliseconds: 550),
                child: _buildPermissionCard(
                icon: Icons.sms,
                title: 'SMS Access',
                desc: 'Envía alertas automáticas a tus contactos de confianza con tu ubicación en caso de emergencia detectada.',
                isGranted: smsGranted,
                onTap: () => setState(() => smsGranted = true),
              ),
              ),
              const SizedBox(height: 16),
              FadeInUp(
                delay: const Duration(milliseconds: 500),
                duration: const Duration(milliseconds: 550),
                child: _buildPermissionCard(
                icon: Icons.mic,
                title: 'Microphone',
                desc: 'Detección de comandos de voz de auxilio y ruidos ambientales sospechosos para activación remota.',
                isGranted: micGranted,
                onTap: () => setState(() => micGranted = true),
              ),
              ),
              
              const SizedBox(height: 32),
              Center(
                child: Text('TUS DATOS ESTÁN ENCRIPTADOS Y PROTEGIDOS POR\nLOS PROTOCOLOS DE ALERTAYA', textAlign: TextAlign.center, style: TextStyle(color: AppColors.hint, fontSize: 10, letterSpacing: 1.0)),
              ),
              const SizedBox(height: 24),
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                duration: const Duration(milliseconds: 550),
                child: PressableScale(
                  haptic: true,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.surface,
                        foregroundColor: Colors.white),
                    onPressed: () {
                      Navigator.push(context,
                          MaterialPageRoute(builder: (_) => const AddContactsScreen()));
                    },
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Continuar'),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () {},
                  child: const Text('Continuar cuando termine ->', style: TextStyle(color: AppColors.hint)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPermissionCard({required IconData icon, required String title, required String desc, required bool isGranted, required VoidCallback onTap}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: AppColors.hint, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(desc, style: const TextStyle(color: AppColors.hint, fontSize: 12, height: 1.4)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          PressableScale(
            haptic: true,
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isGranted ? AppColors.surface : AppColors.primary,
                  foregroundColor: isGranted ? AppColors.hint : Colors.white,
                  side: isGranted
                      ? const BorderSide(color: AppColors.border)
                      : null,
                ),
                onPressed: isGranted ? null : onTap,
                icon: isGranted
                    ? const Icon(Icons.check_circle, size: 18)
                    : const SizedBox.shrink(),
                label: Text(isGranted ? 'Permitido' : 'Permitir'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
