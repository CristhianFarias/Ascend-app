import { useTheme } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Alert, Share } from "react-native";

import { getTodayKey } from "../store/ItineraryUtils";
import { isGoalScheduledForDate } from "../store/goalScheduleUtils";
import useGoalsStore from "../store/useGoalsStore";

export type ProgressRange = "week" | "month" | "year";

export const dateKeyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map((x) => Number(x) || 0);
  return new Date(y, m - 1, d);
};

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatMonthShort = (monthIndex: number) =>
  new Date(2025, monthIndex, 1).toLocaleString("es-ES", { month: "short" });

const hexToRgba = (hex: string, opacity: number) => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * ViewModel de Progreso.
 * Agrupa datos derivados, gráfica, calendario y acciones fuera del JSX.
 */
export const useProgressViewModel = () => {
  const getGoalsListMemo = useGoalsStore((s) => s.getGoalsListMemo);
  const getGlobalStats = useGoalsStore((s) => s.getGlobalStats);
  const getHeatmapData = useGoalsStore((s) => s.getHeatmapData);
  const getStreakHistory = useGoalsStore((s) => s.getStreakHistory);
  const markTodayCompleteIfEligible = useGoalsStore(
    (s) => s.markTodayCompleteIfEligible,
  );
  const dailyCompletionMap = useGoalsStore((s) => s.dailyCompletionMap);
  const settings = useGoalsStore((s) => s.settings);

  const [range, setRange] = useState<ProgressRange>("month");
  const goals = getGoalsListMemo();
  const stats = getGlobalStats();
  const todayKey = getTodayKey();

  const { colors, dark } = useTheme();
  const storedAccent = settings.accentColor || "#f59e0b";
  const bg = colors.background ?? (dark ? "#0b1220" : "#f8fafc");
  const card = colors.card ?? (dark ? "#111827" : "#ffffff");
  const text = colors.text ?? (dark ? "#f3f4f6" : "#0f172a");
  const subtext = dark ? "#cbd5e1" : "#475569";
  const border = colors.border ?? (dark ? "#334155" : "#e2e8f0");
  const primary = colors.primary ?? storedAccent;
  const successColor = "#22c55e";
  const streakColor = primary;

  const activeGoalIds = useMemo(
    () =>
      goals
        .filter(
          (goal) =>
            goal.status === "active" &&
            isGoalScheduledForDate(goal, todayKey) &&
            Array.isArray(goal.steps) &&
            goal.steps.length > 0,
        )
        .map((goal) => goal.id),
    [goals, todayKey],
  );

  const todayCompletedGoals = dailyCompletionMap[todayKey] ?? [];
  const todayCompletedCount = activeGoalIds.filter((id) =>
    todayCompletedGoals.includes(id),
  ).length;
  const todayPercent =
    activeGoalIds.length === 0
      ? 0
      : Math.round((todayCompletedCount / activeGoalIds.length) * 100);
  const todayIsComplete =
    activeGoalIds.length > 0 &&
    activeGoalIds.every((id) => todayCompletedGoals.includes(id));

  const handleShareProgress = async () => {
    const message = `
¡Mi progreso en Ascend!

Racha actual: ${stats.globalStreak} días
Mejor racha: ${stats.bestStreak} días
Metas totales: ${stats.totalGoals}
Minutos enfocados: ${stats.totalFocusMinutes}m
Consistencia: ${stats.consistency}%

Sigo avanzando.
    `.trim();

    try {
      await Share.share({ message, title: "Mi progreso en Ascend" });
    } catch {
      Alert.alert("Error", "No se pudo compartir");
    }
  };

  const markTodayWithFeedback = () => {
    const ok = markTodayCompleteIfEligible();
    Alert.alert(
      ok ? "Día marcado" : "No marcado",
      ok ? "Se marcó el día completo" : "No se cumplen las condiciones",
    );
    return ok;
  };

  const markTodayStrict = () => {
    const ok = markTodayCompleteIfEligible();
    if (ok) {
      Alert.alert("¡Día marcado!", "La racha se actualizó.");
    } else {
      Alert.alert(
        "Aún no",
        "Completa todos los pasos de las metas activas para marcar el día.",
      );
    }
  };

  const heatmapData = useMemo(() => {
    const today = new Date();

    if (range === "week") return getHeatmapData("week");

    if (range === "month") {
      const result = [];
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date > today) break;

        const key = formatDateKey(date);
        const goalIds = dailyCompletionMap[key] ?? [];
        result.push({
          date: key,
          completed: goalIds.length > 0,
          count: goalIds.length,
          goalIds,
        });
      }

      return result;
    }

    const result = [];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    for (let month = 0; month <= currentMonth; month++) {
      const monthEnd = new Date(currentYear, month + 1, 0);
      let count = 0;
      const goalIdsSet = new Set<string>();

      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const date = new Date(currentYear, month, day);
        if (date > today) break;

        const goalIds = dailyCompletionMap[formatDateKey(date)] ?? [];
        count += goalIds.length;
        goalIds.forEach((id) => goalIdsSet.add(id));
      }

      result.push({
        date: `${currentYear}-${String(month + 1).padStart(2, "0")}-01`,
        completed: count > 0,
        count,
        goalIds: Array.from(goalIdsSet),
      });
    }

    return result;
  }, [range, dailyCompletionMap, getHeatmapData]);

  const baseStreakHistory = useMemo(
    () => getStreakHistory(range === "year" ? "all" : range),
    [range, getStreakHistory],
  );

  const aggregatedChartData = useMemo(() => {
    const labels: string[] = [];
    const counts: number[] = [];
    const streaks: number[] = [];

    if (range === "week") {
      heatmapData.forEach((item, index) => {
        labels.push(dateKeyToDate(item.date).getDate().toString());
        counts.push(item.count);
        streaks.push(baseStreakHistory[index]?.streak || 0);
      });
    } else if (range === "month") {
      const weeks = Array.from({ length: 5 }, () => ({
        count: [] as number[],
        streak: [] as number[],
      }));

      heatmapData.forEach((item, index) => {
        const weekIndex = Math.floor(index / 7);
        if (weekIndex >= 5) return;
        weeks[weekIndex].count.push(item.count);
        weeks[weekIndex].streak.push(
          baseStreakHistory.find((s) => s.date === item.date)?.streak || 0,
        );
      });

      weeks.forEach((week, index) => {
        if (week.count.length === 0) return;
        const avgCount =
          week.count.reduce((a, b) => a + b, 0) / week.count.length;
        counts.push(Math.round(avgCount));
        streaks.push(week.streak.reduce((max, value) => Math.max(max, value), 0));
        labels.push(`Sem ${index + 1}`);
      });
    } else {
      const months = Array.from({ length: 12 }, () => ({
        count: [] as number[],
        streak: [] as number[],
      }));
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      for (let month = 0; month <= currentMonth; month++) {
        const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${currentYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const item = heatmapData.find((h) => h.date === dateStr);
          if (!item) continue;
          months[month].count.push(item.count);
          months[month].streak.push(
            baseStreakHistory.find((s) => s.date === dateStr)?.streak || 0,
          );
        }
      }

      months.forEach((month, index) => {
        if (month.count.length === 0) return;
        counts.push(month.count.reduce((a, b) => a + b, 0));
        streaks.push(
          month.streak.reduce((max, value) => Math.max(max, value), 0),
        );
        labels.push(formatMonthShort(index));
      });
    }

    return {
      labels,
      datasets: [
        {
          data: counts,
          color: (opacity = 1) => hexToRgba(successColor, opacity),
          strokeWidth: 3,
        },
        {
          data: streaks,
          color: (opacity = 1) => hexToRgba(streakColor, opacity),
          strokeWidth: 3,
        },
      ],
    };
  }, [heatmapData, baseStreakHistory, range, successColor, streakColor]);

  const chartConfig = {
    backgroundGradientFrom: dark ? "#0b1220" : "#f1f5f9",
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: dark ? "#111827" : "#ffffff",
    backgroundGradientToOpacity: 1,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(text, opacity),
    labelColor: (opacity = 1) =>
      dark ? `rgba(243,244,246,${opacity})` : `rgba(31,41,55,${opacity})`,
    propsForDots: { r: "5", strokeWidth: "2", stroke: primary },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: border,
      strokeWidth: 1,
    },
    propsForLabels: { fontSize: 12, fontWeight: "600" as const },
  };

  const markedDates = useMemo(() => {
    const marks: any = {};

    Object.keys(dailyCompletionMap).forEach((date) => {
      const goalIds = dailyCompletionMap[date] ?? [];
      if (!goalIds.length) return;

      marks[date] = {
        ...(marks[date] || {}),
        dots: [
          ...(marks[date]?.dots || []),
          { key: "completed", color: successColor },
        ],
      };
    });

    goals.forEach((goal) => {
      if (!goal.deadline) return;

      marks[goal.deadline] = {
        ...(marks[goal.deadline] || {}),
        dots: [
          ...(marks[goal.deadline]?.dots || []),
          { key: goal.id, color: goal.color || primary },
        ],
      };
    });

    marks[todayKey] = {
      ...(marks[todayKey] || {}),
      selected: true,
      selectedColor: primary,
      selectedTextColor: "#ffffff",
      dots: [...(marks[todayKey]?.dots || [])],
    };

    return marks;
  }, [dailyCompletionMap, goals, primary, successColor, todayKey]);

  return {
    range,
    setRange,
    goals,
    stats,
    todayKey,
    todayPercent,
    todayCompletedCount,
    activeGoalIds,
    todayIsComplete,
    heatmapData,
    aggregatedChartData,
    chartConfig,
    markedDates,
    handleShareProgress,
    markTodayStrict,
    markTodayWithFeedback,
    colors: { bg, card, text, subtext, border, primary, successColor, streakColor },
    dark,
  };
};
