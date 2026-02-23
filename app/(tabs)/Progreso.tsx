// app/(tabs)/progreso.tsx
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Goal, useGoalsStore } from "../../store/useGoalsStore";

/**
 * ProgresoScreen (theme-aware)
 * - Responde a light/dark desde ThemeProvider
 * - Usa settings.accentColor como fallback/primary
 * - Gráficas adaptan colores (datasets y chartConfig)
 * - Calendario adaptado al theme
 *
 * Nota: cuidé de no tocar la lógica numérica (agregaciones/heatmap), solo la presentación.
 */

export default function ProgresoScreen() {
  const getGoalsListMemo = useGoalsStore((s) => s.getGoalsListMemo);
  const getGlobalStats = useGoalsStore((s) => s.getGlobalStats);
  const getHeatmapData = useGoalsStore((s) => s.getHeatmapData);
  const getStreakHistory = useGoalsStore((s) => s.getStreakHistory);
  const markTodayCompleteIfEligible = useGoalsStore(
    (s) => s.markTodayCompleteIfEligible,
  );
  const settings = useGoalsStore((s) => s.settings);
  const dailyCompletionMap = useGoalsStore((s) => s.dailyCompletionMap);

  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const goals = getGoalsListMemo();
  const stats = getGlobalStats();

  const selectorRange = range === "year" ? "all" : range;
  const baseHeatmap = getHeatmapData(selectorRange as "week" | "month" | "all");
  const baseStreakHistory = getStreakHistory(
    selectorRange as "week" | "month" | "all",
  );

  const storedAccent = settings.accentColor || "#f59e0b";

  /* THEME */
  const { colors, dark } = useTheme();
  const bg = colors.background ?? (dark ? "#0b1220" : "#f9fafb");
  const card = colors.card ?? (dark ? "#111827" : "#ffffff");
  const text = colors.text ?? (dark ? "#f3f4f6" : "#111827");
  const subtext = colors.border ?? (dark ? "#9ca3af" : "#6b7280");
  const border = colors.border ?? (dark ? "#374151" : "#e5e7eb");
  const primary = colors.primary ?? storedAccent;

  // Colores para gráficas: completados (verde), racha (usar primary)
  const successColor = "#22c55e"; // verde consistente
  const streakColor = primary;

  const accentColor = primary;

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
    } catch (e) {
      Alert.alert("Error", "No se pudo compartir");
    }
  };

  const renderGoalProgress = ({ item }: { item: Goal }) => {
    const done = item.steps.filter((s) => s.completed).length;
    const total = item.steps.length || 1;
    const percent = Math.round((done / total) * 100);
    return (
      <View
        style={[styles.goalRow, { backgroundColor: card, borderColor: border }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.goalTitle, { color: text }]}>{item.title}</Text>
          <Text style={[styles.goalMeta, { color: subtext }]}>
            {item.category} • Prioridad {item.priority}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.percent, { color: accentColor }]}>
            {percent}%
          </Text>
          <Text style={[styles.small, { color: subtext }]}>
            {done}/{total} pasos
          </Text>
        </View>
      </View>
    );
  };

  // Heatmap ajustado: siempre empieza desde día 1 (mes) o enero (año)
  const heatmapData = useMemo(() => {
    if (range === "week") {
      return baseHeatmap; // Últimos 7 días (como antes)
    }

    const today = new Date();
    const result: typeof baseHeatmap = [];

    if (range === "month") {
      // Desde día 1 del mes actual hasta hoy
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date > today) break; // No incluir futuros
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const goalIds = dailyCompletionMap[key] ?? [];
        result.push({
          date: key,
          completed: goalIds.length > 0,
          count: goalIds.length,
          goalIds,
        });
      }
    } else if (range === "year") {
      // Para año mostramos resumen por mes pero heatmap diaria del mes actual (por simplicidad)
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date > today) break;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const goalIds = dailyCompletionMap[key] ?? [];
        result.push({
          date: key,
          completed: goalIds.length > 0,
          count: goalIds.length,
          goalIds,
        });
      }
    }

    return result;
  }, [range, baseHeatmap, dailyCompletionMap]);

  const heatmapGrid = useMemo(() => heatmapData, [heatmapData]);

  // Gráfica ajustada para empezar desde principio del período
  const aggregatedChartData = useMemo(() => {
    const labels: string[] = [];
    const counts: number[] = [];
    const streaks: number[] = [];

    if (range === "week") {
      heatmapData.forEach((h, i) => {
        labels.push(new Date(h.date).getDate().toString());
        counts.push(h.count);
        streaks.push(baseStreakHistory[i]?.streak || 0);
      });
    } else if (range === "month") {
      const weeks = Array.from({ length: 5 }, () => ({
        count: [] as number[],
        streak: [] as number[],
      }));
      heatmapData.forEach((h, i) => {
        const weekIndex = Math.floor(i / 7); // Desde día 1
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
    } else if (range === "year") {
      const months = Array.from({ length: 12 }, () => ({
        count: [] as number[],
        streak: [] as number[],
      }));
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Llenar todos los meses del año actual
      for (let m = 0; m <= currentMonth; m++) {
        const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${currentYear}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const item = baseHeatmap.find((h) => h.date === dateStr);
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
          const monthName = new Date(currentYear, i, 1).toLocaleString(
            "es-ES",
            { month: "short" },
          );
          labels.push(monthName);
        }
      });
    }

    return {
      labels,
      datasets: [
        {
          data: counts,
          color: (opacity = 1) =>
            `rgba(${parseInt(successColor.slice(1, 3), 16)}, ${parseInt(successColor.slice(3, 5), 16)}, ${parseInt(successColor.slice(5, 7), 16)}, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: streaks,
          color: (opacity = 1) => {
            // streakColor puede ser un HEX o rgb; asumimos HEX. Si no, se usa directamente con opacity.
            const hex = streakColor.replace("#", "");
            if (hex.length === 6) {
              return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}, ${opacity})`;
            }
            return `rgba(249,115,22,${opacity})`; // fallback naranja
          },
          strokeWidth: 3,
        },
      ],
    };
  }, [heatmapData, baseStreakHistory, range, successColor, streakColor]);

  const chartConfig = {
    backgroundGradientFrom: dark ? "#0b1220" : "#f3f4f6",
    backgroundGradientFromOpacity: 0.8,
    backgroundGradientTo: dark ? "#07101a" : "#ffffff",
    backgroundGradientToOpacity: 1,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      const hex = (colors.text ?? (dark ? "#f3f4f6" : "#1f2937")).replace(
        "#",
        "",
      );
      if (hex.length === 6) {
        return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}, ${opacity})`;
      }
      return `rgba(31,41,55,${opacity})`;
    },
    labelColor: (opacity = 1) =>
      dark ? `rgba(243,244,246,${opacity})` : `rgba(31,41,55,${opacity})`,
    propsForDots: { r: "6", strokeWidth: "2", stroke: accentColor },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: border,
      strokeWidth: 1,
    },
    propsForLabels: { fontSize: 12, fontWeight: "600" },
  };

  // Calendario con completados + deadlines
  const markedDates = useMemo(() => {
    const marks: any = {};

    Object.keys(dailyCompletionMap).forEach((date) => {
      marks[date] = marks[date] || {};
      marks[date].customStyles = {
        container: { backgroundColor: successColor },
        text: { color: "#fff", fontWeight: "bold" },
      };
    });

    goals.forEach((goal) => {
      if (goal.deadline) {
        marks[goal.deadline] = marks[goal.deadline] || { dots: [] };
        marks[goal.deadline].dots.push({
          key: goal.id,
          color: goal.color || accentColor,
        });
        marks[goal.deadline].marked = true;
      }
    });

    return marks;
  }, [dailyCompletionMap, goals, accentColor, successColor]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: text }]}>Progreso</Text>
          <Text style={[styles.headerSub, { color: subtext }]}>
            Resumen, consistencia y evolución
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBox,
              styles.shadow,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <Icon name="target" size={24} color={accentColor} />
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
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <Icon name="clock-outline" size={24} color={accentColor} />
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
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <Icon name="fire" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: text }]}>
              {stats.globalStreak}
            </Text>
            <Text style={[styles.statLabel, { color: subtext }]}>
              Racha actual
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <View style={styles.rangeSelector}>
            <TouchableOpacity
              onPress={() => setRange("week")}
              style={[
                styles.rangeBtn,
                {
                  backgroundColor:
                    range === "week"
                      ? accentColor
                      : dark
                        ? "#0b1220"
                        : "#f3f4f6",
                },
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  { color: range === "week" ? "#fff" : text },
                ]}
              >
                Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRange("month")}
              style={[
                styles.rangeBtn,
                {
                  backgroundColor:
                    range === "month"
                      ? accentColor
                      : dark
                        ? "#0b1220"
                        : "#f3f4f6",
                },
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  { color: range === "month" ? "#fff" : text },
                ]}
              >
                Mes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRange("year")}
              style={[
                styles.rangeBtn,
                {
                  backgroundColor:
                    range === "year"
                      ? accentColor
                      : dark
                        ? "#0b1220"
                        : "#f3f4f6",
                },
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  { color: range === "year" ? "#fff" : text },
                ]}
              >
                Año
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Consistencia —{" "}
            {range === "week"
              ? "última semana"
              : range === "month"
                ? "mes actual"
                : "año actual"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 12 }}
          >
            {heatmapGrid.map((h) => (
              <TouchableOpacity
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
                <Text style={styles.heatText}>
                  {new Date(h.date).getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Evolución en el Tiempo
          </Text>
          {aggregatedChartData.labels.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View
                style={[
                  styles.chartContainer,
                  styles.shadow,
                  { backgroundColor: card },
                ]}
              >
                <LineChart
                  data={aggregatedChartData}
                  width={
                    range === "year" ? 800 : Dimensions.get("window").width - 40
                  }
                  height={260}
                  chartConfig={chartConfig}
                  bezier
                  withInnerLines
                  withOuterLines
                  withShadow
                  style={{ borderRadius: 16 }}
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
            Calendario de Rachas y Deadlines
          </Text>
          <View
            style={[
              styles.calendarContainer,
              styles.shadow,
              { backgroundColor: card },
            ]}
          >
            <Calendar
              markingType="multi-dot"
              markedDates={markedDates}
              theme={{
                backgroundColor: card,
                calendarBackground: card,
                textSectionTitleColor: subtext,
                selectedDayBackgroundColor: accentColor,
                selectedDayTextColor: "#ffffff",
                todayTextColor: accentColor,
                dayTextColor: text,
                textDisabledColor: border,
                arrowColor: accentColor,
                monthTextColor: text,
                indicatorColor: accentColor,
              }}
            />
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Progreso por meta
          </Text>
          <FlatList
            data={goals}
            keyExtractor={(item: Goal) => item.id}
            renderItem={renderGoalProgress}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: subtext }]}>
                No hay metas aún
              </Text>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            nestedScrollEnabled={Platform.OS === "android"}
            scrollEnabled={false}
          />
        </View>

        <View style={[styles.footer, { backgroundColor: bg }]}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              styles.shadow,
              { backgroundColor: accentColor },
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
            <Text style={styles.primaryBtnText}>Marcar día si corresponde</Text>
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
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 16, alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "bold" },
  headerSub: { marginTop: 6, fontSize: 16 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: { marginTop: 4, fontSize: 14 },

  rangeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  rangeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  rangeText: { fontWeight: "600", fontSize: 14 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  heatCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  heatText: { fontSize: 14, color: "#fff", fontWeight: "600" },

  chartContainer: { borderRadius: 16, padding: 12 },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 14, fontWeight: "500" },

  calendarContainer: { borderRadius: 16, overflow: "hidden" },

  goalRow: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  goalTitle: { fontWeight: "700", fontSize: 16 },
  goalMeta: { marginTop: 4, fontSize: 14 },
  percent: { fontWeight: "700", fontSize: 18 },
  small: { fontSize: 12 },

  footer: { paddingVertical: 20 },
  primaryBtn: { padding: 16, borderRadius: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  shareBtn: {
    flexDirection: "row",
    backgroundColor: "#5D3FD3",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  empty: { textAlign: "center", marginTop: 24, fontSize: 16 },

  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shadowSmall: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  separator: { height: 8 },
});
