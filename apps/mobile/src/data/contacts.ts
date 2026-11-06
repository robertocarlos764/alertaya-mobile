// Puerto de contactos de emergencia. 01-12 lo implementa con /api/emergency-contacts.
// Los comandos rechazan con un Error cuyo `message` ya es el copy de UI-SPEC (p. ej. 409 duplicate_contact).
export type Contact = { id: string; nombre: string; telefono: string; relacion?: string };
export type ContactInput = Omit<Contact, 'id'>;

export type ContactList =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: Contact[] };

export interface ContactsRepository {
  list: ContactList;
  reload(): void;
  create(input: ContactInput): Promise<Contact>;
  update(contact: Contact): Promise<void>;
  remove(id: string): Promise<void>;
}
