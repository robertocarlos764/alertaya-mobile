import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { Fix } from '@/demo/store';

export type EstadoUbicacion = 'sin_permiso' | 'denegado' | 'obteniendo' | 'fijada' | 'sin_senal';

const SIN_SENAL_MS = 20_000;

// Ubicación en primer plano. NUNCA devuelve una coordenada por defecto (UBIC-02): sin fix real, fix = null.
export function useLocation() {
  const [permiso, request] = Location.useForegroundPermissions();
  const [fix, setFix] = useState<Fix | null>(null);
  const [sinGps, setSinGps] = useState(false);
  const [lento, setLento] = useState(false);
  const concedido = !!permiso?.granted;

  useEffect(() => {
    if (!concedido) return;
    let cancelado = false;
    let sub: Location.LocationSubscription | null = null;

    const timeout = setTimeout(() => setLento(true), SIN_SENAL_MS);

    (async () => {
      if (!(await Location.hasServicesEnabledAsync())) {
        if (!cancelado) setSinGps(true);
        return;
      }
      const s = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (loc) => {
          if (cancelado) return;
          setSinGps(false);
          setLento(false);
          setFix({
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            accuracy: loc.coords.accuracy == null ? null : Math.round(loc.coords.accuracy),
            at: loc.timestamp,
          });
        },
      );
      // El efecto pudo desmontarse antes de que resolviera la promesa del watch.
      if (cancelado) s.remove();
      else sub = s;
    })();

    return () => {
      cancelado = true;
      clearTimeout(timeout);
      sub?.remove();
    };
  }, [concedido]);

  let state: EstadoUbicacion;
  if (!permiso) state = 'obteniendo';
  else if (permiso.status === Location.PermissionStatus.UNDETERMINED) state = 'sin_permiso';
  else if (!permiso.granted) state = 'denegado';
  else if (fix) state = 'fijada';
  else if (sinGps || lento) state = 'sin_senal';
  else state = 'obteniendo';

  return { state, fix, request };
}
