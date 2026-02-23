import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoalsStore } from "../store/useGoalsStore";

/**
 * =========================================================
 * ONBOARDING (UI SIMPLE)
 * ---------------------------------------------------------
 * Responsabilidad ÚNICA:
 *  - marcar onboarding como completado
 *  - redirigir al usuario a (tabs)
 *
 * NO contiene:
 *  - lógica de metas
 *  - cálculos
 *  - estado complejo
 * =========================================================
 */

export default function OnboardingScreen() {
  /**
   * SOLO acciones del store
   */
  const completeOnboarding = useGoalsStore((s) => s.completeOnboarding);

  /**
   * Finalizar onboarding
   */
  const handleStart = () => {
    completeOnboarding();

    // reemplaza pantalla (evita volver atrás)
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* ================= TITULO ================= */}
        <Text style={styles.title}>Bienvenido a Ascend 🚀</Text>

        <Text style={styles.subtitle}>
          Convierte tus metas en acciones diarias.
          {"\n"}
          Construye consistencia. Mejora cada día.
        </Text>

        {/* ================= BENEFICIOS ================= */}
        <View style={styles.list}>
          <Feature text="Plan diario automático" />
          <Feature text="Rachas y consistencia" />
          <Feature text="Estadísticas de progreso" />
          <Feature text="Metas claras y medibles" />
        </View>

        {/* ================= CTA ================= */}
        <Pressable style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Comenzar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/**
 * =========================================================
 * FEATURE ITEM (reutilizable)
 * =========================================================
 */

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.bullet}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

/**
 * =========================================================
 * ESTILOS
 * =========================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 24,
    justifyContent: "center",
  },

  content: {
    alignItems: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
  },

  list: {
    alignSelf: "stretch",
    marginBottom: 40,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  bullet: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },

  featureText: {
    color: "white",
    fontSize: 15,
  },

  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
