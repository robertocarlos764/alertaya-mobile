// Fixtures de desarrollo con la forma exacta del contrato de 01-09. Solo se cargan sin NEXT_PUBLIC_API_URL
// y la pagina lo anuncia con la franja "MODO DEMO". Todos los tiempos son relativos al momento de cargar.
import type { TrailPoint, TrackingViewResponse } from "./api-types";
import type { FetchResult } from "./trackingState";

const T0 = Date.now();
const MIN = 60_000;
const STEP_MS = 5_000;
const START = { lat: 4.6486, lon: -74.0573 }; // punto ficticio para el demo, no es un valor por defecto del producto

const isoAt = (ms: number) => new Date(ms).toISOString();

/** Caminata de un punto cada 5 s entre `fromMs` y `toMs` (maximo 500, como el servidor). */
function walk(fromMs: number, toMs: number): TrailPoint[] {
  const points: TrailPoint[] = [];
  for (let i = 0, t = fromMs; t <= toMs && i < 500; i++, t += STEP_MS) {
    points.push({
      lat: START.lat + i * 0.00004,
      lon: START.lon + i * 0.00003 + 0.00002 * Math.sin(i / 3),
      recordedAt: isoAt(t),
    });
  }
  return points;
}

function view(nowMs: number, over: Partial<TrackingViewResponse>, trail: TrailPoint[] = []): TrackingViewResponse {
  const last = trail.at(-1);
  return {
    personName: "María Fernanda Rodríguez",
    personPhone: "+573000000000",
    status: "activa",
    lastLocation: last ? { ...last, accuracyM: 8 + (trail.length % 5) * 4 } : null,
    trail,
    startedAt: isoAt(T0 - 2 * MIN),
    endedAt: null,
    serverNow: isoAt(nowMs),
    ...over,
  };
}

function resolve(token: string, now: number): FetchResult {
  const ok = (data: TrackingViewResponse): FetchResult => ({ kind: "ok", data });
  switch (token) {
    case "demo-activa":
      return ok(view(now, {}, walk(T0 - 2 * MIN, now)));
    case "demo-pendiente":
      return ok(view(now, {}));
    case "demo-sin-actualizar":
      return ok(view(now, { startedAt: isoAt(T0 - 6 * MIN) }, walk(T0 - 6 * MIN, T0 - 3 * MIN)));
    case "demo-finalizada":
      return ok(
        view(now, { status: "finalizada", startedAt: isoAt(T0 - 40 * MIN), endedAt: isoAt(T0 - 10 * MIN) },
          walk(T0 - 40 * MIN, T0 - 10 * MIN)),
      );
    case "demo-finalizada-vieja":
      // Forma que devuelve el servidor pasada 1 h (D-07): sin ubicacion, trayecto ni telefono.
      return ok(
        view(now, { status: "finalizada", personPhone: null, startedAt: isoAt(T0 - 90 * MIN), endedAt: isoAt(T0 - 61 * MIN) }),
      );
    case "demo-sin-red":
      // 20 s con red y 20 s sin red, alternando.
      return Math.floor((now - T0) / 20_000) % 2 === 1
        ? { kind: "networkError" }
        : ok(view(now, {}, walk(T0 - 2 * MIN, now)));
    case "demo-error":
      return { kind: "serverError" };
    case "demo-nombre-largo":
      return ok(view(now, { personName: "María de los Ángeles Castañeda Núñez de Echeverría y Peñaranda" }));
    default:
      return { kind: "notFound" };
  }
}

export async function fixtureResult(token: string, nowMs: number): Promise<FetchResult> {
  await new Promise((r) => setTimeout(r, 300)); // latencia simulada para ver "Cargando alerta…"
  return resolve(token, nowMs);
}
