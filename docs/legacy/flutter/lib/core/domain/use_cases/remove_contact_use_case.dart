import '../repositories/contact_repository.dart';

class RemoveContactUseCase {
  final ContactRepository contactRepo;

  RemoveContactUseCase({required this.contactRepo});

  Future<void> execute(String id) => contactRepo.removeContact(id);
}
