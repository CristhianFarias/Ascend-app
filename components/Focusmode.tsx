import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import useGoalsStore from "../store/useGoalsStore";

function secondsToMMSS(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function FocusMode() {
  const focusSession = useGoalsStore((s) => s.focusSession);
  const tick = useGoalsStore((s) => s.tick);
  const pauseFocus = useGoalsStore((s) => s.pauseFocus);
  const resumeFocus = useGoalsStore((s) => s.resumeFocus);
  const finishFocus = useGoalsStore((s) => s.finishFocus);
  const skipSetOrStep = useGoalsStore((s) => s.skipSetOrStep);
  const getGoalById = useGoalsStore((s) => s.getGoalById);

  const [nowTick, setNowTick] = useState(Date.now());
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { colors, dark } = useTheme();

  const bg = colors?.background ?? (dark ? "#0b1220" : "#f8fafc");
  const card = colors?.card ?? (dark ? "#111827" : "#ffffff");
  const text = colors?.text ?? (dark ? "#f3f4f6" : "#111827");
  const subtext = dark ? "#cbd5e1" : "#475569";
  const border = colors?.border ?? (dark ? "#374151" : "#e5e7eb");
  const primary = colors?.primary ?? "#111827";

  useEffect(() => {
    if (!focusSession) return;

    const id = setInterval(() => {
      const n = Date.now();
      setNowTick(n);
      tick(n);
    }, 1000);

    return () => clearInterval(id);
  }, [focusSession, tick]);

  useEffect(() => {
    if (!focusSession) return;
    if (Platform.OS !== "web") Vibration.vibrate(40);
  }, [focusSession?.goalId, focusSession?.stepId]);

  useEffect(() => {
    if (!focusSession) return;
    if (Platform.OS !== "web" && focusSession.phase === "rest") {
      Vibration.vibrate([0, 40, 60, 40]);
    }
  }, [focusSession?.phase]);

  const visible = Boolean(focusSession);

  const goal = useMemo(() => {
    if (!focusSession) return null;
    return getGoalById(focusSession.goalId) ?? null;
  }, [focusSession?.goalId, getGoalById, nowTick]);

  const currentStep = useMemo(() => {
    if (!focusSession || !goal) return null;
    return goal.steps[focusSession.stepIndex] ?? null;
  }, [focusSession?.goalId, focusSession?.stepIndex, goal, nowTick]);

  const totalSeconds = useMemo(() => {
    if (!focusSession || !currentStep) return 0;
    const base = Math.max(1, currentStep.duration || 1) * 60;
    return Math.max(base, focusSession.remainingSeconds);
  }, [focusSession, currentStep]);

  const progress = useMemo(() => {
    if (!focusSession || !currentStep) return 0;
    const base = Math.max(1, currentStep.duration || 1) * 60;
    const spent = Math.max(0, base - focusSession.remainingSeconds);
    return Math.max(0, Math.min(100, Math.round((spent / base) * 100)));
  }, [focusSession, currentStep, nowTick]);

  const phaseLabel =
    focusSession?.phase === "work"
      ? "Enfoque"
      : focusSession?.phase === "rest"
        ? "Descanso"
        : "Inactivo";

  const phaseColor =
    focusSession?.phase === "work"
      ? "#22c55e"
      : focusSession?.phase === "rest"
        ? "#f59e0b"
        : "#64748b";

  if (!visible || !focusSession) return null;

  const handleFinish = () => {
    setConfirmVisible(false);
    finishFocus();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => setConfirmVisible(true)}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

        <View style={styles.outer}>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.kicker, { color: subtext }]}>Modo Focus</Text>
                <Text style={[styles.goalTitle, { color: text }]} numberOfLines={1}>
                  {goal?.title ?? "Meta"}
                </Text>
                <Text style={[styles.stepTitle, { color: text }]} numberOfLines={2}>
                  {currentStep?.title ?? "Paso actual"}
                </Text>
              </View>

              <View style={[styles.phaseBadge, { backgroundColor: phaseColor + "20" }]}>
                <Text style={[styles.phaseBadgeText, { color: phaseColor }]}>
                  {phaseLabel}
                </Text>
              </View>
            </View>

            <View style={styles.timerWrap}>
              <Text style={[styles.timer, { color: text }]}>
                {secondsToMMSS(focusSession.remainingSeconds)}
              </Text>
              <Text style={[styles.timerSub, { color: subtext }]}>
                {focusSession.running ? "Sesión activa" : "En pausa"}
              </Text>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: subtext }]}>
                  Progreso del paso
                </Text>
                <Text style={[styles.progressValue, { color: text }]}>
                  {progress}%
                </Text>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: focusSession.running ? primary : "#64748b",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.infoGrid]}>
              <View style={[styles.infoBox, { backgroundColor: dark ? "#0f172a" : "#f8fafc", borderColor: border }]}>
                <Text style={[styles.infoLabel, { color: subtext }]}>Set</Text>
                <Text style={[styles.infoValue, { color: text }]}>
                  {focusSession.currentSet}/{focusSession.totalSets}
                </Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: dark ? "#0f172a" : "#f8fafc", borderColor: border }]}>
                <Text style={[styles.infoLabel, { color: subtext }]}>Paso</Text>
                <Text style={[styles.infoValue, { color: text }]}>
                  {focusSession.stepIndex + 1}
                </Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: dark ? "#0f172a" : "#f8fafc", borderColor: border }]}>
                <Text style={[styles.infoLabel, { color: subtext }]}>Bloque</Text>
                <Text style={[styles.infoValue, { color: text }]}>
                  {secondsToMMSS(totalSeconds)}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: subtext }]}>
                {goal?.category ?? "Meta"} • {goal?.priority ? `Prioridad ${goal.priority}` : "Sin prioridad"}
              </Text>
              <Text style={[styles.metaText, { color: subtext }]}>
                {focusSession.phase === "work" ? "Concéntrate en ejecutar" : "Respira y recupera"}
              </Text>
            </View>
          </View>

          <View style={styles.btnArea}>
            {focusSession.running ? (
              <TouchableOpacity
                onPress={pauseFocus}
                style={[styles.btnSecondary, { backgroundColor: card, borderColor: border }]}
                activeOpacity={0.9}
              >
                <Text style={[styles.btnSecondaryText, { color: text }]}>Pausar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={resumeFocus}
                style={[styles.btnPrimary, { backgroundColor: primary }]}
                activeOpacity={0.9}
              >
                <Text style={styles.btnPrimaryText}>Reanudar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={skipSetOrStep}
              style={[styles.btnSecondary, { backgroundColor: card, borderColor: border }]}
              activeOpacity={0.9}
            >
              <Text style={[styles.btnSecondaryText, { color: text }]}>Saltar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setConfirmVisible(true)}
              style={[styles.btnDanger, { backgroundColor: "#ef4444" }]}
              activeOpacity={0.9}
            >
              <Text style={styles.btnDangerText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={[styles.confirmCard, { backgroundColor: card, borderColor: border }]}>
              <Text style={[styles.confirmTitle, { color: text }]}>
                ¿Finalizar Focus?
              </Text>
              <Text style={[styles.confirmText, { color: subtext }]}>
                Se cerrará la sesión actual y volverás a la pantalla normal.
              </Text>

              <View style={styles.confirmRow}>
                <TouchableOpacity
                  onPress={() => setConfirmVisible(false)}
                  style={[styles.confirmBtn, { backgroundColor: dark ? "#0f172a" : "#f3f4f6", borderColor: border }]}
                >
                  <Text style={[styles.confirmBtnText, { color: text }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFinish}
                  style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
                >
                  <Text style={styles.confirmBtnTextDanger}>Finalizar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  outer: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
    lineHeight: 34,
  },
  phaseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  phaseBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  timerWrap: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 18,
  },
  timer: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: 1,
  },
  timerSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  progressBlock: {
    marginTop: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  metaRow: {
    marginTop: 16,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  btnArea: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  btnPrimary: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  btnSecondary: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: "800",
  },
  btnDanger: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDangerText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  confirmCard: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  confirmText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  confirmBtnTextDanger: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
});
