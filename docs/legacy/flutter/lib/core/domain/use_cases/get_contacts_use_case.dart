import '../entities/contact.dart';
import '../repositories/contact_repository.dart';

class GetContactsUseCase {
  final ContactRepository contactRepo;
  GetContactsUseCase({required this.contactRepo});
  Future<List<Contact>> execute() => contactRepo.getAllContacts();
}
