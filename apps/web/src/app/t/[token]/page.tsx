import { Suspense } from "react";
import TrackingView, { LoadingScreen } from "./TrackingView";

// Con cacheComponents el token es dato de ejecucion: el shell "Cargando alerta…" se prerenderiza y la vista llega despues.
export default function Page({ params }: PageProps<"/t/[token]">) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {params.then(({ token }) => (
        <TrackingView token={token} />
      ))}
    </Suspense>
  );
}
