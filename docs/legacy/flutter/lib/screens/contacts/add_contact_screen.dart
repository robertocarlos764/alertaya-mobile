import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/domain/entities/contact.dart';
import '../../presentation/viewmodels/contacts_viewmodel.dart';
import '../../theme/app_theme.dart';
import '../../widgets/pressable_scale.dart';

class AddContactScreen extends StatefulWidget {
  const AddContactScreen({super.key});

  @override
  State<AddContactScreen> createState() => _AddContactScreenState();
}

class _AddContactScreenState extends State<AddContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _selectedColor = '#E53935';

  static const _colorOptions = [
    '#E53935',
    '#1E88E5',
    '#43A047',
    '#FB8C00',
    '#8E24AA',
    '#F9A825',
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  Color _hexColor(String hex) {
    final h = hex.replaceFirst('#', '');
    return Color(int.parse('FF$h', radix: 16));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final vm = Get.find<ContactsViewModel>();
    final name = _nameCtrl.text.trim();
    final contact = Contact(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      initials: _initials(name),
      phoneNumber: _phoneCtrl.text.trim(),
      colorHex: _selectedColor,
    );
    try {
      await vm.addContact(contact);
      Get.back();
      Get.snackbar(
        'Contacto agregado',
        '${contact.name} fue agregado exitosamente.',
        backgroundColor: AppColors.surface,
        colorText: AppColors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
    } catch (_) {
      Get.snackbar(
        'Error',
        'No se pudo guardar el contacto. Intenta de nuevo.',
        backgroundColor: AppColors.primary,
        colorText: AppColors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final previewInitials = _nameCtrl.text.isNotEmpty
        ? _initials(_nameCtrl.text)
        : '?';

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
          'Nuevo Contacto',
          style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                FadeInDown(
                  duration: const Duration(milliseconds: 450),
                  child: Center(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 250),
                      transitionBuilder: (child, animation) =>
                          ScaleTransition(scale: animation, child: child),
                      child: CircleAvatar(
                        key: ValueKey(_selectedColor),
                        radius: 40,
                        backgroundColor: _hexColor(_selectedColor),
                        child: Text(
                          previewInitials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                const Text(
                  'INFORMACIÓN',
                  style: TextStyle(
                    color: AppColors.hint,
                    fontSize: 10,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _nameCtrl,
                  style: const TextStyle(color: AppColors.white),
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    labelText: 'Nombre completo',
                    hintText: 'Ej: María García',
                    prefixIcon: Icon(Icons.person_outline, color: AppColors.hint),
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
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: AppColors.white),
                  decoration: const InputDecoration(
                    labelText: 'Número de teléfono',
                    hintText: '+57 300 000 0000',
                    prefixIcon: Icon(Icons.phone_outlined, color: AppColors.hint),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'El número es obligatorio';
                    }
                    final digits = v.replaceAll(RegExp(r'\D'), '');
                    if (digits.length < 10) {
                      return 'Ingresa un número válido (mín. 10 dígitos)';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 32),
                const Text(
                  'COLOR DEL AVATAR',
                  style: TextStyle(
                    color: AppColors.hint,
                    fontSize: 10,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: _colorOptions.map((hex) {
                    final isSelected = _selectedColor == hex;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedColor = hex),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _hexColor(hex),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.white
                                : Colors.transparent,
                            width: 3,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: _hexColor(hex).withOpacity(0.5),
                                    blurRadius: 12,
                                    spreadRadius: 2,
                                  )
                                ]
                              : [],
                        ),
                        child: isSelected
                            ? const Icon(Icons.check, color: Colors.white, size: 20)
                            : null,
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 48),
                Obx(() {
                  final vm = Get.find<ContactsViewModel>();
                  return PressableScale(
                    haptic: true,
                    child: SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: vm.isAdding.value ? null : _save,
                        child: vm.isAdding.value
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'GUARDAR CONTACTO',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.0,
                                ),
                              ),
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
