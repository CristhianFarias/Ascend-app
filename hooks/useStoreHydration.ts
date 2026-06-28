import { useEffect, useState } from "react";
import useGoalsStore from "../store/useGoalsStore";

/**
 * Indica cuándo Zustand terminó de cargar los datos persistidos.
 * Lo usamos antes de decidir rutas para no mandar al usuario al lugar equivocado
 * mientras AsyncStorage todavía está restaurando el estado local.
 */
export function useStoreHydration(): boolean {
  const [hasHydrated, setHasHydrated] = useState(
    useGoalsStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useGoalsStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (useGoalsStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return unsub;
  }, []);

  return hasHydrated;
}
