abstract class LocationService {
  Future<({double lat, double lng})> getCurrentLocation();
  Stream<({double lat, double lng})> trackLocation();
}
