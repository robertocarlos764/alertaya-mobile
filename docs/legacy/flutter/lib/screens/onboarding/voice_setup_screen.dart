import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../main_layout.dart';
import '../../theme/app_theme.dart';
import '../../widgets/pressable_scale.dart';

class VoiceSetupScreen extends StatelessWidget {
  const VoiceSetupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: Colors.white),
        title: const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Voz y Activación', style: TextStyle(color: AppColors.white, fontSize: 16)),
            Text('AlertaYA', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
const Text('Configura tu frase', style: TextStyle(color: AppColors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              const Text(
                'El sistema escuchará esta palabra clave para enviar una alerta inmediata incluso si tu celular está bloqueado.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.hint, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 48),

              FadeIn(
                duration: const Duration(milliseconds: 600),
                child: Pulse(
                  infinite: true,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.surface,
                      border: Border.all(color: AppColors.primary, width: 2),
                      boxShadow: [
                        BoxShadow(color: AppColors.primary.withOpacity(0.2), blurRadius: 40, spreadRadius: 10),
                      ],
                    ),
                    child: const Icon(Icons.mic, color: AppColors.primary, size: 48),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              FadeInDown(
                delay: const Duration(milliseconds: 250),
                duration: const Duration(milliseconds: 500),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    Text('ESPERANDO AUDIO', style: TextStyle(color: AppColors.primary, fontSize: 10, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              
              const SizedBox(height: 48),
              FadeInUp(
                delay: const Duration(milliseconds: 300),
                duration: const Duration(milliseconds: 500),
                child: const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('PALABRA CLAVE', style: TextStyle(color: AppColors.hint, fontSize: 10, letterSpacing: 1.0)),
                ),
              ),
              const SizedBox(height: 8),
              const TextField(
                decoration: InputDecoration(hintText: 'Ej: Auxilio Alerta'),
                style: TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 16),
              
FadeInUp(
                delay: const Duration(milliseconds: 350),
                duration: const Duration(milliseconds: 550),
                child: PressableScale(
                  haptic: true,
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary.withOpacity(0.2), foregroundColor: AppColors.primary, elevation: 0),
                      icon: const Icon(Icons.play_circle_outline),
                      label: const Text('Probar activación'),
                      onPressed: () {},
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),
              FadeInUp(
                delay: const Duration(milliseconds: 450),
                duration: const Duration(milliseconds: 550),
                child: PressableScale(
                  haptic: true,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.surface, foregroundColor: Colors.white),
                    onPressed: () {
                      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const MainLayout()), (route) => false);
                    },
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Continuar'),
                        Icon(Icons.arrow_forward),
                      ],
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('RECOMENDACIONES', style: TextStyle(color: AppColors.hint, fontSize: 10, letterSpacing: 1.0)),
              ),
              const SizedBox(height: 16),
              _buildRecommendation(Icons.record_voice_over, 'Claridad Ante Todo', 'Usa frases cortas de 2 o 3 palabras que puedas pronunciar fácilmente bajo estrés.'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecommendation(IconData icon, String title, String desc) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(desc, style: const TextStyle(color: AppColors.hint, fontSize: 12, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
