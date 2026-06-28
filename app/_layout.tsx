// app/_layout.tsx
import "react-native-reanimated";

import { ThemeProvider } from "@react-navigation/native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { useResolvedTheme } from "../hooks/use-resolved-theme";

/**
 * Root layout mínimo y seguro para expo-router.
 * Solo monta proveedores globales y el Slot principal.
 * Las redirecciones viven en rutas normales para no navegar antes de que
 * expo-router termine de crear el NavigationContext.
 */
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout(): React.ReactElement {
  const { navTheme, resolvedMode } = useResolvedTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          {/* 
            Slot renderiza children/layouts definidos en la carpeta app/.
            Deja que los archivos en app/(tabs)/_layout.tsx u otros creen
            sus propios Stacks/Tabs, evitando así problemas de contexto.
          */}
          <Slot />
          <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
