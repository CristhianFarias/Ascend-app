import { Check, CheckCircle2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useGoalsStore } from "../store/useGoalsStore";

type Props = {
  goalId: string;
};

export default function CompleteTodayButton({ goalId }: Props) {
  // Conectamos con el Store
  const areAllStepsCompleted = useGoalsStore((s) => s.areAllStepsCompleted);
  const markGoalCompletedToday = useGoalsStore((s) => s.markGoalCompletedToday);
  const isTodayMarked = useGoalsStore((s) => s.getCompletedGoalsForDate);
  const getTodayKey = () => new Date().toISOString().split("T")[0];

  const canComplete = areAllStepsCompleted(goalId);

  // Verificamos si YA está marcada hoy (para cambiar el estilo visual)
  const completedToday = useGoalsStore((s) => {
    const today = new Date().toISOString().split("T")[0]; // Simple YYYY-MM-DD local approx
    const done = s.dailyCompletionMap[today] || [];
    return done.includes(goalId);
  });

  const handlePress = () => {
    if (canComplete && !completedToday) {
      markGoalCompletedToday(goalId);
    }
  };

  if (completedToday) {
    return (
      <View style={[styles.btn, styles.btnCompleted]}>
        <CheckCircle2 size={20} color="#fff" />
        <Text style={[styles.text, { color: "#fff" }]}>¡COMPLETADA HOY!</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      disabled={!canComplete}
      style={[styles.btn, canComplete ? styles.btnActive : styles.btnDisabled]}
      onPress={handlePress}
    >
      <Check size={18} color={canComplete ? "#fff" : "#9ca3af"} />
      <Text style={[styles.text, { color: canComplete ? "#fff" : "#9ca3af" }]}>
        {canComplete ? "MARCAR COMO CUMPLIDO" : "COMPLETA LOS PASOS PRIMERO"}
      </Text>
    </TouchableOpacity>
  );
}
// Helper View para el estado completado (necesita import View arriba si usas el bloque if)
import { View } from "react-native";

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  btnActive: {
    backgroundColor: "#10b981", // Verde éxito
  },
  btnDisabled: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  btnCompleted: {
    backgroundColor: "#6366f1", // Indigo para estado final
  },
  text: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
