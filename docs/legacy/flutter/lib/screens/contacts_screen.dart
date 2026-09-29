import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../presentation/viewmodels/contacts_viewmodel.dart';
import '../presentation/viewmodels/profile_viewmodel.dart';
import '../widgets/contact_card.dart';
import '../theme/app_theme.dart';
import '../widgets/pressable_scale.dart';
import 'contacts/add_contact_screen.dart';

class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key});

  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  @override
  void initState() {
    super.initState();
    final vm = Get.find<ContactsViewModel>();
    if (vm.state.value == ViewState.idle) vm.loadContacts();
  }

  @override
  Widget build(BuildContext context) {
    final vm = Get.find<ContactsViewModel>();
    final profileVm = Get.find<ProfileViewModel>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(children: [
          const Icon(Icons.shield_outlined, color: AppColors.primary, size: 28),
          const SizedBox(width: 8),
          const Text(
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
            child: Obx(() {
              final initials = profileVm.initials;
              return CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary,
                child: Text(
                  initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
      body: SafeArea(
        child: Obx(() {
          if (vm.state.value == ViewState.loading) {
            return const Center(
                child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (vm.state.value == ViewState.error) {
            return Center(
              child: Text(
                vm.errorMessage.value ?? 'Error al cargar contactos',
                style: const TextStyle(color: AppColors.primary),
              ),
            );
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
                    'Contactos',
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
                    '${vm.contacts.length} contacto(s) de emergencia',
                    style: const TextStyle(color: AppColors.hint, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 24),
                if (vm.contacts.isEmpty)
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
                              child: const Icon(Icons.people_outline,
                                  color: AppColors.hint, size: 64),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Sin contactos aún',
                              style: TextStyle(
                                  color: AppColors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Agrega contactos de emergencia\npresionando el botón +',
                              textAlign: TextAlign.center,
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
                      padding: const EdgeInsets.only(top: 8, bottom: 100),
                      itemCount: vm.contacts.length,
                      itemBuilder: (context, index) {
                        final contact = vm.contacts[index];
                        return FadeInDown(
                          delay: Duration(milliseconds: 60 * index),
                          duration: const Duration(milliseconds: 450),
                          child: Dismissible(
                          key: Key(contact.id),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.only(right: 20.0),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.delete, color: Colors.white),
                          ),
                          confirmDismiss: (_) async {
                            return await _confirmDelete(context, contact.name);
                          },
                          onDismissed: (_) {
                            final id = contact.id;
                            final name = contact.name;
                            vm.removeContactWithUndo(id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('$name eliminado.'),
                                backgroundColor: AppColors.surface,
                                action: SnackBarAction(
                                  label: 'Deshacer',
                                  textColor: AppColors.white,
                                  onPressed: () {
                                    vm.undoRemove();
                                  },
                                ),
                              ),
                            ).closed.then((reason) {
                              if (reason != SnackBarClosedReason.action) {
                                vm.confirmRemove(id);
                              }
                            });
                          },
                          child: ContactCard(contact: contact),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        }),
      ),
      floatingActionButton: PressableScale(
        scale: 0.88,
        haptic: true,
        child: FloatingActionButton(
          backgroundColor: AppColors.primary,
          onPressed: () => Get.to(() => const AddContactScreen()),
          child: const Icon(Icons.add, color: Colors.white),
        ),
      ),
    );
  }

  Future<bool> _confirmDelete(BuildContext context, String name) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.surface,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Eliminar contacto',
                style: TextStyle(color: AppColors.white)),
            content: Text(
              '¿Deseas eliminar a $name de tus contactos de emergencia?',
              style: const TextStyle(color: AppColors.hint),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                style: TextButton.styleFrom(foregroundColor: AppColors.hint),
                child: const Text('Cancelar'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Eliminar'),
              ),
            ],
          ),
        ) ??
        false;
  }
}
