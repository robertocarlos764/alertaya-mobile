import '../entities/contact.dart';

abstract class ContactRepository {
  Future<List<Contact>> getAllContacts();
  Future<void> addContact(Contact contact);
  Future<void> removeContact(String id);
}
