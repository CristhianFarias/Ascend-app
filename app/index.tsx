import { Redirect } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useStoreHydration } from "../hooks/useStoreHydration";
import useGoalsStore from "../store/useGoalsStore";

/**
 * Ruta de entrada de la app.
 * Después de hidratar el store local, decide si el usuario debe ver
 * onboarding o entrar directamente a las tabs principales.
 */
export default function AppEntry(): React.ReactElement {
  const hasHydrated = useStoreHydration();
  const hasFinishedOnboarding = useGoalsStore(
    (s) => s.hasFinishedOnboarding,
  );

  if (!hasHydrated) {
    return <View style={{ flex: 1, backgroundColor: "#020617" }} />;
  }

  return (
    <Redirect href={hasFinishedOnboarding ? "/(tabs)" : "/onboarding"} />
  );
}
