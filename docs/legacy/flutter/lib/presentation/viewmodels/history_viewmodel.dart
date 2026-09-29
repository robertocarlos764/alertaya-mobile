import 'package:get/get.dart';
import '../../core/domain/entities/alert_event.dart';
import '../../core/domain/use_cases/get_alert_history_use_case.dart';

class HistoryViewModel extends GetxController {
  final GetAlertHistoryUseCase _getHistoryUseCase;

  final alerts = <AlertEvent>[].obs;
  final isLoading = false.obs;
  final RxnString errorMessage = RxnString();

  HistoryViewModel({required GetAlertHistoryUseCase getAlertHistoryUseCase})
      : _getHistoryUseCase = getAlertHistoryUseCase;

  Future<void> loadHistory(String userId) async {
    isLoading.value = true;
    try {
      final result = await _getHistoryUseCase.execute(userId);
      alerts.assignAll(result);
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }
}
