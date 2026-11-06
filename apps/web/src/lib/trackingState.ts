// Logica pura de la pagina publica (sin React): que pantalla mostrar, con que textos y cada cuanto consultar.
// Copy exacto de 01-UI-SPEC "Pagina publica de seguimiento".
import type { TrackingViewResponse, TrailPoint } from "./api-types";
import { googleMapsUrl } from "./geo";

export type FetchResult =
  | { kind: "ok"; data: TrackingViewResponse }
  | { kind: "notFound" } // 404/410: token inexistente, mal formado o revocado
  | { kind: "serverError" }
  | { kind: "networkError" };

export type TrackingState = {
  data: TrackingViewResponse | null;
  skewMs: number; // serverNow - reloj del cliente al recibir; la antiguedad no depende del reloj del celular
  notFound: boolean;
  failures: number; // fallos seguidos
};

export const initialState: TrackingState = { data: null, skewMs: 0, notFound: false, failures: 0 };

export type Screen =
  | "cargando"
  | "activa"
  | "pendiente"
  | "finalizada"
  | "finalizadaSinDatos"
  | "noDisponible"
  | "errorInicial";

export type ViewModel = {
  screen: Screen;
  title: string;
  pill: { text: string; tone: "red" | "amber" | "green"; pulse: boolean } | null;
  banner: { text: string; tone: "default" | "green" } | null;
  offline: boolean;
  personName: string | null;
  location: { lat: number; lon: number; accuracyM: number | null; live: boolean } | null;
  trail: TrailPoint[];
  noLocationText: string | null;
  ageText: string | null;
  ageStale: boolean;
  startedText: string | null;
  callPersonHref: string | null;
  show123: boolean;
  mapsUrl: string | null;
  mapsDisabled: boolean;
};

const HOUR_MS = 60 * 60 * 1000;
const STALE_S = 120;

export function applyResult(prev: TrackingState, result: FetchResult, clientNowMs: number): TrackingState {
  switch (result.kind) {
    case "ok":
      return {
        data: result.data,
        skewMs: Date.parse(result.data.serverNow) - clientNowMs,
        notFound: false,
        failures: 0,
      };
    case "notFound":
      return { ...initialState, notFound: true };
    default:
      // Conserva el ultimo dato: su antiguedad real sigue corriendo con el desfase guardado.
      return { ...prev, failures: prev.failures + 1 };
  }
}

export function formatAge(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `hace ${s} s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  return `hace ${Math.floor(s / 3600)} h`;
}

export function nextDelay(consecutiveFailures: number): number {
  return consecutiveFailures >= 3 ? 15000 : 5000;
}

export function shouldPoll(vm: ViewModel): boolean {
  return vm.screen !== "finalizada" && vm.screen !== "finalizadaSinDatos" && vm.screen !== "noDisponible";
}

const EMPTY: Omit<ViewModel, "screen"> = {
  title: "AlertaYA",
  pill: null,
  banner: null,
  offline: false,
  personName: null,
  location: null,
  trail: [],
  noLocationText: null,
  ageText: null,
  ageStale: false,
  startedText: null,
  callPersonHref: null,
  show123: false,
  mapsUrl: null,
  mapsDisabled: false,
};

export function toViewModel(state: TrackingState, clientNowMs: number): ViewModel {
  if (state.notFound) return { ...EMPTY, screen: "noDisponible", show123: true };

  const data = state.data;
  if (!data) {
    return state.failures > 0
      ? { ...EMPTY, screen: "errorInicial", show123: true }
      : { ...EMPTY, screen: "cargando", banner: { text: "Cargando alerta…", tone: "default" } };
  }

  const serverNowMs = clientNowMs + state.skewMs;
  const secondsSince = (iso: string) => (serverNowMs - Date.parse(iso)) / 1000;
  const name = data.personName;
  const ended = data.status === "finalizada";

  // D-07: pasada 1 h de finalizada no se muestra ningun dato, aunque el servidor aun los enviara.
  if (ended && data.endedAt && serverNowMs - Date.parse(data.endedAt) >= HOUR_MS) {
    return { ...EMPTY, screen: "finalizadaSinDatos", pill: { text: "FINALIZADA", tone: "green", pulse: false } };
  }

  const last = data.lastLocation;
  const screen: Screen = ended ? "finalizada" : last ? "activa" : "pendiente";
  const pendingText = `Ubicación pendiente. ${name} aún no tiene señal GPS. Seguimos esperando.`;

  let ageText: string | null = null;
  let ageStale = false;
  if (last) {
    const age = secondsSince(last.recordedAt);
    ageStale = !ended && age > STALE_S;
    ageText =
      `Última ubicación ${formatAge(age)}` +
      (last.accuracyM != null ? ` · precisión ±${Math.round(last.accuracyM)} m` : "") +
      (ageStale ? " — sin actualizar" : "");
  }

  const phone = data.personPhone?.replace(/[^\d+]/g, "");

  return {
    screen,
    title: `AlertaYA — Alerta de ${name}`,
    pill:
      screen === "activa"
        ? { text: "ACTIVA", tone: "red", pulse: true }
        : screen === "pendiente"
          ? { text: "UBICACIÓN PENDIENTE", tone: "amber", pulse: false }
          : { text: "FINALIZADA", tone: "green", pulse: false },
    banner:
      screen === "activa"
        ? { text: `${name} activó una alerta de emergencia.`, tone: "default" }
        : screen === "pendiente"
          ? { text: pendingText, tone: "default" }
          : { text: `${name} indicó que está a salvo. La alerta terminó.`, tone: "green" },
    offline: state.failures > 0,
    personName: name,
    location: last ? { lat: last.lat, lon: last.lon, accuracyM: last.accuracyM, live: !ended } : null,
    trail: last ? data.trail : [],
    noLocationText: last ? null : ended ? "No se registró ninguna ubicación durante la alerta." : pendingText,
    ageText,
    ageStale,
    startedText: `Alerta iniciada ${formatAge(secondsSince(data.startedAt))}`,
    callPersonHref: phone ? `tel:${phone}` : null,
    show123: !ended,
    mapsUrl: last ? googleMapsUrl(last.lat, last.lon) : null,
    mapsDisabled: !last,
  };
}
