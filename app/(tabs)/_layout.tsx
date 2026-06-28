// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from "expo-router";
import { Mountain, Target, User } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { useStoreHydration } from "../../hooks/useStoreHydration";
import useGoalsStore from "../../store/useGoalsStore";

export default function TabLayout() {
  const hasHydrated = useStoreHydration();
  const hasFinishedOnboarding = useGoalsStore(
    (s) => s.hasFinishedOnboarding,
  );

  if (!hasHydrated) {
    return <View style={{ flex: 1, backgroundColor: "#020617" }} />;
  }

  if (!hasFinishedOnboarding) {
    // Protege las pantallas principales si el usuario aún no completó la bienvenida.
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#020617", // Slate 950
          borderTopColor: "rgba(148, 163, 184, 0.1)",
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: "#fbbf24",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          title: "Metas",
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="Progreso"
        options={{
          title: "Progreso",
          tabBarIcon: ({ color }) => <Mountain size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
