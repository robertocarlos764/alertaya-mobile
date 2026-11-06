import 'package:animate_do/animate_do.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../presentation/viewmodels/profile_viewmodel.dart';
import '../../theme/app_theme.dart';
import '../../widgets/pressable_scale.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController();
    _phoneCtrl = TextEditingController();
    final vm = Get.find<ProfileViewModel>();
    final userId = FirebaseAuth.instance.currentUser?.uid ?? '';
    vm.loadProfile(userId).then((_) {
      if (mounted && vm.profile.value != null) {
        _nameCtrl.text = vm.profile.value!.name;
        _phoneCtrl.text = vm.profile.value!.phone;
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final vm = Get.find<ProfileViewModel>();
    try {
      await vm.saveProfile(_nameCtrl.text.trim(), _phoneCtrl.text.trim());
      Get.back();
      Get.snackbar(
        'Perfil actualizado',
        'Tus datos fueron guardados exitosamente.',
        backgroundColor: AppColors.surface,
        colorText: AppColors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
    } catch (_) {
      Get.snackbar(
        'Error',
        'No se pudo actualizar el perfil. Intenta de nuevo.',
        backgroundColor: AppColors.primary,
        colorText: AppColors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final vm = Get.find<ProfileViewModel>();
    final email =
        FirebaseAuth.instance.currentUser?.email ?? '';

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
          'Editar Perfil',
          style: TextStyle(
              color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SafeArea(
        child: Obx(() {
          if (vm.isLoading.value) {
            return const Center(
                child: CircularProgressIndicator(color: AppColors.primary));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 32),
                  FadeInDown(
                    duration: const Duration(milliseconds: 500),
                    child: Center(
                      child: CircleAvatar(
                        radius: 48,
                        backgroundColor: AppColors.primary,
                        child: Text(
                          vm.initials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FadeInDown(
                    delay: const Duration(milliseconds: 150),
                    duration: const Duration(milliseconds: 500),
                    child: Center(
                      child: Text(
                        email,
                        style: const TextStyle(
                            color: AppColors.hint, fontSize: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  FadeInUp(
                    delay: const Duration(milliseconds: 250),
                    duration: const Duration(milliseconds: 550),
                    child: const Text(
                      'DATOS PERSONALES',
                      style: TextStyle(
                          color: AppColors.hint,
                          fontSize: 10,
                          letterSpacing: 1.0,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _nameCtrl,
                    style: const TextStyle(color: AppColors.white),
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(
                      labelText: 'Nombre completo',
                      prefixIcon: Icon(Icons.person_outline,
                          color: AppColors.hint),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) {
                        return 'El nombre es obligatorio';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    initialValue: email,
                    readOnly: true,
                    style: const TextStyle(color: AppColors.hint),
                    decoration: const InputDecoration(
                      labelText: 'Correo electrónico',
                      prefixIcon: Icon(Icons.email_outlined,
                          color: AppColors.hint),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: AppColors.white),
                    decoration: const InputDecoration(
                      labelText: 'Teléfono',
                      hintText: '+57 300 000 0000',
                      prefixIcon: Icon(Icons.phone_outlined,
                          color: AppColors.hint),
                    ),
                  ),
                  const SizedBox(height: 48),
                  Obx(() => PressableScale(
                        haptic: true,
                        child: SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: vm.isSaving.value ? null : _save,
                            child: vm.isSaving.value
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'GUARDAR CAMBIOS',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                          ),
                        ),
                      )),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
