import '../entities/contact.dart';
import '../repositories/contact_repository.dart';

class AddContactUseCase {
  final ContactRepository _contactRepo;

  AddContactUseCase({required ContactRepository contactRepo})
      : _contactRepo = contactRepo;

  Future<void> execute(Contact contact) => _contactRepo.addContact(contact);
}
