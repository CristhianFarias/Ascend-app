// app/_layout.tsx
import "react-native-reanimated";

import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";

/**
 * Root layout mínimo y seguro para expo-router.
 * Evita crear navegadores de nivel superior aquí para no romper el NavigationContext.
 */
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* 
          Slot renderiza children/layouts definidos en la carpeta app/.
          Deja que los archivos en app/(tabs)/_layout.tsx u otros creen
          sus propios Stacks/Tabs, evitando así problemas de contexto.
        */}
        <Slot />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}