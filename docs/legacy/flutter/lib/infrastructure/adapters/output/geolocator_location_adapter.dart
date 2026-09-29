import 'package:geolocator/geolocator.dart';
import '../../../core/domain/services/location_service.dart';

class GeolocatorLocationAdapter implements LocationService {
  @override
  Future<({double lat, double lng})> getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return (lat: 4.7110, lng: -74.0721);
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return (lat: 4.7110, lng: -74.0721);
      }
    }
    if (permission == LocationPermission.deniedForever) {
      return (lat: 4.7110, lng: -74.0721);
    }

    final pos = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
    return (lat: pos.latitude, lng: pos.longitude);
  }

  @override
  Stream<({double lat, double lng})> trackLocation() {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).map((pos) => (lat: pos.latitude, lng: pos.longitude));
  }
}
