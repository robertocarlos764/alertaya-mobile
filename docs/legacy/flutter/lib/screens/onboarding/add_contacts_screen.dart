import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'voice_setup_screen.dart';
import '../../core/domain/entities/contact.dart';
import '../../presentation/viewmodels/contacts_viewmodel.dart';
import '../../theme/app_theme.dart';
import '../../widgets/pressable_scale.dart';

class AddContactsScreen extends StatefulWidget {
  const AddContactsScreen({super.key});

  @override
  State<AddContactsScreen> createState() => _AddContactsScreenState();
}

class _AddContactsScreenState extends State<AddContactsScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _showMinError = false;

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

  Future<void> _addContact() async {
    final name = _nameCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();

    if (name.isEmpty) {
      Get.snackbar(
        'Campo requerido',
        'Ingresa el nombre del contacto.',
        backgroundColor: AppColors.primary,
        colorText: AppColors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
      return;
    }
    if (phone.isEmpty) {
      Get.snackbar(
        'Campo requerido',
        'Ingresa el número de teléfono.',
        backgroundColor: AppColors.primary,
        colorText: AppColors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
      return;
    }
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 10) {
      Get.snackbar(
        'Número inválido',
        'Ingresa un número válido (mínimo 10 dígitos).',
        backgroundColor: AppColors.primary,
        colorText: AppColors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
      return;
    }

    final vm = Get.find<ContactsViewModel>();
    final colorHex = _colorOptions[vm.contacts.length % _colorOptions.length];

    final contact = Contact(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      initials: _initials(name),
      phoneNumber: phone,
      colorHex: colorHex,
    );

    try {
      await vm.addContact(contact);
      _nameCtrl.clear();
      _phoneCtrl.clear();
      if (mounted) setState(() => _showMinError = false);
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

  void _continuar() {
    final vm = Get.find<ContactsViewModel>();
    if (vm.contacts.isEmpty) {
      setState(() => _showMinError = true);
      return;
    }
    Get.to(() => const VoiceSetupScreen());
  }

  void _configurarMasTarde() {
    Get.to(() => const VoiceSetupScreen());
  }

  @override
  Widget build(BuildContext context) {
    final vm = Get.find<ContactsViewModel>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: Colors.white),
        title: const Row(
          mainAxisSize: MainAxisSize.min,
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
                    child: const Text(
                      'Contactos',
                      style: TextStyle(
                          color: AppColors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                  FadeInDown(
                    delay: const Duration(milliseconds: 150),
                    duration: const Duration(milliseconds: 450),
                    child: Text(
                      'Paso 2 de 2',
                      style:
                          TextStyle(color: AppColors.hint, fontSize: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                duration: const Duration(milliseconds: 450),
                child: Container(height: 2, color: AppColors.primary),
              ),
              const SizedBox(height: 8),
              FadeInDown(
                delay: const Duration(milliseconds: 250),
                duration: const Duration(milliseconds: 450),
                child: Text(
                  'Agrega al menos 1 contacto de emergencia para recibir tus alertas SOS.',
                  style: TextStyle(
                      color: AppColors.hint,
                      fontSize: 13,
                      height: 1.4),
                ),
              ),
              const SizedBox(height: 24),

              // Formulario
              Text(
                'NOMBRE DEL CONTACTO',
                style: TextStyle(
                    color: AppColors.hint,
                    fontSize: 10,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _nameCtrl,
                style: const TextStyle(color: Colors.white),
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  hintText: 'Ej. María García',
                  prefixIcon:
                      Icon(Icons.person_outline, color: AppColors.hint),
                ),
              ),
              const SizedBox(height: 16),

              Text(
                'NÚMERO DE TELÉFONO',
                style: TextStyle(
                    color: AppColors.hint,
                    fontSize: 10,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: '+57 300 000 0000',
                  prefixIcon:
                      Icon(Icons.phone_outlined, color: AppColors.hint),
                ),
              ),
              const SizedBox(height: 20),

              // Botón agregar
              Obx(() => PressableScale(
                    haptic: true,
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: vm.isAdding.value
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2),
                              )
                            : const Icon(Icons.add_circle_outline),
                        label: Text(vm.isAdding.value
                            ? 'Guardando...'
                            : 'Agregar contacto'),
                        onPressed: vm.isAdding.value ? null : _addContact,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  )),

              // Error mínimo — solo aparece al presionar Continuar sin contactos
              if (_showMinError) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        color: AppColors.primary, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      'Debes agregar al menos 1 contacto para continuar.',
                      style: TextStyle(
                          color: AppColors.primary.withValues(alpha: 0.9),
                          fontSize: 12),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 36),

              // Lista de contactos agregados
              Obx(() {
                if (vm.contacts.isEmpty) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.people_outline,
                            color: AppColors.hint, size: 40),
                        const SizedBox(height: 12),
                        Text(
                          'Sin contactos aún',
                          style: TextStyle(
                              color: AppColors.hint, fontSize: 14),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Los contactos que agregues aparecerán aquí',
                          style: TextStyle(
                              color: AppColors.hint.withValues(alpha: 0.6),
                              fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Contactos Agregados',
                          style: TextStyle(
                              color: AppColors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${vm.contacts.length}',
                            style: const TextStyle(
                                color: AppColors.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...vm.contacts.asMap().entries.map((entry) => FadeInDown(
                          delay: Duration(milliseconds: 80 * entry.key),
                          duration: const Duration(milliseconds: 400),
                          child: _ContactItem(
                            contact: entry.value,
                            onDelete: () {
                              vm.removeContactWithUndo(entry.value.id);
                              vm.confirmRemove(entry.value.id);
                            },
                          ),
                        )),
                  ],
                );
              }),

              const SizedBox(height: 32),

              // Botón continuar
              SizedBox(
                width: double.infinity,
                child: PressableScale(
                  haptic: true,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.surface,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: _continuar,
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
                  onPressed: _configurarMasTarde,
                  child: const Text(
                    'Configurar más tarde',
                    style: TextStyle(color: AppColors.hint),
                  ),
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

class _ContactItem extends StatelessWidget {
  final Contact contact;
  final VoidCallback onDelete;

  const _ContactItem({required this.contact, required this.onDelete});

  Color _hexColor(String hex) {
    final h = hex.replaceFirst('#', '');
    return Color(int.parse('FF$h', radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    final color = _hexColor(contact.colorHex);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
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
              contact.initials,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  contact.name,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold),
                ),
                Text(
                  contact.phoneNumber,
                  style: const TextStyle(color: AppColors.hint, fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppColors.hint),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}
