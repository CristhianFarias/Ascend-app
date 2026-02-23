// src/components/FocusMode.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from "react-native";
import useGoalsStore from "../store/useGoalsStore";

/**
 * FocusMode
 * - Modal que observa focusSession en el store
 * - Muestra temporizador grande, paso actual, sets, botones
 * - Footer botones: Pausar/Reanudar / Saltar / Finalizar
 *
 * Uso: incluir <FocusMode /> en metas.tsx (UI pasiva)
 */

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  timer: {
    fontSize: 56,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
  },
  btn: {
    padding: 12,
    borderRadius: 10,
    minWidth: 110,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  btnPrimary: { backgroundColor: "#111" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});

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

  useEffect(() => {
    if (!focusSession) return;
    // request an interval to call tick every 1s
    const id = setInterval(() => {
      const n = Date.now();
      setNowTick(n);
      tick(n);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSession]);

  // vibrate on phase transitions (listen to events would be cleaner)
  useEffect(() => {
    if (!focusSession) return;
    // small vibration at start
    if (Platform.OS !== "web") Vibration.vibrate(50);
  }, [focusSession?.phase]);

  const visible = Boolean(focusSession);

  const currentStep = useMemo(() => {
    if (!focusSession) return null;
    const g = getGoalById(focusSession.goalId);
    if (!g) return null;
    return g.steps[focusSession.stepIndex] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSession?.goalId, focusSession?.stepIndex, nowTick]);

  if (!visible || !focusSession) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Modo Focus</Text>
          <Text style={styles.stepTitle}>{currentStep?.title ?? "Paso"}</Text>

          <Text style={styles.timer}>
            {secondsToMMSS(focusSession.remainingSeconds)}
          </Text>

          <View style={{ marginTop: 8 }}>
            <View style={styles.infoRow}>
              <Text>
                Set {focusSession.currentSet}/{focusSession.totalSets}
              </Text>
              <Text>Fase: {focusSession.phase}</Text>
              <Text>Paso {focusSession.stepIndex + 1}</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            {focusSession.running ? (
              <TouchableOpacity onPress={pauseFocus} style={[styles.btn]}>
                <Text>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={resumeFocus}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnPrimaryText}>Reanudar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={skipSetOrStep} style={styles.btn}>
              <Text>Saltar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // confirmar finalizacion
                finishFocus();
              }}
              style={styles.btn}
            >
              <Text>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
