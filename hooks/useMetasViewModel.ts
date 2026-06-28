import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Alert } from "react-native";

import { getTodayKey } from "../store/ItineraryUtils";
import { getGoalStepsForDate } from "../store/goalScheduleUtils";
import useGoalsStore from "../store/useGoalsStore";

/**
 * ViewModel de Metas.
 * Encapsula navegación local del modal y acciones sobre metas.
 */
export const useMetasViewModel = () => {
  const goals = useGoalsStore((s) => s.getGoalsListMemo());
  const startFocus = useGoalsStore((s) => s.startFocus);
  const deleteGoal = useGoalsStore((s) => s.deleteGoal);
  const addGoalSafe = useGoalsStore((s) => s.addGoalSafe);
  const getGoalById = useGoalsStore((s) => s.getGoalById);
  const toggleStep = useGoalsStore((s) => s.toggleStep);
  const areAllStepsCompleted = useGoalsStore((s) => s.areAllStepsCompleted);
  const markGoalCompletedToday = useGoalsStore((s) => s.markGoalCompletedToday);
  const settings = useGoalsStore((s) => s.settings);

  const { colors, dark } = useTheme();
  const bg = colors.background ?? (dark ? "#0b1220" : "#f9fafb");
  const card = colors.card ?? (dark ? "#1f2937" : "#ffffff");
  const text = colors.text ?? (dark ? "#f3f4f6" : "#111827");
  const subtext = colors.border ?? (dark ? "#9ca3af" : "#6b7280");
  const border = colors.border ?? (dark ? "#374151" : "#e5e7eb");
  const primary = colors.primary ?? settings.accentColor ?? "#111827";
  const accentColor = settings.accentColor || primary;

  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setShowCreator(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setShowCreator(true);
  };

  const closeCreator = () => {
    setShowCreator(false);
    setEditingId(null);
  };

  const openDetail = (id: string) => setExpandedId(id);
  const closeDetail = () => setExpandedId(null);
  const expandedGoal = expandedId ? getGoalById(expandedId) : null;

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar meta", "¿Seguro que quieres eliminar esta meta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteGoal(id) },
    ]);
  };

  const handleDuplicate = (id: string) => {
    const goal = getGoalById(id);
    if (!goal) return;

    const timestamp = Date.now();
    addGoalSafe({
      ...goal,
      id: `${goal.id}-copy-${timestamp}`,
      title: `${goal.title} (copia)`,
      steps: goal.steps.map((step) => ({
        ...step,
        id: `${step.id}-copy-${timestamp}`,
        completed: false,
      })),
      totalFocusMinutes: 0,
      completedDates: [],
    });
  };

  const markExpandedGoalToday = () => {
    if (!expandedGoal) return;

    const todaySteps = getGoalStepsForDate(expandedGoal, getTodayKey());
    const isReady =
      todaySteps.length > 0
        ? todaySteps.every((step) => step.completed)
        : areAllStepsCompleted(expandedGoal.id);

    if (isReady) {
      markGoalCompletedToday(expandedGoal.id);
      Alert.alert("¡Completado!", "Meta marcada como cumplida hoy.");
    } else {
      Alert.alert("No listo", "Completa todos los pasos primero.");
    }
  };

  return {
    goals,
    startFocus,
    toggleStep,
    showCreator,
    editingId,
    expandedGoal,
    openCreate,
    openEdit,
    closeCreator,
    openDetail,
    closeDetail,
    handleDelete,
    handleDuplicate,
    markExpandedGoalToday,
    colors: { bg, card, text, subtext, border, primary, accentColor },
    dark,
  };
};
