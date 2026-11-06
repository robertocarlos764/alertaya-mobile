import 'package:firebase_auth/firebase_auth.dart';

class FirebaseAuthAdapter {
  final _auth = FirebaseAuth.instance;

  Future<UserCredential> login(String email, String password) =>
      _auth.signInWithEmailAndPassword(email: email, password: password);

  Future<UserCredential> register(String email, String password) =>
      _auth.createUserWithEmailAndPassword(email: email, password: password);

  Future<void> logout() => _auth.signOut();

  String? get currentUserId => _auth.currentUser?.uid;
  bool get isLoggedIn => _auth.currentUser != null;
}
