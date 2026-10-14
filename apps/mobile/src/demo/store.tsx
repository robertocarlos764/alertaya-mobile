// Store local del modo demo (L1): sin backend. Persiste en SecureStore (Keystore de Android) y, en web,
// en localStorage (el módulo web de expo-secure-store es un objeto vacío y toda llamada lanza).
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

// Hace las veces de `perfil.ventana_confirmacion_segundos` (D-02: la UI no escribe 5 literal).
export const COUNTDOWN_SECONDS = 5;

export type Session = { nombre: string; correo: string; telefono: string };
export type Contact = { id: string; nombre: string; telefono: string; relacion?: string };
export type Fix = { lat: number; lon: number; accuracy: number | null; at: number };
export type ActiveAlert = { id: string; createdAt: number; location: Fix | null; contactIds: string[] };

// Los estados de entrega NO se guardan: se derivan con simulatedStatus (contactIds congela quiénes reciben).
const KEY_SESSION = 'demo.session';
const KEY_CONTACTS = 'demo.contacts';
const KEY_ALERT = 'demo.alert';

type DemoValue = {
  hydrated: boolean;
  session: Session | null;
  contacts: Contact[];
  activeAlert: ActiveAlert | null;
  register: (s: Session) => void;
  login: (correo: string) => void;
  logout: () => void;
  addContact: (c: Omit<Contact, 'id'>) => void;
  updateContact: (c: Contact) => void;
  removeContact: (id: string) => void;
  startAlert: (location: Fix | null) => void;
  setAlertLocation: (fix: Fix) => void;
  finishAlert: () => void;
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

export function DemoProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  // ponytail: SecureStore ~2 KB por valor ≈ 15 contactos; pasar a expo-sqlite/archivo si se necesita más.
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);

  useEffect(() => {
    Promise.all([
      leer<Session>(KEY_SESSION),
      leer<Contact[]>(KEY_CONTACTS),
      leer<ActiveAlert>(KEY_ALERT),
    ]).then(([s, c, a]) => {
      setSession(s);
      setContacts(Array.isArray(c) ? c : []);
      setActiveAlert(a);
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

  const value = useMemo<DemoValue>(
    () => ({
      hydrated,
      session,
      contacts,
      activeAlert,
      register: (s) => putSession(s),
      // Modo demo: acepta cualquier correo válido y contraseña de 6+; la contraseña nunca llega aquí.
      login: (correo) => putSession({ nombre: capitalizar(correo.split('@')[0]), correo, telefono: '' }),
      logout: () => putSession(null),
      addContact: (c) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        putContacts([...contacts, { ...c, id }]);
      },
      updateContact: (c) => putContacts(contacts.map((x) => (x.id === c.id ? c : x))),
      removeContact: (id) => putContacts(contacts.filter((x) => x.id !== id)),
      startAlert: (location) => {
        if (contacts.length === 0) return; // nunca una alerta sin destinatarios
        putAlert({
          id: Date.now().toString(36),
          createdAt: Date.now(),
          location,
          contactIds: contacts.map((c) => c.id),
        });
      },
      setAlertLocation: (fix) => {
        // Mismo fix = sin cambios (evita bucles con efectos que dependen de esta acción).
        if (activeAlert && activeAlert.location?.at !== fix.at) putAlert({ ...activeAlert, location: fix });
      },
      finishAlert: () => putAlert(null),
    }),
    [hydrated, session, contacts, activeAlert, putSession, putContacts, putAlert],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo debe usarse dentro de <DemoProvider>.');
  return ctx;
}
