import { useTheme } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Alert, AppState } from "react-native";

import {
  getTodayKey,
  timeStrToMinutes,
} from "../store/ItineraryUtils";
import { mergeScheduleBlocks } from "../store/scheduleMergeUtils";
import useGoalsStore, {
  ScheduleBlock,
  TimeBlock,
} from "../store/useGoalsStore";

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
  { q: "La acción es la clave fundamental para todo éxito.", a: "Pablo Picasso" },
];

/**
 * ViewModel de Inicio.
 * Concentra agenda, franjas, rollover y acciones del itinerario fuera del JSX.
 */
export const useIndexViewModel = () => {
  const todayKey = getTodayKey();
  const performDailyRollover = useGoalsStore((s) => s.performDailyRollover);
  const generateScheduleProposal = useGoalsStore(
    (s) => s.generateScheduleProposal,
  );
  const getExpandedStepsForBlock = useGoalsStore(
    (s) => s.getExpandedStepsForBlock,
  );
  const getGoalsList = useGoalsStore((s) => s.getGoalsList);
  const toggleStep = useGoalsStore((s) => s.toggleStep);
  const startFocus = useGoalsStore((s) => s.startFocus);
  const setDailyScheduleForDate = useGoalsStore(
    (s) => s.setDailyScheduleForDate,
  );
  const setAvailableTimeBlocks = useGoalsStore((s) => s.setAvailableTimeBlocks);
  const markTodayCompleteIfEligible = useGoalsStore(
    (s) => s.markTodayCompleteIfEligible,
  );
  const stats = useGoalsStore((s) => s.getGlobalStats());
  const summary = useGoalsStore((s) => s.getTodayItinerarySummary());
  const nextItem = useGoalsStore((s) => s.findNextItineraryItem());
  const storedAccent = useGoalsStore((s) => s.settings.accentColor);
  const availableTimeBlocks = useGoalsStore(
    (s) => s.settings.availableTimeBlocks,
  );
  const storedScheduleForToday = useGoalsStore(
    (s) => s.dailySchedulesByDate?.[todayKey],
  );
  const fallbackDailySchedule = useGoalsStore((s) => s.dailySchedule);
  const dailyScheduleFromStore = useMemo(
    () =>
      mergeScheduleBlocks(
        storedScheduleForToday && storedScheduleForToday.length > 0
          ? storedScheduleForToday
          : fallbackDailySchedule ?? [],
      ),
    [fallbackDailySchedule, storedScheduleForToday],
  );

  const { colors, dark } = useTheme();
  const bg = colors?.background ?? (dark ? "#0b1220" : "#fff");
  const card = colors?.card ?? (dark ? "#1f2937" : "#fff");
  const text = colors?.text ?? (dark ? "#f3f4f6" : "#0f172a");
  const subtext = colors?.border ?? (dark ? "#9ca3af" : "#6b7280");
  const border = colors?.border ?? (dark ? "#374151" : "#e5e7eb");
  const primary = colors?.primary ?? storedAccent ?? "#111";

  const [editMode, setEditMode] = useState(false);
  const [editableSchedule, setEditableSchedule] = useState<ScheduleBlock[]>(
    () => dailyScheduleFromStore ?? [],
  );
  const [franjasModalVisible, setFranjasModalVisible] = useState(false);
  const [localTimeBlocks, setLocalTimeBlocks] = useState<TimeBlock[]>(
    () => availableTimeBlocks ?? [],
  );
  const [blockEditorVisible, setBlockEditorVisible] = useState(false);
  const [blockDraft, setBlockDraft] = useState<ScheduleBlock | null>(null);

  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    [],
  );

  const dataToRender =
    (editMode ? editableSchedule : dailyScheduleFromStore) ?? [];

  useEffect(() => {
    if (!editMode) setEditableSchedule(dailyScheduleFromStore ?? []);
  }, [dailyScheduleFromStore, editMode]);

  useEffect(() => {
    setLocalTimeBlocks(availableTimeBlocks ?? []);
  }, [availableTimeBlocks]);

  useEffect(() => {
    try {
      performDailyRollover();
    } catch (e) {
      console.warn("performDailyRollover error", e);
    }

    const handler = (nextState: string) => {
      if (nextState !== "active") return;

      try {
        const res = performDailyRollover();
        if (res?.rolled && res?.archivedGoals?.length) {
          Alert.alert(
            "Algunas metas fueron archivadas",
            `${res.archivedGoals.length} metas con deadline pasado fueron archivadas.`,
          );
        }
      } catch (e) {
        console.warn("performDailyRollover on active error", e);
      }
    };

    const subscription = AppState.addEventListener
      ? AppState.addEventListener("change", handler)
      : undefined;

    return () => {
      if (subscription && typeof (subscription as any).remove === "function") {
        (subscription as any).remove();
        return;
      }

      try {
        const anyAppState = AppState as any;
        if (typeof anyAppState.removeEventListener === "function") {
          anyAppState.removeEventListener("change", handler);
        }
      } catch {
        // Compatibilidad con versiones antiguas de React Native.
      }
    };
  }, [performDailyRollover]);

  useEffect(() => {
    const cb = () => {
      if (editMode) {
        setEditMode(false);
        Alert.alert(
          "Se inició un nuevo día",
          "Se saldrá del modo edición para aplicar los cambios del día.",
        );
      }

      const schedule = useGoalsStore
        .getState()
        .getMergedScheduleForDate(todayKey);
      setEditableSchedule(schedule ?? []);
    };

    useGoalsStore.getState().on("daily.rollover", cb);
    return () => useGoalsStore.getState().off("daily.rollover", cb);
  }, [editMode, todayKey]);

  const addTimeBlockLocal = () =>
    setLocalTimeBlocks((state) => [
      ...(state ?? []),
      { start: "08:00", end: "09:00" },
    ]);

  const updateTimeBlockLocal = (
    index: number,
    key: "start" | "end",
    value: string,
  ) =>
    setLocalTimeBlocks((state) =>
      (state ?? []).map((block, i) =>
        i === index ? { ...block, [key]: value } : block,
      ),
    );

  const removeTimeBlockLocal = (index: number) =>
    setLocalTimeBlocks((state) => (state ?? []).filter((_, i) => i !== index));

  const applyScheduleProposal = () => {
    const { proposal, warnings } = generateScheduleProposal(todayKey);
    setDailyScheduleForDate(todayKey, proposal);
    setEditableSchedule(proposal);

    if (warnings && warnings.length) {
      Alert.alert("Advertencias", warnings.join("\n"));
    } else {
      Alert.alert("Itinerario guardado", "Propuesta aplicada.");
    }
  };

  const saveFranjas = (applyProposal = false) => {
    const cleaned: TimeBlock[] = (localTimeBlocks ?? [])
      .map((block) => ({
        start: block.start.slice(0, 5),
        end: block.end.slice(0, 5),
      }))
      .filter((block) => timeStrToMinutes(block.end) > timeStrToMinutes(block.start));

    if (cleaned.length === 0) {
      Alert.alert("Franjas inválidas", "Agrega al menos una franja válida.");
      return;
    }

    setAvailableTimeBlocks(cleaned);
    setLocalTimeBlocks(cleaned);
    setFranjasModalVisible(false);

    if (applyProposal) {
      applyScheduleProposal();
    } else {
      Alert.alert("Franjas guardadas", "Se actualizaron tus franjas disponibles.");
    }
  };

  const openBlockEditor = (block: ScheduleBlock) => {
    setBlockDraft({ ...block });
    setBlockEditorVisible(true);
  };

  const saveBlockDraft = () => {
    if (!blockDraft) return;

    const normalized: ScheduleBlock = {
      ...blockDraft,
      minutes: Math.max(
        0,
        timeStrToMinutes(blockDraft.end) - timeStrToMinutes(blockDraft.start),
      ),
    };

    setEditableSchedule((schedule) =>
      schedule.map((block) => (block.id === normalized.id ? normalized : block)),
    );
    setBlockDraft(normalized);
    setBlockEditorVisible(false);
  };

  const deleteBlock = (blockId: string) => {
    setEditableSchedule((schedule) =>
      schedule.filter((block) => block.id !== blockId),
    );
    setBlockEditorVisible(false);
  };

  const saveEditedSchedule = () => {
    setDailyScheduleForDate(todayKey, editableSchedule ?? []);
    setEditMode(false);
    Alert.alert("Itinerario guardado", "El nuevo orden ha sido aplicado.");
  };

  const cancelEditedSchedule = () => {
    setEditableSchedule(dailyScheduleFromStore ?? []);
    setEditMode(false);
    Alert.alert("Cancelado", "Se descartaron los cambios.");
  };

  const markTodayStrict = () => {
    const ok = markTodayCompleteIfEligible();
    Alert.alert(
      ok ? "¡Día marcado!" : "Aún no",
      ok
        ? "La racha se actualizó."
        : "Completa todos los pasos de las metas activas para marcar el día.",
    );
  };

  const markTodayFromFooter = () => {
    const success = markTodayCompleteIfEligible();
    Alert.alert(
      success ? "¡Día marcado!" : "Progreso insuficiente",
      success ? "Racha actualizada." : "Completa los pasos para marcar el día.",
    );
  };

  const startNextFocus = () => {
    if (!nextItem?.goalId) {
      Alert.alert(
        "Sin foco disponible",
        "No hay un paso pendiente para iniciar Focus.",
      );
      return;
    }

    startFocus(nextItem.goalId, nextItem.stepId);
  };

  return {
    todayKey,
    editMode,
    setEditMode,
    editableSchedule,
    setEditableSchedule,
    dataToRender,
    franjasModalVisible,
    setFranjasModalVisible,
    localTimeBlocks,
    blockEditorVisible,
    setBlockEditorVisible,
    blockDraft,
    setBlockDraft,
    quote,
    stats,
    summary,
    nextItem,
    getExpandedStepsForBlock,
    getGoalsList,
    toggleStep,
    startFocus,
    addTimeBlockLocal,
    updateTimeBlockLocal,
    removeTimeBlockLocal,
    saveFranjas,
    openBlockEditor,
    saveBlockDraft,
    deleteBlock,
    saveEditedSchedule,
    cancelEditedSchedule,
    applyScheduleProposal,
    markTodayStrict,
    markTodayFromFooter,
    startNextFocus,
    colors: { bg, card, text, subtext, border, primary },
    dark,
  };
};
