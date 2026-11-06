import { useLocalSearchParams } from 'expo-router';

import { ContactForm } from '@/components/ContactForm';

export default function EditarContacto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ContactForm id={id} />;
}
