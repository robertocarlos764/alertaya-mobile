import '../../../core/domain/services/location_service.dart';

class MockLocationAdapter implements LocationService {
  @override
  Future<({double lat, double lng})> getCurrentLocation() async => (lat: 4.7110, lng: -74.0721);

  @override
  Stream<({double lat, double lng})> trackLocation() async* {
    while (true) {
      await Future.delayed(const Duration(seconds: 30));
      yield (lat: 4.7110, lng: -74.0721);
    }
  }
}
