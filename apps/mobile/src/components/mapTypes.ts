// Contrato único del mapa (LiveMap.tsx nativo / LiveMap.web.tsx). OpenFreeMap dark: gratis y sin API key (UI-SPEC).
import { boundsOf, precisionCircle } from '@/data/geo';

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

export type LiveMapProps = {
  /** Último punto real (nunca uno por defecto): pin, y círculo de precisión si hay precisionMetros. */
  point: { lat: number; lon: number; precisionMetros: number | null };
  /** Trayecto desde el inicio; con 2 o más puntos se dibuja la línea y el marcador blanco de inicio. */
  trail?: { lat: number; lon: number }[];
  /** En vivo: pulso tipo radar y la cámara sigue cada punto nuevo. Sin `live` la cámara encuadra el trayecto. */
  live?: boolean;
  height: number;
  /** Gestos de mover/zoom. El mini mapa de la alerta no es interactivo (UI-SPEC). */
  interactive?: boolean;
  /** Etiqueta accesible: "Mapa con tu ubicación". */
  label: string;
};

/** Capas GeoJSON compartidas por web y nativo: trayecto y círculo de precisión real. */
export function mapFeatures({ point, trail = [] }: Pick<LiveMapProps, 'point' | 'trail'>) {
  return {
    trail: {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: trail.map((p) => [p.lon, p.lat]) },
    },
    precision: {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: point.precisionMetros ? [precisionCircle(point.lat, point.lon, point.precisionMetros)] : [],
      },
    },
  };
}

/** Encuadre: en vivo (o sin trayecto) centrado en el punto; si no, la caja del trayecto completo. */
export function mapFraming({ point, trail = [], live }: Pick<LiveMapProps, 'point' | 'trail' | 'live'>) {
  return !live && trail.length > 1
    ? ({ kind: 'bounds', bounds: boundsOf([...trail, point]) } as const)
    : ({ kind: 'center', center: [point.lon, point.lat] as [number, number], zoom: 16 } as const);
}
