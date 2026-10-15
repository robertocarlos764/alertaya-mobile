"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { fetchTracking, usingFixtures } from "@/lib/trackingSource";
import { applyResult, initialState, nextDelay, shouldPoll, toViewModel, type ViewModel } from "@/lib/trackingState";

const TrackingMap = dynamic(() => import("./TrackingMap"), { ssr: false, loading: () => <MapLoading /> });

// Iconos Material (24x24) inline, sin dependencia.
const ICONS = {
  shield: "M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  phone:
    "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  navigation: "M12 2 4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
  locationOff:
    "M12 6.5c1.38 0 2.5 1.12 2.5 2.5 0 .74-.33 1.39-.83 1.85l3.63 3.63c.98-1.86 1.7-3.8 1.7-5.48 0-3.87-3.13-7-7-7-1.98 0-3.76.83-5.04 2.15l3.19 3.19c.46-.52 1.11-.84 1.85-.84zm4.37 9.6-4.63-4.63-.11-.11L3.27 3 2 4.27l3.18 3.18C5.07 7.95 5 8.47 5 9c0 5.25 7 13 7 13s1.67-1.85 3.38-4.35L18.73 21 20 19.73l-3.63-3.63z",
  linkOff:
    "M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z",
  checkCircle:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
};

function Icon({ name, size = 24, color }: { name: keyof typeof ICONS; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color ?? "currentColor"} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function TopBar({ pill }: { pill: ViewModel["pill"] }) {
  return (
    <>
      {usingFixtures && <div className="demo-strip">MODO DEMO · datos de prueba</div>}
      <header className="topbar">
        <span className="brand">
          <Icon name="shield" color="var(--accent)" />
          AlertaYA
        </span>
        {pill && (
          <span className={`pill pill-${pill.tone}`}>
            {pill.pulse && <span className="dot dot-pulse" />}
            {pill.text}
          </span>
        )}
      </header>
    </>
  );
}

function MapLoading() {
  return <div className="map-placeholder map-loading">Cargando mapa…</div>;
}

/** Shell del primer render (tambien es el fallback del Suspense de la pagina). */
export function LoadingScreen() {
  return (
    <div className="page">
      <TopBar pill={null} />
      <div className="banner" aria-live="polite">
        Cargando alerta…
      </div>
      <div className="map-area">
        <MapLoading />
      </div>
    </div>
  );
}

const call123 = (
  <a className="btn btn-outline" href="tel:123">
    <Icon name="phone" />
    Llamar al 123
  </a>
);

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="centered">{children}</main>;
}

export default function TrackingView({ token }: { token: string }) {
  const [state, setState] = useState(initialState);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const result = await fetchTracking(token);
    const at = Date.now();
    setState((prev) => applyResult(prev, result, at));
    setNow(at);
  }, [token]);

  const vm = toViewModel(state, now);
  const waitingFirst = vm.screen === "cargando";
  const polling = shouldPoll(vm);

  // Primer fetch inmediato; luego cada 5 s (15 s tras 3 fallos) solo con la pestana visible y fetch inmediato al volver.
  useEffect(() => {
    if (!polling) return;
    const timer = setTimeout(
      () => {
        if (waitingFirst || !document.hidden) void load();
      },
      waitingFirst ? 0 : nextDelay(state.failures),
    );
    const onVisible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [state, waitingFirst, polling, load]);

  // Reloj de 1 s para la antiguedad en vivo.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = vm.title;
  }, [vm.title]);

  if (waitingFirst) return <LoadingScreen />;

  return (
    <div className="page">
      <TopBar pill={vm.pill} />
      {vm.offline && (
        <div className="offline-bar" role="status">
          Sin conexión. Reintentando…
        </div>
      )}
      <Screen vm={vm} onRetry={() => void load()} />
    </div>
  );
}

function Screen({ vm, onRetry }: { vm: ViewModel; onRetry: () => void }) {
  switch (vm.screen) {
    case "noDisponible":
      return (
        <Centered>
          <Icon name="linkOff" size={48} color="var(--text-2)" />
          <h1 className="heading">Este enlace ya no está disponible</h1>
          <p>Si estás intentando ayudar a alguien, llama al 123.</p>
          <div className="actions">{call123}</div>
        </Centered>
      );
    case "errorInicial":
      return (
        <Centered>
          <h1 className="heading">No pudimos cargar la alerta.</h1>
          <div className="actions">
            <button type="button" className="btn btn-outline" onClick={onRetry}>
              Reintentar
            </button>
            {call123}
          </div>
        </Centered>
      );
    case "finalizadaSinDatos":
      return (
        <Centered>
          <Icon name="checkCircle" size={48} color="var(--success)" />
          <h1 className="heading">Alerta finalizada</h1>
          <p className="muted">Por privacidad, ya no se muestra la ubicación.</p>
        </Centered>
      );
    default:
      return <AlertScreen vm={vm} />;
  }
}

function AlertScreen({ vm }: { vm: ViewModel }) {
  return (
    <>
      <div className={`banner${vm.banner?.tone === "green" ? " banner-green" : ""}`} aria-live="polite">
        {vm.banner?.text}
      </div>

      <div className="map-area">
        {vm.location ? (
          <TrackingMap name={vm.personName ?? ""} location={vm.location} trail={vm.trail} />
        ) : (
          <div className="map-placeholder">
            <Icon name="locationOff" size={48} color="var(--warning)" />
            <p>{vm.noLocationText}</p>
          </div>
        )}
      </div>

      <section className="sheet">
        <h1 className="heading">{vm.personName}</h1>
        {vm.ageText && <p className={`tabular ${vm.ageStale ? "warn" : "muted"}`}>{vm.ageText}</p>}
        <p className="meta tabular">{vm.startedText}</p>

        <div className="actions">
          {vm.callPersonHref && (
            <a className="btn btn-primary" href={vm.callPersonHref}>
              <Icon name="phone" />
              Llamar a {vm.personName}
            </a>
          )}
          {vm.show123 && call123}
          {vm.mapsUrl ? (
            <a className="btn btn-outline" href={vm.mapsUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="navigation" />
              Abrir en Google Maps
            </a>
          ) : (
            vm.mapsDisabled && (
              <>
                <span className="btn btn-outline" role="link" aria-disabled="true">
                  <Icon name="navigation" />
                  Abrir en Google Maps
                </span>
                <p className="meta">Disponible cuando haya ubicación.</p>
              </>
            )
          )}
        </div>
      </section>

      <footer className="footer">
        Este enlace deja de mostrar la ubicación 1 hora después de que termine la alerta.
      </footer>
    </>
  );
}
