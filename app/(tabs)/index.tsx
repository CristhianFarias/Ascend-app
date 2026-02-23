// app/(tabs)/index.tsx
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppState,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
// Import corregido: default export para el store y tipos como named exports
import useGoalsStore, {
  Goal,
  ScheduleBlock,
  Step,
  TimeBlock,
} from "../../store/useGoalsStore";

/* ============================
   Helpers tiempo
   ============================ */
const timeStrToMinutes = (t: string) => {
  const [h = "0", m = "0"] = (t || "00:00").split(":");
  const hn = Number(h) || 0;
  const mn = Number(m) || 0;
  return hn * 60 + mn;
};
const minutesToTimeStr = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.max(0, mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

/* ============================
   Citas
   ============================ */
const QUOTES: { q: string; a: string }[] = [
  { q: "La disciplina es el puente entre metas y logros.", a: "Jim Rohn" },
  {
    q: "Somos lo que hacemos repetidamente. La excelencia, entonces, no es un acto, sino un hábito.",
    a: "Aristóteles",
  },
  {
    q: "No es porque las cosas sean difíciles que no nos atrevemos; es porque no nos atrevemos que son difíciles.",
    a: "Séneca",
  },
  {
    q: "La acción es la clave fundamental para todo éxito.",
    a: "Pablo Picasso",
  },
];

/* ============================
   Pantalla Index
   ============================ */
export default function IndexScreen(): React.ReactElement {
  const todayKey = getTodayKey();

  /* store selectors/acciones */
  // ahora importamos performDailyRollover y usamos correctamente el store por defecto
  const performDailyRollover = useGoalsStore((s) => s.performDailyRollover);
  const dailyScheduleFromStore = useGoalsStore(
    (s) => s.getDailyScheduleForDate(todayKey) ?? [],
  );
  const availableTimeBlocks = useGoalsStore(
    (s) => s.settings.availableTimeBlocks ?? [],
  );
  const generateScheduleProposal = useGoalsStore(
    (s) => s.generateScheduleProposal,
  );
  const getGoalsList = useGoalsStore((s) => s.getGoalsList);
  const toggleStep = useGoalsStore((s) => s.toggleStep);
  const startFocus = useGoalsStore((s) => s.startFocus);
  const stats = useGoalsStore((s) => s.getGlobalStats());
  const summary = useGoalsStore((s) => s.getTodayItinerarySummary());
  const storedAccent = useGoalsStore((s) => s.settings.accentColor);

  /* THEME */
  const { colors, dark } = useTheme();
  const bg = colors.background ?? (dark ? "#0b1220" : "#fff");
  const card = colors.card ?? (dark ? "#1f2937" : "#fff");
  const text = colors.text ?? (dark ? "#f3f4f6" : "#0f172a");
  const subtext = colors.border ?? (dark ? "#101010" : "#0c0d0d");
  const border = colors.border ?? (dark ? "rgb(18, 18, 19)" : "#f1f5f9");
  const primary = colors.primary ?? storedAccent ?? "#111";

  /* estado UI local */
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editableSchedule, setEditableSchedule] = useState<ScheduleBlock[]>(
    dailyScheduleFromStore,
  );

  const [franjasModalVisible, setFranjasModalVisible] = useState(false);
  const [localTimeBlocks, setLocalTimeBlocks] =
    useState<TimeBlock[]>(availableTimeBlocks);

  const [blockEditorVisible, setBlockEditorVisible] = useState(false);
  const [blockDraft, setBlockDraft] = useState<ScheduleBlock | null>(null);

  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    [],
  );

  /* sincronizar store -> local cuando no estemos en edición */
  useEffect(() => {
    if (!editMode) setEditableSchedule(dailyScheduleFromStore);
  }, [dailyScheduleFromStore, editMode]);

  useEffect(() => {
    setLocalTimeBlocks(availableTimeBlocks);
  }, [availableTimeBlocks]);

  /* ============================
     ROLLOVER DIARIO: ejecutar al montar y al volver del background
     ============================ */
  useEffect(() => {
    // chequeo inmediato al montar
    try {
      performDailyRollover();
    } catch (e) {
      console.warn("performDailyRollover error", e);
    }

    // handler para cuando app pasa a foreground
    const handler = (nextState: string) => {
      if (nextState === "active") {
        try {
          const res = performDailyRollover();
          if (res?.rolled && res?.archivedGoals?.length) {
            Alert.alert(
              "Algunas metas fueron archivadas",
              `${res.archivedGoals.length} metas con deadline pasado fueron archivadas.`,
            );
          } else if (res?.rolled) {
            // opcional: notificar sutilmente
            // Alert.alert("Nuevo día", "Tus metas se han reseteado para hoy.");
          }
        } catch (e) {
          console.warn("performDailyRollover on active error", e);
        }
      }
    };

    // registra el listener y guarda la subscription (RN moderno devuelve un object con .remove)
    const subscription = AppState.addEventListener
      ? AppState.addEventListener("change", handler)
      : undefined;

    return () => {
      // caso RN moderno: usa subscription.remove()
      if (subscription && typeof (subscription as any).remove === "function") {
        (subscription as any).remove();
        return;
      }

      // fallback seguro para RN antiguo (evitamos referencias directas en tipos)
      try {
        const anyAppState = AppState as any;
        if (typeof anyAppState.removeEventListener === "function") {
          anyAppState.removeEventListener("change", handler);
        }
      } catch (e) {
        // nada que hacer si no existe
      }
    };
  }, [performDailyRollover]);

  /* Suscribirse al evento 'daily.rollover' del store para forzar UI/alerts si se emite */
  useEffect(() => {
    const cb = (payload?: any) => {
      // payload: { date, archivedGoals }
      // si estamos editando forzamos que se salga a modo no edición (evita inconsistencias)
      if (editMode) {
        setEditMode(false);
        Alert.alert(
          "Se inició un nuevo día",
          "Se saldrá del modo edición para aplicar los cambios del día.",
        );
      }
      // sincronizar editableSchedule con store inmediatamente
      const ds = useGoalsStore
        .getState()
        .getDailyScheduleForDate(getTodayKey());
      setEditableSchedule(ds ?? []);
    };

    useGoalsStore.getState().on("daily.rollover", cb);
    return () => {
      useGoalsStore.getState().off("daily.rollover", cb);
    };
  }, [editMode]);

  /* ============================
      Franjas (UI only)
     ============================ */
  const addTimeBlockLocal = () =>
    setLocalTimeBlocks((s) => [...s, { start: "08:00", end: "09:00" }]);
  const updateTimeBlockLocal = (
    index: number,
    key: "start" | "end",
    value: string,
  ) =>
    setLocalTimeBlocks((s) =>
      s.map((b, i) => (i === index ? { ...b, [key]: value } : b)),
    );
  const removeTimeBlockLocal = (index: number) =>
    setLocalTimeBlocks((s) => s.filter((_, i) => i !== index));

  const saveFranjas = (applyProposal = false) => {
    const cleaned: TimeBlock[] = localTimeBlocks
      .map((b) => ({ start: b.start.slice(0, 5), end: b.end.slice(0, 5) }))
      .filter((b) => timeStrToMinutes(b.end) > timeStrToMinutes(b.start));

    if (cleaned.length === 0) {
      Alert.alert("Franjas inválidas", "Agrega al menos una franja válida.");
      return;
    }
    useGoalsStore.getState().setAvailableTimeBlocks(cleaned);
    setLocalTimeBlocks(cleaned);
    setFranjasModalVisible(false);

    if (applyProposal) {
      const { proposal, warnings } = generateScheduleProposal(todayKey);
      useGoalsStore.getState().setDailyScheduleForDate(todayKey, proposal);
      setEditableSchedule(proposal);
      if (warnings && warnings.length)
        Alert.alert("Advertencias", warnings.join("\n"));
      else
        Alert.alert("Itinerario generado", "Se aplicó la propuesta a tu día.");
    } else {
      Alert.alert(
        "Franjas guardadas",
        "Se actualizaron tus franjas disponibles.",
      );
    }
  };

  /* ============================
      Editor bloque
     ============================ */
  const openBlockEditor = (block: ScheduleBlock) => {
    setBlockDraft({ ...block });
    setBlockEditorVisible(true);
  };

  const applyBlockDraft = () => {
    if (!blockDraft) return;
    const newSched = editableSchedule.map((b) =>
      b.id === blockDraft.id ? blockDraft : b,
    );
    setEditableSchedule(newSched);
    setBlockEditorVisible(false);
  };

  const deleteBlock = (blockId: string) => {
    const after = editableSchedule.filter((b) => b.id !== blockId);
    setEditableSchedule(after);
    setBlockEditorVisible(false);
  };

  /* ============================
      Expandir bloque -> pasos comprimidos
     ============================ */
  const expandBlockToSteps = useCallback(
    (block: ScheduleBlock) => {
      const goals = getGoalsList();
      const goal = goals.find((g) => g.id === block.goalId);
      if (!goal) {
        if (block.stepId) {
          const stepSingle: Step = {
            id: block.stepId,
            title: block.goalTitle || "Paso",
            duration: block.minutes || 1,
            completed: false,
            order: 1,
          } as Step;
          return [{ step: stepSingle, start: block.start, end: block.end }];
        }
        return [];
      }

      const blockStartMin = timeStrToMinutes(block.start);
      const blockEndMin = timeStrToMinutes(block.end);
      const blockMinutes = Math.max(1, blockEndMin - blockStartMin);

      const candidates = [...(goal.steps || [])];
      if (candidates.length === 0) return [];

      const totalOriginal =
        candidates.reduce((a, b) => a + (b.duration || 0), 0) ||
        candidates.length;
      const scale =
        totalOriginal > blockMinutes ? blockMinutes / totalOriginal : 1;

      let cursor = blockStartMin;
      const out: { step: Step; start: string; end: string }[] = [];
      for (const st of candidates) {
        const origDur = Math.max(1, st.duration || 1);
        const assignedDur = Math.max(1, Math.round(origDur * scale));
        const endMin = Math.min(blockEndMin, cursor + assignedDur);
        out.push({
          step: st,
          start: minutesToTimeStr(cursor),
          end: minutesToTimeStr(endMin),
        });
        cursor = endMin;
        if (cursor >= blockEndMin) break;
      }
      return out;
    },
    [getGoalsList],
  );

  /* ============================
      Agrupar/combinar para UI
     ============================ */
  const scheduleForTodayRaw = editMode
    ? editableSchedule
    : dailyScheduleFromStore;
  const scheduleForToday = useMemo<ScheduleBlock[]>(() => {
    const groups: Record<string, ScheduleBlock[]> = {};
    const others: ScheduleBlock[] = [];

    for (const b of scheduleForTodayRaw) {
      if (b.id?.startsWith("combined-")) continue;
      if (b.goalId) {
        if (!groups[b.goalId]) groups[b.goalId] = [];
        groups[b.goalId].push(b);
      } else {
        others.push(b);
      }
    }

    const result: ScheduleBlock[] = [...others];

    for (const goalId of Object.keys(groups)) {
      const arr = groups[goalId];
      if (!arr || arr.length === 0) continue;
      const starts = arr.map((x) => timeStrToMinutes(x.start));
      const ends = arr.map((x) => timeStrToMinutes(x.end));
      const minStart = Math.min(...starts);
      const maxEnd = Math.max(...ends);
      const first = arr[0];

      // Bloque combinado visual
      result.push({
        id: `combined-${goalId}`,
        goalId,
        goalTitle: first.goalTitle ?? first.goalId ?? "",
        start: minutesToTimeStr(minStart),
        end: minutesToTimeStr(maxEnd),
        minutes: Math.max(1, Math.round(maxEnd - minStart)),
      } as ScheduleBlock);
    }

    // Ordenar por hora
    result.sort(
      (a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start),
    );
    return result;
  }, [scheduleForTodayRaw]);

  /* ============================
      Lógica de Reordenamiento (CORREGIDA)
     ============================ */
  const onDragEndLocal = useCallback(
    (data: ScheduleBlock[]) => {
      const flatReordered: ScheduleBlock[] = [];

      const rawMap = new Map<string, ScheduleBlock>();
      editableSchedule.forEach((b) => rawMap.set(b.id, b));

      const rawByGoal = new Map<string, ScheduleBlock[]>();
      editableSchedule.forEach((b) => {
        if (b.goalId) {
          const list = rawByGoal.get(b.goalId) || [];
          list.push(b);
          rawByGoal.set(b.goalId, list);
        }
      });

      data.forEach((item) => {
        if (item.id.startsWith("combined-") && item.goalId) {
          const originals = rawByGoal.get(item.goalId) || [];
          originals.sort(
            (a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start),
          );
          flatReordered.push(...originals);
        } else {
          const original = rawMap.get(item.id) || item;
          flatReordered.push(original);
        }
      });

      if (flatReordered.length > 0) {
        const allStarts = editableSchedule.map((b) =>
          timeStrToMinutes(b.start),
        );
        let cursorMinutes =
          allStarts.length > 0 ? Math.min(...allStarts) : 8 * 60;

        const recalculated = flatReordered.map((block) => {
          const duration =
            block.minutes ||
            timeStrToMinutes(block.end) - timeStrToMinutes(block.start) ||
            30;

          const newStart = minutesToTimeStr(cursorMinutes);
          const newEnd = minutesToTimeStr(cursorMinutes + duration);
          cursorMinutes += duration;
          return { ...block, start: newStart, end: newEnd, minutes: duration };
        });

        setEditableSchedule(recalculated);
      } else {
        setEditableSchedule([]);
      }
    },
    [editableSchedule],
  );

  /* ============================
      Guardar/Cancelar
     ============================ */
  const saveEditedSchedule = () => {
    useGoalsStore
      .getState()
      .setDailyScheduleForDate(todayKey, editableSchedule);
    setEditMode(false);
    Alert.alert("Itinerario guardado", "El nuevo orden ha sido aplicado.");
  };

  const cancelEditedSchedule = () => {
    setEditableSchedule(dailyScheduleFromStore);
    setEditMode(false);
    Alert.alert("Cancelado", "Se descartaron los cambios.");
  };

  /* ============================
      Componentes UI
     ============================ */
  const BlockRow = ({
    block,
    drag,
    isActive,
  }: {
    block: ScheduleBlock;
    drag?: () => void;
    isActive?: boolean;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const goal = getGoalsList().find((g) => g.id === block.goalId);
    const stepsAssigned = expandBlockToSteps(block);

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onLongPress={() => editMode && drag && drag()}
        onPress={() => !editMode && openBlockEditor(block)}
        style={[
          styles.blockCard,
          { backgroundColor: card, borderColor: border },
          isActive ? styles.blockActive : undefined,
        ]}
      >
        <View
          style={[
            styles.blockAccent,
            { backgroundColor: goal?.color ?? primary },
          ]}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.blockTitle, { color: text }]}
                numberOfLines={1}
              >
                {goal?.title ?? block.goalTitle ?? "Bloque libre"}
              </Text>
              <Text style={[styles.blockSub, { color: subtext }]}>
                {block.start} — {block.end} • {block.minutes} min{" "}
                {goal ? `• ${goal.steps?.length ?? 0} pasos` : ""}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {editMode ? (
                <TouchableOpacity
                  onPress={() => openBlockEditor(block)}
                  style={[
                    styles.smallGhostBtn,
                    { backgroundColor: card, borderColor: border },
                  ]}
                >
                  <Text style={{ fontWeight: "700", color: text }}>Editar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => startFocus(block.goalId, block.stepId)}
                  style={[styles.focusBtn, { backgroundColor: primary }]}
                >
                  <Text style={[styles.focusBtnText, { color: "#fff" }]}>
                    Focus
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setExpanded((v) => !v)}
            style={{ marginTop: 10 }}
          >
            {expanded ? (
              stepsAssigned.length === 0 ? (
                <Text style={styles.emptyText}>No hay pasos</Text>
              ) : (
                stepsAssigned.map(({ step, start, end }) => (
                  <View
                    key={step.id}
                    style={[styles.stepRow, { borderTopColor: border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepTitle, { color: text }]}>
                        {step.title}
                      </Text>
                      <Text style={[styles.stepSub, { color: subtext }]}>
                        {start} — {end} • {step.duration ?? 0}m
                      </Text>
                    </View>

                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleStep(block.goalId, step.id)}
                        style={[
                          styles.checkBtn,
                          {
                            backgroundColor: step.completed ? "#ecfdf5" : card,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color: step.completed ? "#065f46" : subtext,
                          }}
                        >
                          {step.completed ? "✓" : "○"}
                        </Text>
                      </TouchableOpacity>
                      {!editMode && (
                        <TouchableOpacity
                          onPress={() => startFocus(block.goalId, step.id)}
                          style={[
                            styles.smallFocus,
                            { backgroundColor: primary },
                          ]}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            F
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )
            ) : (
              <Text style={{ color: subtext }}>
                {stepsAssigned.length} pasos • Toca para ver
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  /* Header / Footer */
  const ListHeader = () => (
    <View style={{ padding: 18 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: subtext }]}>Buenos días</Text>
          <Text style={[styles.pageTitle, { color: text }]}>Inicio</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setFranjasModalVisible(true)}
            style={[
              styles.ghostBtn,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <Text style={{ fontWeight: "700", color: text }}>Franjas</Text>
          </TouchableOpacity>

          {!editMode ? (
            <TouchableOpacity
              onPress={() => setEditMode(true)}
              style={[
                styles.primaryButton,
                { marginLeft: 8, backgroundColor: primary },
              ]}
            >
              <Text style={styles.primaryButtonText}>Editar</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={saveEditedSchedule}
                style={[
                  styles.primaryButton,
                  { marginLeft: 8, backgroundColor: primary },
                ]}
              >
                <Text style={styles.primaryButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelEditedSchedule}
                style={[
                  styles.ghostBtn,
                  { marginLeft: 8, backgroundColor: card, borderColor: border },
                ]}
              >
                <Text style={{ fontWeight: "700", color: text }}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View
        style={[
          styles.quoteBox,
          { backgroundColor: card, borderColor: border },
        ]}
      >
        <View style={[styles.quoteBar, { backgroundColor: primary }]} />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.quoteText, { color: text }]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            “{quote.q}”
          </Text>
          <Text style={[styles.quoteAuthor, { color: subtext }]}>
            — {quote.a}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            const { proposal, warnings } = generateScheduleProposal(todayKey);
            useGoalsStore
              .getState()
              .setDailyScheduleForDate(todayKey, proposal);
            setEditableSchedule(proposal);
            if (warnings && warnings.length)
              Alert.alert("Advertencias", warnings.join("\n"));
            else Alert.alert("Itinerario guardado", "Propuesta aplicada.");
          }}
          style={[
            styles.primaryButton,
            { paddingHorizontal: 18, backgroundColor: primary },
          ]}
        >
          <Text style={styles.primaryButtonText}>Acomodar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListFooter = () => (
    <View style={[styles.footer, { borderTopColor: border }]}>
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: "800", color: text }}>
          Progreso: {summary?.percentDone ?? 0}%
        </Text>
        <Text style={{ color: subtext }}>
          Pasos completados: {stats?.completedSteps ?? 0}
        </Text>
      </View>

      {!editMode && (
        <TouchableOpacity
          onPress={() => {
            const success = useGoalsStore
              .getState()
              .markTodayCompleteIfEligible();
            if (!success)
              Alert.alert(
                "Progreso insuficiente",
                "Completa los pasos para marcar el día.",
              );
            else Alert.alert("¡Día marcado!", "Racha actualizada.");
          }}
          style={[
            styles.primaryButton,
            { alignSelf: "stretch", backgroundColor: primary },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {(summary?.percentDone ?? 0) >= 100
              ? "✓ Marcar día"
              : "Completa tus pasos"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const dataToRender = scheduleForToday;

  /* Render */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      {editMode ? (
        <DraggableFlatList
          data={dataToRender}
          keyExtractor={(item: ScheduleBlock) => item.id}
          renderItem={({ item, drag, isActive }: any) => (
            <BlockRow block={item} drag={drag} isActive={!!isActive} />
          )}
          onDragEnd={({ data }: { data: ScheduleBlock[] }) =>
            onDragEndLocal(data)
          }
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          containerStyle={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={dataToRender}
          keyExtractor={(item: ScheduleBlock) => item.id}
          renderItem={({ item }: { item: ScheduleBlock }) => (
            <BlockRow block={item} />
          )}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
        />
      )}

      {/* Modal franjas */}
      <Modal
        visible={franjasModalVisible}
        animationType="slide"
        onRequestClose={() => setFranjasModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
          <View style={{ padding: 18, flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 12,
                color: text,
              }}
            >
              Franjas disponibles
            </Text>

            <FlatList
              data={localTimeBlocks}
              keyExtractor={(_, i) => `tb-${i}`}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.franjaCard,
                    { backgroundColor: card, borderColor: border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontWeight: "800", color: text, fontSize: 14 }}
                    >
                      Franja {index + 1}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 12,
                        alignItems: "center",
                      }}
                    >
                      <TextInput
                        value={item.start}
                        onChangeText={(v) =>
                          updateTimeBlockLocal(index, "start", v)
                        }
                        style={[
                          styles.timeInputLarge,
                          {
                            backgroundColor: card,
                            color: text,
                            borderColor: border,
                          },
                        ]}
                        placeholder="HH:MM"
                        placeholderTextColor={subtext}
                      />
                      <Text
                        style={{
                          marginHorizontal: 10,
                          color: subtext,
                          fontWeight: "700",
                        }}
                      >
                        →
                      </Text>
                      <TextInput
                        value={item.end}
                        onChangeText={(v) =>
                          updateTimeBlockLocal(index, "end", v)
                        }
                        style={[
                          styles.timeInputLarge,
                          {
                            backgroundColor: card,
                            color: text,
                            borderColor: border,
                          },
                        ]}
                        placeholder="HH:MM"
                        placeholderTextColor={subtext}
                      />
                    </View>
                    <Text style={{ color: subtext, marginTop: 10 }}>
                      Duración:{" "}
                      {Math.max(
                        0,
                        timeStrToMinutes(item.end) -
                          timeStrToMinutes(item.start),
                      )}{" "}
                      min
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeTimeBlockLocal(index)}
                    style={styles.removeFranjaBtn}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800" }}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              ListEmptyComponent={
                <Text
                  style={{ color: subtext, textAlign: "center", marginTop: 12 }}
                >
                  No hay franjas definidas
                </Text>
              }
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 18,
              }}
            >
              <TouchableOpacity
                onPress={addTimeBlockLocal}
                style={[
                  styles.ghostBtn,
                  { backgroundColor: card, borderColor: border },
                ]}
              >
                <Text style={{ fontWeight: "800", color: text }}>
                  + Agregar franja
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  onPress={() => setFranjasModalVisible(false)}
                  style={[
                    styles.ghostBtn,
                    {
                      marginRight: 8,
                      backgroundColor: card,
                      borderColor: border,
                    },
                  ]}
                >
                  <Text style={{ fontWeight: "700", color: text }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => saveFranjas(true)}
                  style={[styles.primaryButton, { backgroundColor: primary }]}
                >
                  <Text style={styles.primaryButtonText}>
                    Guardar y Acomodar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal editar bloque */}
      <Modal
        visible={blockEditorVisible}
        animationType="slide"
        onRequestClose={() => setBlockEditorVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
          <View style={{ padding: 18, flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 12,
                color: text,
              }}
            >
              Editar bloque
            </Text>
            {blockDraft ? (
              <>
                <Text style={{ fontWeight: "700", color: text }}>Inicio</Text>
                <TextInput
                  value={blockDraft.start}
                  onChangeText={(v) =>
                    setBlockDraft((d) => (d ? { ...d, start: v } : d))
                  }
                  style={[
                    styles.timeInput,
                    { backgroundColor: card, borderColor: border, color: text },
                  ]}
                  placeholderTextColor={subtext}
                />
                <Text style={{ fontWeight: "700", color: text, marginTop: 12 }}>
                  Fin
                </Text>
                <TextInput
                  value={blockDraft.end}
                  onChangeText={(v) =>
                    setBlockDraft((d) => (d ? { ...d, end: v } : d))
                  }
                  style={[
                    styles.timeInput,
                    { backgroundColor: card, borderColor: border, color: text },
                  ]}
                  placeholderTextColor={subtext}
                />

                <Text style={{ fontWeight: "700", color: text, marginTop: 12 }}>
                  Asignar meta (opcional)
                </Text>
                <FlatList
                  data={getGoalsList()}
                  keyExtractor={(g: Goal) => g.id}
                  style={{ maxHeight: 220, marginTop: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() =>
                        setBlockDraft((d) =>
                          d
                            ? { ...d, goalId: item.id, goalTitle: item.title }
                            : d,
                        )
                      }
                      style={[
                        styles.goalPickItem,
                        blockDraft.goalId === item.id
                          ? {
                              borderColor: primary,
                              backgroundColor: dark ? "#0b1220" : "#f8fafc",
                            }
                          : { backgroundColor: card, borderColor: border },
                      ]}
                    >
                      <Text style={{ fontWeight: "700", color: text }}>
                        {item.title}
                      </Text>
                      <Text style={{ color: subtext, marginTop: 4 }}>
                        {item.category}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 14,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setBlockEditorVisible(false)}
                    style={[
                      styles.ghostBtn,
                      { backgroundColor: card, borderColor: border },
                    ]}
                  >
                    <Text style={{ fontWeight: "700", color: text }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (blockDraft) {
                        const nb: ScheduleBlock = {
                          ...blockDraft,
                          minutes: Math.max(
                            0,
                            timeStrToMinutes(blockDraft.end) -
                              timeStrToMinutes(blockDraft.start),
                          ),
                        };
                        setBlockDraft(nb);
                        applyBlockDraft();
                      }
                    }}
                    style={[styles.primaryButton, { backgroundColor: primary }]}
                  >
                    <Text style={styles.primaryButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (blockDraft) deleteBlock(blockDraft.id);
                    }}
                    style={styles.dangerBtn}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ============================
   Estilos (base; colores se inyectan inline)
   ============================ */
/* (mantengo exactamente tus estilos originales para no romper la UI) */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { color: "#6b7280", fontSize: 13 },
  pageTitle: { fontSize: 28, fontWeight: "900", color: "#0f172a" },

  quoteBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.06 : 0,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteBar: {
    width: 6,
    height: "100%",
    borderRadius: 6,
    marginRight: 12,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: "italic",
    fontWeight: "700",
  },
  quoteAuthor: { marginTop: 8, fontSize: 13 },

  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800" },

  ghostBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallGhostBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  // Blocks
  blockCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.03 : 0,
    shadowRadius: 6,
    elevation: 1,
  },

  blockActive: {
    opacity: 0.95,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    transform: [{ scale: 1.05 }],
    zIndex: 999,
  },

  blockAccent: { width: 6, height: 56, borderRadius: 8, marginRight: 12 },
  blockTitle: { fontWeight: "800", fontSize: 16 },
  blockSub: { marginTop: 6 },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    marginTop: 10,
  },
  stepTitle: { fontWeight: "700" },
  stepSub: { fontSize: 12 },

  checkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  focusBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  focusBtnText: {
    fontWeight: "700",
    fontSize: 12,
  },
  emptyText: {
    fontStyle: "italic",
    color: "#9ca3af",
    fontSize: 12,
  },
  smallFocus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  footer: {
    padding: 18,
    paddingBottom: 40,
    borderTopWidth: 1,
  },

  // Modal Franjas Styles
  franjaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeInputLarge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    width: 80,
    textAlign: "center",
    fontWeight: "700",
    borderWidth: 1,
  },
  removeFranjaBtn: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    marginLeft: 12,
  },

  // Modal Editor Styles
  timeInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginTop: 6,
  },
  goalPickItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  dangerBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
