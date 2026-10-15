import { describe, expect, it } from "vitest";
import type { TrackingViewResponse } from "./api-types";
import {
  applyResult,
  formatAge,
  initialState,
  nextDelay,
  shouldPoll,
  toViewModel,
  type FetchResult,
  type TrackingState,
} from "./trackingState";

const SERVER_NOW = Date.parse("2026-10-15T15:00:00Z");
const iso = (msBeforeServerNow: number) => new Date(SERVER_NOW - msBeforeServerNow).toISOString();

function response(over: Partial<TrackingViewResponse> = {}): TrackingViewResponse {
  return {
    personName: "Ana García",
    personPhone: "+57 300 000 0000",
    status: "activa",
    lastLocation: null,
    trail: [],
    startedAt: iso(5 * 60_000),
    endedAt: null,
    serverNow: new Date(SERVER_NOW).toISOString(),
    ...over,
  };
}

const withLocation = (ageMs: number) =>
  response({
    lastLocation: { lat: 4.65, lon: -74.06, accuracyM: 12.4, recordedAt: iso(ageMs) },
    trail: [
      { lat: 4.649, lon: -74.061, recordedAt: iso(60_000) },
      { lat: 4.65, lon: -74.06, recordedAt: iso(ageMs) },
    ],
  });

/** Aplica un resultado recibido con el reloj del cliente `clientNow` y arma el modelo en `viewAt`. */
function vmFor(result: FetchResult, clientNow = SERVER_NOW, viewAt = clientNow, prev: TrackingState = initialState) {
  return toViewModel(applyResult(prev, result, clientNow), viewAt);
}

describe("toViewModel", () => {
  it("activa sin ubicacion: pendiente, sin mapa ni Google Maps, con botones de llamar", () => {
    const vm = vmFor({ kind: "ok", data: response() });
    expect(vm.screen).toBe("pendiente");
    expect(vm.pill).toEqual({ text: "UBICACIÓN PENDIENTE", tone: "amber", pulse: false });
    expect(vm.banner?.text).toBe("Ubicación pendiente. Ana García aún no tiene señal GPS. Seguimos esperando.");
    expect(vm.location).toBeNull();
    expect(vm.trail).toEqual([]);
    expect(vm.mapsUrl).toBeNull();
    expect(vm.mapsDisabled).toBe(true);
    expect(vm.callPersonHref).toBe("tel:+573000000000");
    expect(vm.show123).toBe(true);
    expect(shouldPoll(vm)).toBe(true);
  });

  it("activa con ubicacion: antiguedad con serverNow aunque el reloj del cliente este corrido", () => {
    // El celular va 10 min adelantado; la ubicacion tiene 45 s segun el servidor.
    const skewedClient = SERVER_NOW + 10 * 60_000;
    const vm = vmFor({ kind: "ok", data: withLocation(45_000) }, skewedClient);
    expect(vm.screen).toBe("activa");
    expect(vm.pill).toEqual({ text: "ACTIVA", tone: "red", pulse: true });
    expect(vm.ageText).toBe("Última ubicación hace 45 s · precisión ±12 m");
    expect(vm.ageStale).toBe(false);
    expect(vm.location).toMatchObject({ lat: 4.65, lon: -74.06, live: true });
    expect(vm.trail).toHaveLength(2);
    expect(vm.mapsUrl).toBe("https://www.google.com/maps/search/?api=1&query=4.65,-74.06");
    expect(vm.title).toBe("AlertaYA — Alerta de Ana García");
  });

  it("la antiguedad avanza con el reloj y pasa a ambar despues de 120 s", () => {
    const at = (s: number) => vmFor({ kind: "ok", data: withLocation(100_000) }, SERVER_NOW, SERVER_NOW + s * 1000);
    expect(at(20).ageStale).toBe(false);
    expect(at(21).ageStale).toBe(true);
    expect(at(21).ageText).toBe("Última ubicación hace 2 min · precisión ±12 m — sin actualizar");
  });

  it("finalizada hace 10 min: ultimo punto sin pulso, sin 123 y sin polling", () => {
    const data = { ...withLocation(11 * 60_000), status: "finalizada" as const, endedAt: iso(10 * 60_000) };
    const vm = vmFor({ kind: "ok", data });
    expect(vm.screen).toBe("finalizada");
    expect(vm.pill).toEqual({ text: "FINALIZADA", tone: "green", pulse: false });
    expect(vm.banner).toEqual({ text: "Ana García indicó que está a salvo. La alerta terminó.", tone: "green" });
    expect(vm.location?.live).toBe(false);
    expect(vm.ageStale).toBe(false);
    expect(vm.show123).toBe(false);
    expect(vm.callPersonHref).not.toBeNull();
    expect(vm.mapsUrl).not.toBeNull();
    expect(shouldPoll(vm)).toBe(false);
  });

  it("finalizada hace 61 min: ningun dato de ubicacion ni botones, aunque el servidor los enviara", () => {
    const data = { ...withLocation(62 * 60_000), status: "finalizada" as const, endedAt: iso(61 * 60_000) };
    const vm = vmFor({ kind: "ok", data });
    expect(vm.screen).toBe("finalizadaSinDatos");
    expect(vm.location).toBeNull();
    expect(vm.trail).toEqual([]);
    expect(vm.ageText).toBeNull();
    expect(vm.mapsUrl).toBeNull();
    expect(vm.callPersonHref).toBeNull();
    expect(vm.show123).toBe(false);
    expect(shouldPoll(vm)).toBe(false);
  });

  it("404: enlace no disponible con 123 y sin polling, aunque hubiera datos", () => {
    const prev = applyResult(initialState, { kind: "ok", data: withLocation(5_000) }, SERVER_NOW);
    const vm = vmFor({ kind: "notFound" }, SERVER_NOW, SERVER_NOW, prev);
    expect(vm.screen).toBe("noDisponible");
    expect(vm.show123).toBe(true);
    expect(vm.location).toBeNull();
    expect(vm.personName).toBeNull();
    expect(shouldPoll(vm)).toBe(false);
  });

  it("primer fetch: cargando; error sin datos previos: errorInicial que sigue reintentando", () => {
    expect(toViewModel(initialState, SERVER_NOW).screen).toBe("cargando");
    for (const kind of ["serverError", "networkError"] as const) {
      const vm = vmFor({ kind });
      expect(vm.screen).toBe("errorInicial");
      expect(vm.show123).toBe(true);
      expect(shouldPoll(vm)).toBe(true);
    }
  });

  it("error de red con datos previos: conserva el dato, su antiguedad real y muestra la barra", () => {
    const prev = applyResult(initialState, { kind: "ok", data: withLocation(5_000) }, SERVER_NOW);
    const state = applyResult(prev, { kind: "networkError" }, SERVER_NOW + 30_000);
    const vm = toViewModel(state, SERVER_NOW + 30_000);
    expect(vm.screen).toBe("activa");
    expect(vm.offline).toBe(true);
    expect(vm.ageText).toBe("Última ubicación hace 35 s · precisión ±12 m");
    expect(state.failures).toBe(1);
    // Al volver la red la barra desaparece y el contador se reinicia.
    const back = applyResult(state, { kind: "ok", data: withLocation(1_000) }, SERVER_NOW + 35_000);
    expect(back.failures).toBe(0);
    expect(toViewModel(back, SERVER_NOW + 35_000).offline).toBe(false);
  });

  it("sin telefono no hay boton de llamar a la persona", () => {
    expect(vmFor({ kind: "ok", data: response({ personPhone: null }) }).callPersonHref).toBeNull();
  });
});

describe("formatAge", () => {
  it("segundos, minutos y horas", () => {
    expect(formatAge(0)).toBe("hace 0 s");
    expect(formatAge(45)).toBe("hace 45 s");
    expect(formatAge(59.9)).toBe("hace 59 s");
    expect(formatAge(130)).toBe("hace 2 min");
    expect(formatAge(7200)).toBe("hace 2 h");
    expect(formatAge(-3)).toBe("hace 0 s");
  });
});

describe("nextDelay", () => {
  it("5 s hasta 2 fallos seguidos y 15 s desde el tercero", () => {
    expect([0, 1, 2, 3, 7].map(nextDelay)).toEqual([5000, 5000, 5000, 15000, 15000]);
  });
});
