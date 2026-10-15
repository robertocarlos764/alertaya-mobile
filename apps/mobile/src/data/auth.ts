// Puerto de autenticación. 01-11 lo implementa con Supabase Auth (signUp con options.data, D-20).
// Los comandos rechazan con un Error cuyo `message` ya es el copy de UI-SPEC para mostrar tal cual.
export type Session = { nombre: string; correo: string; telefono: string };

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

export type RegisterInput = { nombre: string; correo: string; telefono: string; password: string };

export interface AuthRepository {
  /** 'loading' mientras se resuelve la sesión guardada: splash, nunca un parpadeo de login (AUTH-02). */
  status: AuthStatus;
  session: Session | null;
  login(correo: string, password: string): Promise<void>;
  /** needsEmailConfirmation: signUp sin sesión ("Confirm email" activo) -> pantalla "Revisa tu correo". */
  register(input: RegisterInput): Promise<{ needsEmailConfirmation: boolean }>;
  logout(): Promise<void>;
}
