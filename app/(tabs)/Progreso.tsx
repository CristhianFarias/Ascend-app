import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getTodayKey } from "../../store/ItineraryUtils";
import useGoalsStore, { Goal } from "../../store/useGoalsStore";

type RangeType = "week" | "month" | "year";

const dateKeyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map((x) => Number(x) || 0);
  return new Date(y, m - 1, d);
};

const formatMonthShort = (monthIndex: number) =>
  new Date(2025, monthIndex, 1).toLocaleString("es-ES", { month: "short" });

export default function ProgresoScreen() {
  const getGoalsListMemo = useGoalsStore((s) => s.getGoalsListMemo);
  const getGlobalStats = useGoalsStore((s) => s.getGlobalStats);
  const getHeatmapData = useGoalsStore((s) => s.getHeatmapData);
  const getStreakHistory = useGoalsStore((s) => s.getStreakHistory);
  const markTodayCompleteIfEligible = useGoalsStore(
    (s) => s.markTodayCompleteIfEligible,
  );
  const dailyCompletionMap = useGoalsStore((s) => s.dailyCompletionMap);
  const settings = useGoalsStore((s) => s.settings);

  const [range, setRange] = useState<RangeType>("month");

  const goals = getGoalsListMemo();
  const stats = getGlobalStats();

  const todayKey = getTodayKey();

  const activeGoalIds = useMemo(
    () =>
      goals
        .filter(
          (g) =>
            g.status === "active" &&
            Array.isArray(g.steps) &&
            g.steps.length > 0,
        )
        .map((g) => g.id),
    [goals],
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

  const storedAccent = settings.accentColor || "#f59e0b";

  const { colors, dark } = useTheme();
  const bg = colors.background ?? (dark ? "#0b1220" : "#f8fafc");
  const card = colors.card ?? (dark ? "#111827" : "#ffffff");
  const text = colors.text ?? (dark ? "#f3f4f6" : "#0f172a");
  const subtext = colors.border ?? (dark ? "#94a3b8" : "#64748b");
  const border = colors.border ?? (dark ? "#334155" : "#e2e8f0");
  const primary = colors.primary ?? storedAccent;

  const successColor = "#22c55e";
  const streakColor = primary;

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const handleShareProgress = async () => {
    const message = `
¡Mi progreso en Ascend! 🚀

🔥 Racha actual: ${stats.globalStreak} días
🏆 Mejor racha: ${stats.bestStreak} días
🎯 Metas totales: ${stats.totalGoals}
⏱️ Minutos enfocados: ${stats.totalFocusMinutes}m
✅ Consistencia: ${stats.consistency}%

¡Sigo avanzando! 💪
    `.trim();

    try {
      await Share.share({
        message,
        title: "Mi progreso en Ascend",
      });
    } catch {
      Alert.alert("Error", "No se pudo compartir");
    }
  };

  const heatmapData = useMemo(() => {
    const today = new Date();

    if (range === "week") {
      return getHeatmapData("week");
    }

    if (range === "month") {
      const result = [];
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date > today) break;

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        const goalIds = dailyCompletionMap[key] ?? [];
        count += goalIds.length;
        goalIds.forEach((id) => goalIdsSet.add(id));
      }

      const key = `${currentYear}-${String(month + 1).padStart(2, "0")}-01`;

      result.push({
        date: key,
        completed: count > 0,
        count,
        goalIds: Array.from(goalIdsSet),
      });
    }

    return result;
  }, [range, dailyCompletionMap, getHeatmapData]);

  const baseStreakHistory = useMemo(() => {
    return getStreakHistory(range === "year" ? "all" : range);
  }, [range, getStreakHistory]);

  const aggregatedChartData = useMemo(() => {
    const labels: string[] = [];
    const counts: number[] = [];
    const streaks: number[] = [];

    if (range === "week") {
      heatmapData.forEach((h, i) => {
        labels.push(dateKeyToDate(h.date).getDate().toString());
        counts.push(h.count);
        streaks.push(baseStreakHistory[i]?.streak || 0);
      });
    } else if (range === "month") {
      const weeks = Array.from({ length: 5 }, () => ({
        count: [] as number[],
        streak: [] as number[],
      }));

      heatmapData.forEach((h, i) => {
        const weekIndex = Math.floor(i / 7);
        if (weekIndex < 5) {
          weeks[weekIndex].count.push(h.count);
          weeks[weekIndex].streak.push(
            baseStreakHistory.find((s) => s.date === h.date)?.streak || 0,
          );
        }
      });

      weeks.forEach((week, i) => {
        if (week.count.length > 0) {
          const avgCount =
            week.count.reduce((a, b) => a + b, 0) / week.count.length;
          counts.push(Math.round(avgCount));
          const maxStreak = week.streak.reduce((m, v) => Math.max(m, v), 0);
          streaks.push(maxStreak);
          labels.push(`Sem ${i + 1}`);
        }
      });
    } else {
      const months = Array.from({ length: 12 }, () => ({
        count: [] as number[],
        streak: [] as number[],
      }));

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      for (let m = 0; m <= currentMonth; m++) {
        const daysInMonth = new Date(currentYear, m + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${currentYear}-${String(m + 1).padStart(2, "0")}-${String(
            d,
          ).padStart(2, "0")}`;
          const item = heatmapData.find((h) => h.date === dateStr);
          if (item) {
            months[m].count.push(item.count);
            const streakItem = baseStreakHistory.find(
              (s) => s.date === dateStr,
            );
            months[m].streak.push(streakItem?.streak || 0);
          }
        }
      }

      months.forEach((month, i) => {
        if (month.count.length > 0) {
          const totalCount = month.count.reduce((a, b) => a + b, 0);
          counts.push(totalCount);
          const maxStreak = month.streak.reduce((m, v) => Math.max(m, v), 0);
          streaks.push(maxStreak);
          labels.push(formatMonthShort(i));
        }
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
    color: (opacity = 1) => {
      const hex = (colors.text ?? (dark ? "#f3f4f6" : "#1f2937")).replace(
        "#",
        "",
      );
      return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(
        hex.slice(2, 4),
        16,
      )}, ${parseInt(hex.slice(4, 6), 16)}, ${opacity})`;
    },
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
          {
            key: "completed",
            color: successColor,
          },
        ],
      };
    });

    goals.forEach((goal) => {
      if (!goal.deadline) return;

      marks[goal.deadline] = {
        ...(marks[goal.deadline] || {}),
        dots: [
          ...(marks[goal.deadline]?.dots || []),
          {
            key: goal.id,
            color: goal.color || primary,
          },
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

  const renderGoalProgress = ({ item }: { item: Goal }) => {
    const done = item.steps.filter((s) => s.completed).length;
    const total = item.steps.length || 1;
    const percent = Math.round((done / total) * 100);
    const markedToday = Array.isArray(item.completedDates)
      ? item.completedDates.includes(todayKey)
      : false;

    return (
      <View
        style={[
          styles.goalRow,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <View
          style={[
            styles.goalAccent,
            { backgroundColor: item.color || primary },
          ]}
        />
        <View style={{ flex: 1 }}>
          <View style={styles.goalHeaderRow}>
            <Text style={[styles.goalTitle, { color: text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View
              style={[
                styles.goalPill,
                {
                  backgroundColor: markedToday
                    ? `${successColor}1A`
                    : `${primary}1A`,
                },
              ]}
            >
              <Text
                style={[
                  styles.goalPillText,
                  { color: markedToday ? successColor : primary },
                ]}
              >
                {markedToday ? "Hoy" : "Pendiente"}
              </Text>
            </View>
          </View>

          <Text style={[styles.goalMeta, { color: subtext }]}>
            {item.category} • Prioridad {item.priority}
          </Text>
          <Text style={[styles.goalMetaSmall, { color: subtext }]}>
            {item.status} • {done}/{total} pasos
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.percent, { color: primary }]}>{percent}%</Text>
          <Text style={[styles.small, { color: subtext }]}>avance</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCardWrapper}>
          <View
            style={[
              styles.headerCard,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <View style={styles.headerTopRow}>
              <View>
                <Text style={[styles.headerTitle, { color: text }]}>
                  Progreso
                </Text>
                <Text style={[styles.headerSub, { color: subtext }]}>
                  Resumen, consistencia y evolución
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.shareIconBtn,
                  { backgroundColor: `${primary}14` },
                ]}
                onPress={handleShareProgress}
              >
                <Icon name="share-variant" size={18} color={primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statBox,
                  styles.shadow,
                  {
                    backgroundColor: dark ? "#0f172a" : "#f8fafc",
                    borderColor: border,
                  },
                ]}
              >
                <Icon name="target" size={24} color={primary} />
                <Text style={[styles.statValue, { color: text }]}>
                  {stats.totalGoals}
                </Text>
                <Text style={[styles.statLabel, { color: subtext }]}>
                  Metas totales
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  styles.shadow,
                  {
                    backgroundColor: dark ? "#0f172a" : "#f8fafc",
                    borderColor: border,
                  },
                ]}
              >
                <Icon name="clock-outline" size={24} color={primary} />
                <Text style={[styles.statValue, { color: text }]}>
                  {stats.totalMinutes}m
                </Text>
                <Text style={[styles.statLabel, { color: subtext }]}>
                  Minutos totales
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  styles.shadow,
                  {
                    backgroundColor: dark ? "#0f172a" : "#f8fafc",
                    borderColor: border,
                  },
                ]}
              >
                <Icon name="fire" size={24} color={primary} />
                <Text style={[styles.statValue, { color: text }]}>
                  {stats.globalStreak}
                </Text>
                <Text style={[styles.statLabel, { color: subtext }]}>
                  Racha actual
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.streakMiniCard,
                {
                  backgroundColor: dark ? "#0f172a" : "#f8fafc",
                  borderColor: border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakMiniLabel, { color: subtext }]}>
                  Progreso de hoy
                </Text>
                <Text style={[styles.streakMiniValue, { color: text }]}>
                  {todayPercent}% completado
                </Text>
                <Text style={[styles.streakMiniSub, { color: subtext }]}>
                  {todayCompletedCount}/{activeGoalIds.length} metas activas
                  completadas
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  const ok = markTodayCompleteIfEligible();
                  if (ok) {
                    Alert.alert("¡Día marcado!", "La racha se actualizó.");
                  } else {
                    Alert.alert(
                      "Aún no",
                      "Completa todos los pasos de las metas activas para marcar el día.",
                    );
                  }
                }}
                style={[styles.streakMiniBtn, { backgroundColor: primary }]}
              >
                <Text style={styles.streakMiniBtnText}>Marcar hoy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <View style={styles.rangeSelector}>
            {(["week", "month", "year"] as RangeType[]).map((item) => {
              const active = range === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setRange(item)}
                  style={[
                    styles.rangeBtn,
                    {
                      backgroundColor: active
                        ? primary
                        : dark
                          ? "#0f172a"
                          : "#eef2ff",
                      borderColor: active ? primary : border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rangeText,
                      { color: active ? "#fff" : text },
                    ]}
                  >
                    {item === "week"
                      ? "Semana"
                      : item === "month"
                        ? "Mes"
                        : "Año"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: text }]}>
            Consistencia —{" "}
            {range === "week"
              ? "última semana"
              : range === "month"
                ? "mes actual"
                : "año actual"}
          </Text>

          <View
            style={[
              styles.heatmapCard,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.heatmapRow}>
                {heatmapData.map((h) => {
                  const isYearRange = range === "year";
                  const label = isYearRange
                    ? dateKeyToDate(h.date).toLocaleString("es-ES", {
                        month: "short",
                      })
                    : dateKeyToDate(h.date).getDate().toString();

                  return (
                    <View
                      key={h.date}
                      style={[
                        styles.heatCell,
                        {
                          backgroundColor: h.completed
                            ? successColor
                            : dark
                              ? "#1f2937"
                              : "#e5e7eb",
                        },
                        styles.shadowSmall,
                      ]}
                    >
                      <Text style={styles.heatText}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Evolución en el tiempo
          </Text>

          {aggregatedChartData.labels.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View
                style={[
                  styles.chartContainer,
                  styles.shadow,
                  { backgroundColor: card, borderColor: border },
                ]}
              >
                <LineChart
                  data={aggregatedChartData}
                  width={
                    range === "year" ? 820 : Dimensions.get("window").width - 40
                  }
                  height={260}
                  chartConfig={chartConfig}
                  bezier
                  withInnerLines
                  withOuterLines
                  withShadow
                  style={{ borderRadius: 18 }}
                />
              </View>
            </ScrollView>
          ) : (
            <Text style={[styles.empty, { color: subtext }]}>
              No hay datos para graficar aún
            </Text>
          )}

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: successColor }]}
              />
              <Text style={[styles.legendText, { color: subtext }]}>
                Metas completadas
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: streakColor }]}
              />
              <Text style={[styles.legendText, { color: subtext }]}>Racha</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Calendario de rachas y deadlines
          </Text>

          <View
            style={[
              styles.calendarContainer,
              styles.shadow,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <Calendar
              markingType="multi-dot"
              markedDates={markedDates}
              theme={{
                backgroundColor: card,
                calendarBackground: card,
                textSectionTitleColor: subtext,
                selectedDayBackgroundColor: primary,
                selectedDayTextColor: "#ffffff",
                todayTextColor: primary,
                dayTextColor: text,
                textDisabledColor: border,
                arrowColor: primary,
                monthTextColor: text,
                indicatorColor: primary,
                dotColor: primary,
                selectedDotColor: "#ffffff",
              }}
            />
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Progreso por meta
          </Text>

          {goals.length === 0 ? (
            <Text style={[styles.empty, { color: subtext }]}>
              No hay metas aún
            </Text>
          ) : (
            goals.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderGoalProgress({ item })}
                {index < goals.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))
          )}
        </View>

        <View style={[styles.footer, { backgroundColor: bg }]}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              styles.shadow,
              { backgroundColor: primary },
            ]}
            onPress={() => {
              const ok = markTodayCompleteIfEligible();
              Alert.alert(
                ok ? "Día marcado" : "No marcado",
                ok
                  ? "Se marcó el día completo"
                  : "No se cumplen las condiciones",
              );
            }}
          >
            <Text style={styles.primaryBtnText}>
              {todayIsComplete ? "✓ Día listo" : "Marcar día si corresponde"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 16 }} />

          <TouchableOpacity
            style={[styles.shareBtn, styles.shadow]}
            onPress={handleShareProgress}
          >
            <Icon name="share-variant" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Compartir mi progreso</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 18, paddingBottom: 36 },

  headerCardWrapper: {
    marginTop: 2,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "500",
  },
  shareIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  streakMiniCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakMiniLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  streakMiniValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
  },
  streakMiniSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  streakMiniBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  streakMiniBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  rangeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  rangeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 86,
    alignItems: "center",
  },
  rangeText: { fontWeight: "800", fontSize: 14 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "left",
  },

  heatmapCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
  },
  heatmapRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  heatCell: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heatText: { fontSize: 13, color: "#fff", fontWeight: "800" },

  chartContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 13,
    fontWeight: "600",
  },

  calendarContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },

  goalRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
  },
  goalAccent: {
    width: 5,
    height: 46,
    borderRadius: 999,
    marginRight: 12,
  },
  goalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  goalTitle: {
    flex: 1,
    fontWeight: "900",
    fontSize: 16,
  },
  goalMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  goalMetaSmall: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  goalPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  goalPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  percent: {
    fontWeight: "900",
    fontSize: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  footer: {
    paddingVertical: 20,
  },
  primaryBtn: {
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  shareBtn: {
    flexDirection: "row",
    backgroundColor: "#5D3FD3",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    fontWeight: "600",
  },
  separator: { height: 10 },

  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shadowSmall: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
