import 'dart:async';
import 'package:get/get.dart';
import '../../core/domain/entities/alert_event.dart';
import '../../core/domain/use_cases/activate_sos_alert_use_case.dart';
import '../../core/domain/use_cases/update_alert_use_case.dart';

enum SosState { idle, activating, active, cancelled }

class HomeViewModel extends GetxController {
  final ActivateSosAlertUseCase _activateSosUseCase;
  final UpdateAlertUseCase _updateAlertUseCase;

  final sosState = SosState.idle.obs;
  final Rxn<AlertEvent> activeAlert = Rxn<AlertEvent>();
  final RxnString errorMessage = RxnString();
  final elapsedSeconds = 0.obs;

  Timer? _timer;

  HomeViewModel({
    required ActivateSosAlertUseCase activateSosUseCase,
    required UpdateAlertUseCase updateAlertUseCase,
  })  : _activateSosUseCase = activateSosUseCase,
        _updateAlertUseCase = updateAlertUseCase;

  Future<void> activateSos(String userId) async {
    sosState.value = SosState.activating;
    try {
      final alert = await _activateSosUseCase.execute(userId);
      activeAlert.value = alert;
      sosState.value = SosState.active;
      elapsedSeconds.value = 0;
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        elapsedSeconds.value++;
      });
    } catch (e) {
      errorMessage.value = e.toString();
      sosState.value = SosState.idle;
    }
  }

  Future<void> cancelAlert() async {
    _timer?.cancel();
    final alert = activeAlert.value;
    if (alert != null) {
      try {
        await _updateAlertUseCase.execute(
          alert.userId,
          alert.id,
          AlertStatus.cancelled,
          durationSeconds: elapsedSeconds.value,
        );
      } catch (_) {}
    }
    sosState.value = SosState.cancelled;
    activeAlert.value = null;
    elapsedSeconds.value = 0;
  }

  @override
  void onClose() {
    _timer?.cancel();
    super.onClose();
  }
}
