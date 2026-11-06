import 'package:get/get.dart';
import '../../core/domain/entities/user_profile.dart';
import '../../core/domain/repositories/profile_repository.dart';

class ProfileViewModel extends GetxController {
  final ProfileRepository _profileRepo;

  final profile = Rxn<UserProfile>();
  final isLoading = false.obs;
  final isSaving = false.obs;
  final RxnString errorMessage = RxnString();

  ProfileViewModel({required ProfileRepository profileRepository})
      : _profileRepo = profileRepository;

  Future<void> loadProfile(String userId) async {
    isLoading.value = true;
    try {
      final result = await _profileRepo.getProfile(userId);
      profile.value = result;
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> saveProfile(String name, String phone) async {
    final current = profile.value;
    if (current == null) return;
    isSaving.value = true;
    try {
      final updated = current.copyWith(name: name, phone: phone);
      await _profileRepo.saveProfile(updated);
      profile.value = updated;
    } catch (e) {
      errorMessage.value = e.toString();
      rethrow;
    } finally {
      isSaving.value = false;
    }
  }

  String get initials => profile.value?.initials ?? '?';
  String get displayName => profile.value?.name ?? '';
}
