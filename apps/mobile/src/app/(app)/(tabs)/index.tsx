import { Button, Header, Screen } from '@/components/ui';
import { useDemo } from '@/demo/store';

// La Tarea 3 agrega aquí el botón SOS y la card de ubicación.
export default function Inicio() {
  const { logout } = useDemo();
  return (
    <Screen edges={[]}>
      <Header />
      <Button title="Cerrar sesión" variant="ghost" onPress={logout} />
    </Screen>
  );
}
