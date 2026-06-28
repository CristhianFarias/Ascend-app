import { Check, CheckCircle2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getTodayKey } from "../store/ItineraryUtils";
import { getGoalStepsForDate } from "../store/goalScheduleUtils";
import useGoalsStore from "../store/useGoalsStore";

type Props = {
  goalId: string;
};

export default function CompleteTodayButton({ goalId }: Props) {
  const areAllStepsCompleted = useGoalsStore((s) => s.areAllStepsCompleted);
  const getGoalById = useGoalsStore((s) => s.getGoalById);
  const markGoalCompletedToday = useGoalsStore((s) => s.markGoalCompletedToday);

  const todayKey = getTodayKey();
  const goal = getGoalById(goalId);
  const todaySteps = goal ? getGoalStepsForDate(goal, todayKey) : [];
  const canComplete =
    todaySteps.length > 0
      ? todaySteps.every((step) => step.completed)
      : areAllStepsCompleted(goalId);

  // Verificamos si YA está marcada hoy (para cambiar el estilo visual)
  const completedToday = useGoalsStore((s) => {
    const done = s.dailyCompletionMap?.[todayKey] || [];
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
