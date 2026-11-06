import 'package:get/get.dart';
import '../../core/domain/entities/contact.dart';
import '../../core/domain/use_cases/add_contact_use_case.dart';
import '../../core/domain/use_cases/get_contacts_use_case.dart';
import '../../core/domain/use_cases/remove_contact_use_case.dart';

enum ViewState { idle, loading, loaded, error }

class ContactsViewModel extends GetxController {
  final GetContactsUseCase _getContactsUseCase;
  final AddContactUseCase _addContactUseCase;
  final RemoveContactUseCase _removeContactUseCase;

  final contacts = <Contact>[].obs;
  final state = ViewState.idle.obs;
  final RxnString errorMessage = RxnString();
  final isAdding = false.obs;

  Contact? _removedContact;
  int? _removedIndex;

  ContactsViewModel({
    required GetContactsUseCase getContactsUseCase,
    required AddContactUseCase addContactUseCase,
    required RemoveContactUseCase removeContactUseCase,
  })  : _getContactsUseCase = getContactsUseCase,
        _addContactUseCase = addContactUseCase,
        _removeContactUseCase = removeContactUseCase;

  Future<void> loadContacts() async {
    state.value = ViewState.loading;
    try {
      final result = await _getContactsUseCase.execute();
      contacts.assignAll(result);
      state.value = ViewState.loaded;
    } catch (e) {
      errorMessage.value = e.toString();
      state.value = ViewState.error;
    }
  }

  Future<void> addContact(Contact contact) async {
    isAdding.value = true;
    try {
      await _addContactUseCase.execute(contact);
      contacts.add(contact);
    } catch (e) {
      errorMessage.value = e.toString();
      rethrow;
    } finally {
      isAdding.value = false;
    }
  }

  void removeContactWithUndo(String id) {
    final idx = contacts.indexWhere((c) => c.id == id);
    if (idx == -1) return;
    _removedContact = contacts[idx];
    _removedIndex = idx;
    contacts.removeAt(idx);
  }

  Future<void> confirmRemove(String id) async {
    try {
      await _removeContactUseCase.execute(id);
    } catch (e) {
      errorMessage.value = e.toString();
    }
    _removedContact = null;
    _removedIndex = null;
  }

  void undoRemove() {
    if (_removedContact != null && _removedIndex != null) {
      contacts.insert(_removedIndex!, _removedContact!);
      _removedContact = null;
      _removedIndex = null;
    }
  }
}
