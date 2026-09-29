import 'package:cloud_firestore/cloud_firestore.dart';
import '../../core/domain/entities/contact.dart';
import '../../core/domain/repositories/contact_repository.dart';

class FirestoreContactRepository implements ContactRepository {
  final _db = FirebaseFirestore.instance;
  final String userId;

  FirestoreContactRepository({required this.userId});

  CollectionReference get _contacts =>
      _db.collection('users').doc(userId).collection('contacts');

  @override
  Future<List<Contact>> getAllContacts() async {
    final snap = await _contacts.orderBy('addedAt', descending: false).get();
    return snap.docs.map((d) {
      final data = d.data() as Map<String, dynamic>;
      return Contact(
        id: d.id,
        name: data['name'] ?? '',
        initials: data['initials'] ?? '',
        phoneNumber: data['phoneNumber'] ?? '',
        colorHex: data['colorHex'] ?? '#E53935',
      );
    }).toList();
  }

  @override
  Future<void> addContact(Contact contact) => _contacts.doc(contact.id).set({
        'name': contact.name,
        'initials': contact.initials,
        'phoneNumber': contact.phoneNumber,
        'colorHex': contact.colorHex,
        'addedAt': FieldValue.serverTimestamp(),
      });

  @override
  Future<void> removeContact(String contactId) =>
      _contacts.doc(contactId).delete();
}
