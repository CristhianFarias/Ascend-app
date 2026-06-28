// src/store/useGoalsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createEventsSlice } from "./eventsSlice";
import { createFocusSlice } from "./focusSlice";
import { createGoalsSlice } from "./goalsSlice";
import { createInitialGoalsState } from "./initialState";
import { createProgressSlice } from "./progressSlice";
import { createScheduleSlice } from "./scheduleSlice";
import { createSelectorsSlice } from "./selectorsSlice";
import { createSettingsDataSlice } from "./settingsDataSlice";
import { STORE_VERSION } from "./storeDefaults";
import { migratePersistedState } from "./storeMigration";
import { selectPersistedState } from "./storePersistence";
import type { GoalsState } from "./storeTypes";

export type {
  Conflict,
  FocusSession,
  Goal,
  GoalCategory,
  GoalObjective,
  GoalPriority,
  GoalStatus,
  GoalTemplate,
  GoalType,
  HeatmapItem,
  RestStrategy,
  ScheduleBlock,
  Step,
  TemplateExercise,
  TemplateSession,
  TimeBlock,
  WorkoutEnvironment
} from "./goalTypes";

export { CATEGORY_META } from "./goalConstants";
export type { GoalsState } from "./storeTypes";

/* ============================
   STORE
   ============================ */
export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => {
      /* estado inicial */
      return {
        ...createInitialGoalsState(),
        ...createSelectorsSlice(set, get),
        ...createGoalsSlice(set, get),
        ...createScheduleSlice(set, get),
        ...createFocusSlice(set, get),
        ...createEventsSlice(),

        ...createSettingsDataSlice(set, get),
        ...createProgressSlice(set, get),
      };
    },
    {
      name: "ascend-store-v6",
      storage: createJSONStorage(() => AsyncStorage),
      version: STORE_VERSION,
      partialize: selectPersistedState,
      migrate: migratePersistedState,
    },
  ),
);

export default useGoalsStore;
