import 'package:get/get.dart';
import 'core/domain/use_cases/activate_sos_alert_use_case.dart';
import 'core/domain/use_cases/add_contact_use_case.dart';
import 'core/domain/use_cases/get_alert_history_use_case.dart';
import 'core/domain/use_cases/get_contacts_use_case.dart';
import 'core/domain/use_cases/remove_contact_use_case.dart';
import 'core/domain/use_cases/save_settings_use_case.dart';
import 'core/domain/use_cases/update_alert_use_case.dart';
import 'infrastructure/adapters/output/geolocator_location_adapter.dart';
import 'infrastructure/adapters/output/mock_notification_adapter.dart';
import 'infrastructure/repositories/alert_repository_impl.dart';
import 'infrastructure/repositories/firestore_contact_repository.dart';
import 'infrastructure/repositories/firestore_profile_repository.dart';
import 'infrastructure/repositories/settings_repository_impl.dart';
import 'presentation/viewmodels/contacts_viewmodel.dart';
import 'presentation/viewmodels/history_viewmodel.dart';
import 'presentation/viewmodels/home_viewmodel.dart';
import 'presentation/viewmodels/profile_viewmodel.dart';
import 'presentation/viewmodels/settings_viewmodel.dart';

class InjectionContainer {
  InjectionContainer._();

  static void init(String userId) {
    final contactRepo = FirestoreContactRepository(userId: userId);
    final alertRepo = AlertRepositoryImpl();
    final settingsRepo = SettingsRepositoryImpl();
    final profileRepo = FirestoreProfileRepository();
    final locationAdapter = GeolocatorLocationAdapter();
    final notifAdapter = MockNotificationAdapter();

    final activateSosUC = ActivateSosAlertUseCase(
      contactRepo: contactRepo,
      alertRepo: alertRepo,
      locationService: locationAdapter,
      notificationService: notifAdapter,
    );
    final updateAlertUC = UpdateAlertUseCase(alertRepo: alertRepo);

    Get.put(
      HomeViewModel(
        activateSosUseCase: activateSosUC,
        updateAlertUseCase: updateAlertUC,
      ),
      permanent: true,
    );

    Get.put(
      ContactsViewModel(
        getContactsUseCase: GetContactsUseCase(contactRepo: contactRepo),
        addContactUseCase: AddContactUseCase(contactRepo: contactRepo),
        removeContactUseCase: RemoveContactUseCase(contactRepo: contactRepo),
      ),
      permanent: true,
    );

    Get.put(
      HistoryViewModel(
        getAlertHistoryUseCase: GetAlertHistoryUseCase(alertRepo: alertRepo),
      ),
      permanent: true,
    );

    Get.put(
      SettingsViewModel(
        saveSettingsUseCase: SaveSettingsUseCase(settingsRepo: settingsRepo),
      ),
      permanent: true,
    );

    Get.put(
      ProfileViewModel(profileRepository: profileRepo),
      permanent: true,
    );
  }

  static void reset() {
    Get.delete<HomeViewModel>(force: true);
    Get.delete<ContactsViewModel>(force: true);
    Get.delete<HistoryViewModel>(force: true);
    Get.delete<SettingsViewModel>(force: true);
    Get.delete<ProfileViewModel>(force: true);
  }
}
