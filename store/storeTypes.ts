import type { ItineraryItem } from "./ItineraryUtils";
import type {
  Conflict,
  FocusSession,
  Goal,
  GoalCategory,
  GoalPriority,
  GoalTemplate,
  GoalType,
  HeatmapItem,
  ScheduleBlock,
  Step,
  TimeBlock,
} from "./goalTypes";
import type { buildStats } from "./statsUtils";

/**
 * Contrato central del store.
 * Los slices implementan partes de esta interfaz sin depender del archivo principal.
 */
export type GoalsState = {
  goalsById: Record<string, Goal>;
  goalIds: string[];
  settings: {
    accentColor: string;
    availableTimeBlocks: TimeBlock[];
    dayStartTime: string;
    dayEndTime: string;
    theme: "light" | "dark" | "system";
    minimalMode: boolean;
  };
  externalEvents: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
  }>;
  dailyCompletionMap: Record<string, string[]>;
  storeVersion: number;
  _version: number;
  templates: GoalTemplate[];
  dailySchedule: ScheduleBlock[];
  dailySchedulesByDate: Record<string, ScheduleBlock[]>;
  hasFinishedOnboarding: boolean;
  focusSession: FocusSession | null;
  _events: Record<string, ((payload?: any) => void)[]>;
  globalStreak: number;
  bestStreak: number;
  lastRolloverDate?: string;

  /* Selectores derivados */
  getGoalsList: () => Goal[];
  getGoalsListMemo: () => Goal[];
  getActiveGoalsMemo: () => Goal[];
  getGoalById: (id: string) => Goal | undefined;
  getTemplatesByCategory: (c: GoalCategory) => GoalTemplate[];
  getCategoryMeta: (c: GoalCategory) => {
    icon: string;
    color: string;
    label?: string;
  };
  getGoalProgress: (id: string) => {
    total: number;
    completed: number;
    percent: number;
  };
  getTodayItinerary: () => ItineraryItem[];
  getTodayItineraryMemo: () => ItineraryItem[];
  getTodayItinerarySummary: () => {
    totalMinutes: number;
    completedMinutes: number;
    percentDone: number;
  };
  getExpandedStepsForBlock: (
    block: ScheduleBlock,
  ) => { step: Step; start: string; end: string }[];
  getMergedScheduleForDate: (date?: string) => ScheduleBlock[];
  reorderMergedScheduleForDate: (
    date: string,
    ordered: ScheduleBlock[],
  ) => ScheduleBlock[];
  findNextItineraryItem: () => ItineraryItem | null;
  getItineraryConflicts: () => Conflict[];
  getGlobalStats: () => ReturnType<typeof buildStats> & {
    recentDays: HeatmapItem[];
  };
  getHeatmapData: (range?: "week" | "month" | "all") => HeatmapItem[];
  areAllStepsCompleted: (goalId: string) => boolean;
  getCompletedGoalsForDate: (date: string) => string[];
  getStreakHistory: (
    range?: "week" | "month" | "all",
  ) => { date: string; streak: number }[];

  /* Acciones de metas y pasos */
  addGoalSafe: (partial: Partial<Goal>) => Goal;
  createGoalFromTemplate: (
    templateId: string,
    overrides?: Partial<Goal>,
  ) => Goal;
  createSmartGoal: (opts: {
    title?: string;
    description?: string;
    minutes?: number;
    templateId?: string;
    type?: GoalType;
    category?: GoalCategory;
    priority?: GoalPriority;
    overrides?: Partial<Goal>;
  }) => Goal;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addStep: (goalId: string, step: Omit<Step, "id">) => Step;
  updateStep: (goalId: string, stepId: string, data: Partial<Step>) => void;
  setStepsForGoal: (goalId: string, steps: Step[]) => void;
  deleteStep: (goalId: string, stepId: string) => void;
  toggleStep: (goalId: string, stepId: string) => void;
  reorderSteps: (goalId: string, steps: Step[]) => void;
  rescheduleStep: (goalId: string, stepId: string, time: string) => void;
  reorderItinerary: (fromIndex: number, toIndex: number) => void;

  markGoalCompletedToday: (goalId: string) => void;
  unmarkGoalCompletedToday: (goalId: string) => void;
  markTodayCompleteIfEligible: () => boolean;
  recalculateStreaks: () => void;

  startFocus: (
    goalId: string,
    stepId?: string,
    opts?: { seconds?: number; autoAdvance?: boolean; autoMark?: boolean },
  ) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  skipSetOrStep: () => void;
  tick: (now?: number) => void;
  finishFocus: () => void;

  on: (e: string, cb: (payload?: any) => void) => void;
  off: (e: string, cb: (payload?: any) => void) => void;
  emit: (e: string, payload?: any) => void;

  setAccentColor: (c: string) => void;
  setAvailableTimeBlocks: (blocks: TimeBlock[]) => void;
  setTheme: (mode: "light" | "dark" | "system") => void;
  setMinimalMode: (v: boolean) => void;
  completeOnboarding: () => void;
  isTodayMarked: () => boolean;
  markTodayComplete: () => void;
  resetAll: () => void;
  backupToJSON: () => string;
  restoreFromJSON: (json: string) => void;

  setDailySchedule: (blocks: ScheduleBlock[]) => void;
  setDailyScheduleForDate: (date: string, blocks: ScheduleBlock[]) => void;
  getDailyScheduleForDate: (date?: string) => ScheduleBlock[];
  getItinerary: (range: "day" | "week", date?: string) => ScheduleBlock[];
  generateScheduleProposal: (date: string) => {
    proposal: ScheduleBlock[];
    warnings: string[];
  };
  validateOverload: (date: string) => {
    ok: boolean;
    warnings: string[];
    deficitMinutes?: number;
  };
  updateScheduleBlock: (
    blockId: string,
    newStart: string,
    newEnd: string,
  ) => void;
  removeScheduleBlock: (blockId: string) => void;

  performDailyRollover: (today?: string) => {
    rolled: boolean;
    archivedGoals: string[];
  };
  rolloverIfNeeded: (today?: string) => {
    rolled: boolean;
    archivedGoals: string[];
  };
};
