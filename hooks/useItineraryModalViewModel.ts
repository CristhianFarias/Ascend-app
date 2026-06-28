import { useState } from "react";
import { Alert, LayoutAnimation } from "react-native";

import { getTodayKey } from "../store/ItineraryUtils";
import useGoalsStore, { ScheduleBlock } from "../store/useGoalsStore";

/**
 * ViewModel del modal de itinerario.
 * Mantiene aquí la generación temporal y guardado de la propuesta del día.
 */
export const useItineraryModalViewModel = (onClose: () => void) => {
  const settings = useGoalsStore((s) => s.settings);
  const externalEvents = useGoalsStore((s) => s.externalEvents);
  const generateScheduleProposal = useGoalsStore(
    (s) => s.generateScheduleProposal,
  );
  const setDailyScheduleForDate = useGoalsStore(
    (s) => s.setDailyScheduleForDate,
  );

  const [expanded, setExpanded] = useState<string | null>("itinerary");
  const [tempSchedule, setTempSchedule] = useState<ScheduleBlock[]>([]);
  const todayKey = getTodayKey();

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((current) => (current === section ? null : section));
  };

  const handleAutoOrganize = () => {
    const { proposal, warnings } = generateScheduleProposal(todayKey);
    setTempSchedule(proposal);

    if (warnings.length > 0) {
      Alert.alert("Aviso de Conflictos", warnings.join("\n"));
    }
  };

  const saveAndClose = () => {
    if (tempSchedule.length > 0) {
      setDailyScheduleForDate(todayKey, tempSchedule);
    }

    onClose();
  };

  return {
    settings,
    externalEvents,
    expanded,
    tempSchedule,
    toggleSection,
    handleAutoOrganize,
    saveAndClose,
  };
};
