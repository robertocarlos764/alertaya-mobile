import '../../core/domain/entities/contact.dart';
import '../../core/domain/repositories/contact_repository.dart';
import '../datasources/asset_contact_datasource.dart';

class ContactRepositoryImpl implements ContactRepository {
  final AssetContactDatasource datasource;
  final List<Contact> _cachedContacts = [];
  ContactRepositoryImpl({required this.datasource});

  @override
  Future<List<Contact>> getAllContacts() async {
    if (_cachedContacts.isEmpty) {
      final contacts = await datasource.getContacts();
      _cachedContacts.addAll(contacts);
    }
    return _cachedContacts;
  }

  @override
  Future<void> addContact(Contact contact) async => _cachedContacts.add(contact);

  @override
  Future<void> removeContact(String id) async => _cachedContacts.removeWhere((c) => c.id == id);
}
