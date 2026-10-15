// Nombre del lugar (geocodificación inversa). Nativo: expo-location. Web: Nominatim de OpenStreetMap.
// Política de Nominatim: una consulta solo por cambio significativo (shouldRegeocode: > 100 m o > 2 min),
// caché en memoria por punto (~11 m), como máximo 1 consulta por segundo y nunca en bucle: un error no se
// reintenta hasta el siguiente cambio significativo. Sin respuesta útil el nombre es null (nunca inventado).
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { expoParts, nominatimParts, placeKey, placeLabel, shouldRegeocode, type PlaceStatus, type TimedPoint } from '@/data/geo';

const cache = new Map<string, string | null>();
const enCurso = new Map<string, Promise<string | null>>();
let ultimaWeb = 0;

async function consultar(p: TimedPoint): Promise<string | null> {
  if (Platform.OS === 'web') {
    const espera = ultimaWeb + 1100 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimaWeb = Date.now();
    // Solo números en la URL: nada inyectable. El navegador agrega el Referer que pide la política.
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat.toFixed(6)}&lon=${p.lon.toFixed(6)}&accept-language=es`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`Nominatim ${r.status}`);
    return placeLabel(nominatimParts(await r.json()));
  }
  const [a] = await Location.reverseGeocodeAsync({ latitude: p.lat, longitude: p.lon });
  return placeLabel(expoParts(a));
}

/** Una sola consulta por punto aunque lo pidan varias pantallas a la vez. Los errores no se guardan en caché. */
function buscar(p: TimedPoint): Promise<string | null> {
  const k = placeKey(p);
  if (cache.has(k)) return Promise.resolve(cache.get(k) ?? null);
  let pr = enCurso.get(k);
  if (!pr) {
    pr = consultar(p)
      .then((nombre) => {
        cache.set(k, nombre);
        return nombre;
      })
      .finally(() => enCurso.delete(k));
    enCurso.set(k, pr);
  }
  return pr;
}

export function usePlaceName(fix: TimedPoint | null): { name: string | null; status: PlaceStatus } {
  const [consulta, setConsulta] = useState<TimedPoint | null>(null);
  const [res, setRes] = useState<{ key: string; name: string | null } | null>(null);

  // Ajuste de estado durante el render (patrón de React): solo cambia con un movimiento significativo.
  if (fix && shouldRegeocode(consulta, fix)) setConsulta({ lat: fix.lat, lon: fix.lon, at: fix.at });

  useEffect(() => {
    if (!consulta) return;
    const key = placeKey(consulta);
    buscar(consulta)
      .then((name) => setRes({ key, name }))
      .catch(() => setRes({ key, name: null }));
  }, [consulta]);

  if (!consulta || res?.key !== placeKey(consulta)) return { name: null, status: 'buscando' };
  return { name: res.name, status: res.name ? 'listo' : 'sin-nombre' };
}
