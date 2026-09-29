import 'package:cloud_firestore/cloud_firestore.dart';
import '../../core/domain/entities/user_profile.dart';
import '../../core/domain/repositories/profile_repository.dart';

class FirestoreProfileRepository implements ProfileRepository {
  final _db = FirebaseFirestore.instance;

  DocumentReference _doc(String userId) =>
      _db.collection('users').doc(userId).collection('profile').doc('data');

  @override
  Future<UserProfile?> getProfile(String userId) async {
    final snap = await _doc(userId).get();
    if (!snap.exists) return null;
    final data = snap.data() as Map<String, dynamic>;
    return UserProfile(
      userId: userId,
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
    );
  }

  @override
  Future<void> saveProfile(UserProfile profile) => _doc(profile.userId).update({
        'name': profile.name,
        'phone': profile.phone,
        'updatedAt': FieldValue.serverTimestamp(),
      });

  @override
  Future<void> createProfile(UserProfile profile) => _doc(profile.userId).set({
        'name': profile.name,
        'email': profile.email,
        'phone': profile.phone,
        'updatedAt': FieldValue.serverTimestamp(),
      });
}
