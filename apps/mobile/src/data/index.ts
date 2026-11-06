// Único punto que elige el adaptador de datos. 01-11..01-15 agregan el adaptador real (Supabase + API)
// como otro archivo con los mismos hooks y lo eligen aquí; las pantallas no cambian.
import * as adapter from './demo';

export type { AuthRepository, AuthStatus, Session } from './auth';
export type { Contact, ContactInput, ContactList, ContactsRepository } from './contacts';
export type {
  Alert,
  AlertEstado,
  AlertsRepository,
  ConfirmedLocation,
  Delivery,
  DeliveryEstado,
  GeoFix,
} from './alerts';

/** Mientras sea true la franja MODO DEMO se muestra en todas las pantallas (Core Value). */
export const IS_DEMO = true;

export const DataProvider = adapter.Provider;
export const useAuth = adapter.useAuth;
export const useContacts = adapter.useContacts;
export const useAlerts = adapter.useAlerts;
export const useLocalExtras = adapter.useLocalExtras;
