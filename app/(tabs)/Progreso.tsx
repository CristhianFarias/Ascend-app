import React from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import {
  dateKeyToDate,
  ProgressRange,
  useProgressViewModel,
} from "../../hooks/useProgressViewModel";
import { Goal } from "../../store/useGoalsStore";

export default function ProgresoScreen() {
  const {
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
    colors,
    dark,
  } = useProgressViewModel();

  const { bg, card, text, subtext, border, primary, successColor, streakColor } =
    colors;
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
                onPress={markTodayStrict}
                style={[styles.streakMiniBtn, { backgroundColor: primary }]}
              >
                <Text style={styles.streakMiniBtnText}>Marcar hoy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <View style={styles.rangeSelector}>
            {(["week", "month", "year"] as ProgressRange[]).map((item) => {
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
            onPress={markTodayWithFeedback}
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

