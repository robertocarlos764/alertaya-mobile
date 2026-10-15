// Store local del modo demo (L1): sin backend. Persiste en SecureStore (Keystore de Android) y, en web,
// en localStorage (el módulo web de expo-secure-store es un objeto vacío y toda llamada lanza).
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { uuidV4 } from '@/data/logic';
import {
  appendTrail,
  DEFAULT_SETTINGS,
  deliveryRows,
  sanitizeSettings,
  type DeliveryState,
  type Settings,
} from '@/demo/logic';

export type { Settings };
export type Session = { nombre: string; correo: string; telefono: string };
export type Contact = { id: string; nombre: string; telefono: string; relacion?: string };
export type Fix = { lat: number; lon: number; accuracy: number | null; at: number };
export type ActiveAlert = {
  id: string;
  /** Clave de idempotencia generada antes de cualquier red (SOS-03). */
  clientGeneratedId: string;
  createdAt: number;
  /** Hora en que el "servidor" simulado confirmó la alerta; null = solo guardada en el teléfono. */
  syncedAt: number | null;
  estado: 'activa' | 'finalizada';
  finalizadaEn: number | null;
  location: Fix | null;
  contactIds: string[];
  trail?: Fix[];
};
// Snapshot al finalizar: lo que se vio en pantalla en ese momento (estados simulados, modo demo).
export type HistoryItem = {
  id: string;
  createdAt: number;
  endedAt: number;
  trigger: 'boton';
  trail: Fix[];
  contactos: { nombre: string; telefono: string; estado: DeliveryState }[];
};

// Los estados de entrega de la alerta ACTIVA no se guardan: se derivan con simulatedStatus
// (contactIds congela quiénes reciben). El historial sí guarda el snapshot final.
const KEY_SESSION = 'demo.session';
const KEY_CONTACTS = 'demo.contacts';
const KEY_ALERT = 'demo.alert';
const KEY_SETTINGS = 'demo.settings';
const KEY_HISTORY = 'demo.history';
const KEY_ONBOARDED = 'demo.onboarded';
const KEYS = [KEY_SESSION, KEY_CONTACTS, KEY_ALERT, KEY_SETTINGS, KEY_HISTORY, KEY_ONBOARDED];

type DemoValue = {
  hydrated: boolean;
  /** false = sin red (web: navigator.onLine); null = no se sabe (Android sin NetInfo). */
  online: boolean | null;
  session: Session | null;
  contacts: Contact[];
  activeAlert: ActiveAlert | null;
  settings: Settings;
  history: HistoryItem[];
  onboarded: boolean;
  register: (s: Session) => void;
  login: (correo: string) => void;
  logout: () => void;
  addContact: (c: Omit<Contact, 'id'>) => Contact;
  updateContact: (c: Contact) => void;
  removeContact: (id: string) => void;
  startAlert: (location: Fix | null) => void;
  setAlertLocation: (fix: Fix) => void;
  /** Pasa la alerta a finalizada (la pantalla final sigue hasta dismissAlert) y guarda el historial. */
  finishAlert: () => void;
  dismissAlert: () => void;
  updateSettings: (parcial: Partial<Settings>) => void;
  finishOnboarding: () => void;
  /** Borra todo lo del demo (sesión, contactos, historial, ajustes y bienvenida) para ensayar desde cero. */
  resetDemo: () => void;
};

const DemoContext = createContext<DemoValue | null>(null);

// ponytail: en web los datos del demo quedan en texto plano en el navegador del presentador; el producto
// real usa Supabase/Keystore.
const esWeb = Platform.OS === 'web';

async function leer<T>(key: string): Promise<T | null> {
  try {
    const raw = esWeb ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
    return raw ? (JSON.parse(raw) as T) : null; // dato corrupto -> null
  } catch {
    return null;
  }
}

function guardar(key: string, value: unknown) {
  try {
    if (esWeb) {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    const op = value == null ? SecureStore.deleteItemAsync(key) : SecureStore.setItemAsync(key, JSON.stringify(value));
    op.catch(() => {}); // demo: si falla la escritura, el estado en memoria sigue vigente
  } catch {
    // demo: sin almacenamiento disponible, el estado en memoria sigue vigente
  }
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Alerta guardada por una versión anterior del demo (sin clientGeneratedId): se toma como ya confirmada. */
function normalizarAlerta(a: Partial<ActiveAlert> | null): ActiveAlert | null {
  if (!a || typeof a.id !== 'string' || typeof a.createdAt !== 'number' || !Array.isArray(a.contactIds)) return null;
  return {
    id: a.id,
    clientGeneratedId: a.clientGeneratedId ?? a.id,
    createdAt: a.createdAt,
    syncedAt: a.syncedAt === undefined ? a.createdAt : a.syncedAt,
    estado: a.estado === 'finalizada' ? 'finalizada' : 'activa',
    finalizadaEn: a.finalizadaEn ?? null,
    location: a.location ?? null,
    contactIds: a.contactIds,
    trail: a.trail ?? [],
  };
}

const enLinea = () =>
  typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : null;

export function DemoProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  // ponytail: SecureStore ~2 KB por valor ≈ 15 contactos; pasar a expo-sqlite/archivo si se necesita más.
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  // ponytail: máximo 10 alertas en el historial (SecureStore ~2 KB por valor); sqlite si se necesita más.
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [online, setOnline] = useState<boolean | null>(() => (esWeb ? enLinea() : null));

  // ponytail: solo web sabe si hay red (navigator.onLine); Android necesita @react-native-community/netinfo (01-13).
  useEffect(() => {
    if (!esWeb || typeof window === 'undefined') return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      leer<Session>(KEY_SESSION),
      leer<Contact[]>(KEY_CONTACTS),
      leer<Partial<ActiveAlert>>(KEY_ALERT),
      leer<unknown>(KEY_SETTINGS),
      leer<HistoryItem[]>(KEY_HISTORY),
      leer<boolean>(KEY_ONBOARDED),
    ]).then(([s, c, a, st, h, o]) => {
      setSession(s);
      setContacts(Array.isArray(c) ? c : []);
      setActiveAlert(normalizarAlerta(a));
      setSettings(sanitizeSettings(st));
      setHistory(Array.isArray(h) ? h : []);
      setOnboarded(o === true);
      setHydrated(true);
    });
  }, []);

  const putSession = useCallback((s: Session | null) => {
    setSession(s);
    guardar(KEY_SESSION, s);
  }, []);

  const putContacts = useCallback((c: Contact[]) => {
    setContacts(c);
    guardar(KEY_CONTACTS, c);
  }, []);

  const putAlert = useCallback((a: ActiveAlert | null) => {
    setActiveAlert(a);
    guardar(KEY_ALERT, a);
  }, []);

  const putSettings = useCallback((s: Settings) => {
    setSettings(s);
    guardar(KEY_SETTINGS, s);
  }, []);

  const putHistory = useCallback((h: HistoryItem[]) => {
    setHistory(h);
    guardar(KEY_HISTORY, h);
  }, []);

  // "Servidor" SIMULADO (modo demo): confirma la alerta 1 s después de que haya red. Hasta entonces la
  // alerta solo existe en el teléfono y todos los contactos siguen "En cola · Esperando red" (SOS-03).
  // 01-13 lo reemplaza por POST /api/alerts con el mismo clientGeneratedId.
  useEffect(() => {
    if (!activeAlert || activeAlert.estado !== 'activa' || activeAlert.syncedAt != null || online === false) return;
    const t = setTimeout(() => putAlert({ ...activeAlert, syncedAt: Date.now() }), 1000);
    return () => clearTimeout(t);
  }, [activeAlert, online, putAlert]);

  const value = useMemo<DemoValue>(
    () => ({
      hydrated,
      online,
      session,
      contacts,
      activeAlert,
      settings,
      history,
      onboarded,
      register: (s) => putSession(s),
      // Modo demo: acepta cualquier correo válido y contraseña de 6+; la contraseña nunca llega aquí.
      login: (correo) => putSession({ nombre: capitalizar(correo.split('@')[0]), correo, telefono: '' }),
      logout: () => putSession(null),
      addContact: (c) => {
        const nuevo = { ...c, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
        putContacts([...contacts, nuevo]);
        return nuevo;
      },
      updateContact: (c) => putContacts(contacts.map((x) => (x.id === c.id ? c : x))),
      removeContact: (id) => putContacts(contacts.filter((x) => x.id !== id)),
      startAlert: (location) => {
        if (contacts.length === 0) return; // nunca una alerta sin destinatarios
        const ahora = Date.now();
        // Se guarda en el teléfono ANTES de cualquier red (SOS-03).
        putAlert({
          id: ahora.toString(36),
          clientGeneratedId: uuidV4(),
          createdAt: ahora,
          syncedAt: null,
          estado: 'activa',
          finalizadaEn: null,
          location,
          contactIds: contacts.map((c) => c.id),
          trail: location ? [location] : [],
        });
      },
      setAlertLocation: (fix) => {
        // Mismo fix = sin cambios (evita bucles con efectos que dependen de esta acción).
        if (activeAlert && activeAlert.estado === 'activa' && activeAlert.location?.at !== fix.at) {
          putAlert({ ...activeAlert, location: fix, trail: appendTrail(activeAlert.trail ?? [], fix) });
        }
      },
      finishAlert: () => {
        if (activeAlert && activeAlert.estado === 'activa') {
          const endedAt = Date.now();
          const destinatarios = activeAlert.contactIds
            .map((id) => contacts.find((c) => c.id === id))
            .filter((c) => c !== undefined);
          putHistory(
            [
              {
                id: activeAlert.id,
                createdAt: activeAlert.createdAt,
                endedAt,
                trigger: 'boton' as const,
                trail: activeAlert.trail ?? [],
                contactos: deliveryRows(
                  destinatarios,
                  activeAlert.syncedAt == null ? 0 : endedAt - activeAlert.syncedAt,
                ).map((c) => ({
                  nombre: c.nombre,
                  telefono: c.telefono,
                  estado: c.estado,
                })),
              },
              ...history,
            ].slice(0, 10),
          );
          putAlert({ ...activeAlert, estado: 'finalizada', finalizadaEn: endedAt });
        }
      },
      dismissAlert: () => putAlert(null),
      updateSettings: (parcial) => putSettings(sanitizeSettings({ ...settings, ...parcial })),
      finishOnboarding: () => {
        setOnboarded(true);
        guardar(KEY_ONBOARDED, true);
      },
      resetDemo: () => {
        KEYS.forEach((k) => guardar(k, null));
        setSession(null);
        setContacts([]);
        setActiveAlert(null);
        setSettings(DEFAULT_SETTINGS);
        setHistory([]);
        setOnboarded(false);
      },
    }),
    [hydrated, online, session, contacts, activeAlert, settings, history, onboarded, putSession, putContacts, putAlert, putSettings, putHistory],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo debe usarse dentro de <DemoProvider>.');
  return ctx;
}
