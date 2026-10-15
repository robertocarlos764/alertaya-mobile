// Adaptador demo: implementa los puertos sobre el store local (src/demo/store.tsx). Sin red ni servidor.
import { useEffect, useState } from 'react';

import { deliveryRows } from '@/demo/logic';
import { DemoProvider, useDemo, type Fix } from '@/demo/store';

import type { Alert, AlertsRepository, ConfirmedLocation } from './alerts';
import type { AuthRepository } from './auth';
import type { ContactsRepository } from './contacts';

export const Provider = DemoProvider;

const toLocation = (f: Fix): ConfirmedLocation => ({
  lat: f.lat,
  lon: f.lon,
  precisionMetros: f.accuracy,
  capturadaEn: f.at,
});

/** Reloj de 1 s solo mientras `activo` (los estados simulados se derivan del tiempo). */
function useNow(activo: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activo]);
  return now;
}

export function useAuth(): AuthRepository {
  const d = useDemo();
  return {
    status: !d.hydrated ? 'loading' : d.session ? 'signedIn' : 'signedOut',
    session: d.session,
    // Modo demo: cualquier correo válido entra; la contraseña nunca se guarda.
    login: async (correo) => d.login(correo.trim()),
    register: async ({ nombre, correo, telefono }) => {
      d.register({ nombre, correo, telefono });
      return { needsEmailConfirmation: false };
    },
    logout: async () => d.logout(),
  };
}

export function useContacts(): ContactsRepository {
  const d = useDemo();
  return {
    list: d.hydrated ? { status: 'ready', items: d.contacts } : { status: 'loading' },
    reload: () => {},
    create: async (input) => d.addContact(input),
    update: async (c) => d.updateContact(c),
    remove: async (id) => d.removeContact(id),
  };
}

export function useAlerts(): AlertsRepository {
  const d = useDemo();
  const a = d.activeAlert;
  const now = useNow(!!a);
  let current: Alert | null = null;
  if (a) {
    const destinatarios = a.contactIds
      .map((id) => d.contacts.find((c) => c.id === id))
      .filter((c) => c !== undefined);
    current = {
      clientGeneratedId: a.id,
      serverId: a.id,
      estado: 'activa',
      creadoEn: a.createdAt,
      finalizadaEn: null,
      trackingUrl: null, // el demo no tiene página pública (01-10)
      ultimaUbicacion: a.location ? toLocation(a.location) : null,
      trail: (a.trail ?? []).map(toLocation),
      contactos: deliveryRows(destinatarios, now - a.createdAt).map((c) => ({
        contactId: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        estado: c.estado,
        intentos: c.estado === 'fallido' ? 3 : 0,
      })),
    };
  }
  return {
    current,
    online: null,
    start: async (location) => d.startAlert(location),
    reportLocation: (fix) => d.setAlertLocation(fix),
    finish: async () => d.finishAlert(),
    dismiss: () => {},
  };
}

/** Lo que en esta fase vive solo en el teléfono: historial (vista previa de Fase 3), ajustes, bienvenida y reinicio. */
export function useLocalExtras() {
  const d = useDemo();
  return {
    history: d.history,
    settings: d.settings,
    updateSettings: d.updateSettings,
    onboarded: d.onboarded,
    finishOnboarding: d.finishOnboarding,
    resetDemo: d.resetDemo,
  };
}
