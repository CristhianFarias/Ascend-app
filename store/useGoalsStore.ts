// src/store/useGoalsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildItineraryForDate,
  computeItinerarySummary,
  detectConflicts,
  findNextItem,
  ItineraryItem,
  normalizeItinerary,
} from "./ItineraryUtils";

/* ============================
   TIPOS y CONSTANTES
   ============================ */
export type GoalCategory =
  | "Fitness"
  | "Estudio"
  | "Carrera"
  | "Salud"
  | "Finanzas"
  | "Otro";
export type GoalPriority = "1" | "2" | "3";
export type GoalType = "Proyecto" | "Meta" | "Hábito";
export type TimeBlock = { start: string; end: string };

export type Step = {
  id: string;
  title: string;
  duration: number; // minutes
  completed: boolean;
  order: number;
  scheduledTime?: string;
  sets?: number;
  reps?: number;
  rest?: number;
  session?: string;
  metadata?: Record<string, any>;
};

export type GoalStatus = "active" | "paused" | "completed" | "archived";

export type TemplateExercise = {
  name: string;
  sets?: number;
  reps?: number;
  rest?: number;
  duration?: number; // minutes
  order?: number;
  muscles?: string[];
  metadata?: Record<string, any>;
};

export type TemplateSession = {
  name: string;
  exercises: TemplateExercise[];
  order?: number;
};

export type GoalTemplate = {
  id: string;
  name: string;
  category: GoalCategory;
  description?: string;
  color?: string;
  icon?: string;
  frequencyPerWeek?: number;
  muscleGroups?: string[];
  estimatedMinutes?: number;
  defaultScheduleMode?: "dailySame" | "weeklyPlan" | "rotating";
  defaultPlan?: TemplateSession[];
  defaultPriority?: GoalPriority;
  defaultType?: GoalType;
  metadata?: Record<string, any>;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  type: GoalType;
  color: string;
  icon?: string;
  deadline?: string;
  status: GoalStatus;
  scheduleMode: "dailySame" | "weeklyPlan" | "rotating";
  templateId?: string;
  timeBlocks?: TimeBlock[];
  steps: Step[];
  plan?: TemplateSession[];
  totalFocusMinutes: number;
  order: number;
  muscleGroups?: string[];
  completedDates?: string[];
};

type FocusPhase = "work" | "rest" | "idle";

export type FocusSession = {
  running: boolean;
  goalId: string;
  stepId: string;
  stepIndex: number;
  phase: FocusPhase;
  remainingSeconds: number;
  currentSet: number;
  totalSets: number;
  restSeconds: number;
  startedAt: number;
  lastTickAt: number;
  autoAdvance?: boolean;
  autoMark?: boolean;
};

export type ScheduleBlock = {
  id: string;
  goalId: string;
  goalTitle: string;
  start: string;
  end: string;
  minutes: number;
  stepId?: string;
};

export type HeatmapItem = {
  date: string;
  completed: boolean;
  count: number;
  goalIds: string[];
};

type Conflict = {
  item1: ItineraryItem;
  item2: ItineraryItem;
  overlapMinutes: number;
};

/* ============================
   META CATEGORÍAS
   ============================ */
export const CATEGORY_META: Record<
  GoalCategory,
  { icon: string; color: string; label?: string }
> = {
  Fitness: { icon: "activity", color: "#ef4444", label: "Fitness" },
  Estudio: { icon: "book-open", color: "#06b6d4", label: "Estudio" },
  Carrera: { icon: "briefcase", color: "#f59e0b", label: "Carrera" },
  Salud: { icon: "heart", color: "#10b981", label: "Salud" },
  Finanzas: { icon: "dollar-sign", color: "#8b5cf6", label: "Finanzas" },
  Otro: { icon: "target", color: "#6b7280", label: "Otro" },
};

/* ============================
   HELPERS PUROS
   ============================ */
const genId = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const timeStrToMinutes = (t: string) => {
  const [h = "0", m = "0"] = (t || "").split(":");
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parseYYYYMMDD = (s: string) => {
  const [y, m, d] = (s || "").split("-").map((x) => Number(x) || 0);
  return new Date(y, m - 1, d);
};

/* ============================
   NORMALIZERS
   ============================ */
const normalizeStep = (raw: any): Step => ({
  id: typeof raw?.id === "string" && raw.id ? raw.id : genId("step-"),
  title: typeof raw?.title === "string" ? raw.title : "Paso",
  duration: typeof raw?.duration === "number" ? raw.duration : 5,
  completed: Boolean(raw?.completed),
  order: typeof raw?.order === "number" ? raw.order : 0,
  scheduledTime:
    typeof raw?.scheduledTime === "string" ? raw.scheduledTime : undefined,
  sets: typeof raw?.sets === "number" ? raw.sets : undefined,
  reps: typeof raw?.reps === "number" ? raw.reps : undefined,
  rest: typeof raw?.rest === "number" ? raw.rest : undefined,
  session: typeof raw?.session === "string" ? raw.session : undefined,
  metadata: typeof raw?.metadata === "object" ? raw.metadata : {},
});

const normalizeGoal = (raw: any): Goal => {
  const gid = typeof raw?.id === "string" && raw.id ? raw.id : genId("goal-");
  const steps = Array.isArray(raw?.steps) ? raw.steps.map(normalizeStep) : [];
  const cat = (raw?.category as GoalCategory) ?? "Otro";
  const meta = CATEGORY_META[cat] ?? CATEGORY_META["Otro"];
  return {
    id: gid,
    title: typeof raw?.title === "string" ? raw.title : "Nueva Meta",
    description:
      typeof raw?.description === "string" ? raw.description : undefined,
    category: cat,
    priority: (raw?.priority as GoalPriority) ?? "2",
    type: (raw?.type as GoalType) ?? "Meta",
    color: typeof raw?.color === "string" ? raw.color : meta.color,
    icon: typeof raw?.icon === "string" ? raw.icon : meta.icon,
    deadline: typeof raw?.deadline === "string" ? raw.deadline : undefined,
    status: (raw?.status as GoalStatus) ?? "active",
    scheduleMode: (raw?.scheduleMode as Goal["scheduleMode"]) ?? "dailySame",
    templateId:
      typeof raw?.templateId === "string" ? raw.templateId : undefined,
    timeBlocks: Array.isArray(raw?.timeBlocks) ? raw.timeBlocks : undefined,
    steps,
    plan: Array.isArray(raw?.plan) ? raw.plan : undefined,
    totalFocusMinutes:
      typeof raw?.totalFocusMinutes === "number"
        ? raw.totalFocusMinutes
        : steps.reduce((a: number, b: Step) => a + (b.duration || 0), 0),
    order: typeof raw?.order === "number" ? raw.order : Date.now(),
    muscleGroups: Array.isArray(raw?.muscleGroups)
      ? raw.muscleGroups
      : undefined,
    completedDates: Array.isArray(raw?.completedDates)
      ? raw.completedDates
      : [],
  };
};

/* ============================
   INTERFACE DEL STORE
   ============================ */
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
  lastRolloverDate?: string; // <-- Nueva propiedad

  /* Selectors */
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

  /* CRUD y acciones */
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

  /* NUEVO: rollover diario */
  performDailyRollover: (today?: string) => {
    rolled: boolean;
    archivedGoals: string[];
  };
  rolloverIfNeeded: (today?: string) => {
    rolled: boolean;
    archivedGoals: string[];
  };
};

/* ============================
   eventsBus (fuera del estado)
   ============================ */
const eventsBus: Record<string, ((payload?: any) => void)[]> = {};
function emitEvent(e: string, payload?: any) {
  (eventsBus[e] || []).forEach((cb) => {
    try {
      cb(payload);
    } catch (err) {
      console.warn("event cb error", err);
    }
  });
}

/* ============================
   STORE
   ============================ */
export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => {
      const calculateStreaks = (s: GoalsState) => {
        const map = s.dailyCompletionMap || {};
        const dates = Object.keys(map).sort();
        const activeGoals = s.goalIds
          .map((id) => s.goalsById[id])
          .filter(
            (g): g is Goal =>
              !!g && g.status === "active" && g.steps.length > 0,
          )
          .map((g) => g.id);

        if (activeGoals.length === 0) return { globalStreak: 0, bestStreak: 0 };

        const dateHasAllActive = (dstr: string) => {
          const arr = map[dstr] ?? [];
          return activeGoals.every((id) => arr.includes(id));
        };

        let best = 0;
        if (dates.length > 0) {
          let i = 0;
          while (i < dates.length) {
            if (!dateHasAllActive(dates[i])) {
              i++;
              continue;
            }
            let j = i;
            while (j + 1 < dates.length) {
              const next = parseYYYYMMDD(dates[j]);
              next.setDate(next.getDate() + 1);
              const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
              if (nextStr === dates[j + 1] && dateHasAllActive(dates[j + 1]))
                j++;
              else break;
            }
            best = Math.max(best, j - i + 1);
            i = j + 1;
          }
        }

        // current streak
        let curr = 0;
        let d = new Date();
        while (true) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (!dateHasAllActive(key)) break;
          curr++;
          d.setDate(d.getDate() - 1);
        }

        return {
          globalStreak: curr,
          bestStreak: Math.max(s.bestStreak || 0, best),
        };
      };

      /* estado inicial */
      return {
        goalsById: {},
        goalIds: [],
        settings: {
          accentColor: "#f59e0b",
          availableTimeBlocks: [
            { start: "08:00", end: "12:00" },
            { start: "17:00", end: "20:00" },
          ],
          dayStartTime: "08:00",
          dayEndTime: "22:00",
          theme: "system",
          minimalMode: false,
        },
        externalEvents: [
          { id: "1", title: "Cita Médica", start: "10:00", end: "11:00" },
          { id: "2", title: "Reunión Trabajo", start: "15:00", end: "16:00" },
        ],
        dailyCompletionMap: {},
        storeVersion: 6,
        _version: 0,
        templates: [],
        dailySchedule: [],
        dailySchedulesByDate: {},
        hasFinishedOnboarding: false,
        focusSession: null,
        _events: {},
        globalStreak: 0,
        bestStreak: 0,
        lastRolloverDate: undefined,

        /* SELECTORES (memoizados por _version) */
        getGoalsList: () => {
          const s = get();
          return s.goalIds.map((id) => s.goalsById[id]).filter(Boolean);
        },

        getGoalsListMemo: (() => {
          let cacheVersion = -1;
          let cacheValue: Goal[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            cacheValue = s.goalIds.map((id) => s.goalsById[id]).filter(Boolean);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getActiveGoalsMemo: (() => {
          let cacheVersion = -1;
          let cacheValue: Goal[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            cacheValue = s
              .getGoalsListMemo()
              .filter((g) => g.status === "active");
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getGoalById: (id: string) => get().goalsById[id],

        getTemplatesByCategory: (c: GoalCategory) =>
          get().templates.filter((t) => t.category === c),

        getCategoryMeta: (c: GoalCategory) =>
          CATEGORY_META[c] ?? CATEGORY_META["Otro"],

        getGoalProgress: (id: string) => {
          const g = get().goalsById[id];
          if (!g) return { total: 0, completed: 0, percent: 0 };
          const total = g.steps.length;
          const completed = g.steps.filter((s) => s.completed).length;
          return {
            total,
            completed,
            percent: total === 0 ? 0 : Math.round((completed / total) * 100),
          };
        },

        getTodayItinerary: () => {
          const s = get();
          const raw: Partial<ItineraryItem>[] = (
            s.dailySchedule && s.dailySchedule.length > 0
              ? s.dailySchedule
              : buildItineraryForDate(s.getActiveGoalsMemo(), new Date())
          ) as any;
          const norm = normalizeItinerary(raw);
          const annotated = norm.map((it) => {
            const meta = { ...(it.metadata || {}) };
            if (it.stepId && it.goalId) {
              const g = s.goalsById[it.goalId];
              const st = g?.steps?.find((x) => x.id === it.stepId);
              meta.completed = Boolean(st?.completed);
            } else {
              meta.completed = Boolean(it.metadata?.completed);
            }
            if (!it.color && it.goalId) {
              const g = s.goalsById[it.goalId];
              if (g) it.color = g.color;
            }
            return { ...it, metadata: meta };
          });
          return annotated;
        },

        getTodayItineraryMemo: (() => {
          let cacheVersion = -1;
          let cacheValue: ItineraryItem[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            cacheValue = s.getTodayItinerary();
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getTodayItinerarySummary: (() => {
          let cacheVersion = -1;
          let cacheValue = {
            totalMinutes: 0,
            completedMinutes: 0,
            percentDone: 0,
          };
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            const items = s.getTodayItineraryMemo();
            cacheValue = computeItinerarySummary(items);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        findNextItineraryItem: (() => {
          let cacheVersion = -1;
          let cacheValue: ItineraryItem | null = null;
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            const items = s.getTodayItineraryMemo();
            cacheValue = findNextItem(items);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getItineraryConflicts: (() => {
          let cacheVersion = -1;
          let cacheValue: Conflict[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            const items = s.getTodayItineraryMemo();
            cacheValue = detectConflicts(items);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getGlobalStats: (() => {
          let cacheVersion = -1;
          let cacheValue: any = null;
          return () => {
            const s = get();
            if (s._version === cacheVersion && cacheValue) return cacheValue;
            const base = buildStats(
              s.getGoalsListMemo(),
              s.globalStreak ?? 0,
              s.bestStreak ?? 0,
            );
            const recentDays = s.getHeatmapData("week");
            cacheValue = { ...base, recentDays };
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getHeatmapData: (range = "month") => {
          const s = get();
          const daysBack = range === "week" ? 7 : range === "month" ? 30 : 365;
          const result: HeatmapItem[] = [];
          const today = new Date();
          for (let i = daysBack - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const goalIds = s.dailyCompletionMap[key] ?? [];
            result.push({
              date: key,
              completed: goalIds.length > 0,
              count: goalIds.length,
              goalIds,
            });
          }
          return result;
        },

        areAllStepsCompleted: (goalId: string) => {
          const g = get().goalsById[goalId];
          if (!g) return false;
          if (!g.steps || g.steps.length === 0) return false;
          return g.steps.every((s) => s.completed);
        },

        getCompletedGoalsForDate: (date: string) =>
          get().dailyCompletionMap[date] ?? [],

        getStreakHistory: (() => {
          const caches: Record<
            string,
            { version: number; value: { date: string; streak: number }[] }
          > = {};
          return (range: "week" | "month" | "all" = "month") => {
            const s = get();
            const key = range;
            if (!caches[key]) caches[key] = { version: -1, value: [] };
            const cache = caches[key];
            if (s._version === cache.version) return cache.value;
            const daysBack =
              range === "week" ? 7 : range === "month" ? 30 : 365;
            const today = new Date();
            const history: { date: string; streak: number }[] = [];
            const map = s.dailyCompletionMap || {};
            const activeGoals = s.goalIds
              .map((id) => s.goalsById[id])
              .filter((g) => g && g.status === "active" && g.steps.length > 0)
              .map((g) => g.id);

            if (activeGoals.length === 0) {
              cache.value = history;
              cache.version = s._version;
              return history;
            }

            const dateHasAllActive = (dstr: string) => {
              const arr = map[dstr] ?? [];
              return activeGoals.every((id) => arr.includes(id));
            };

            for (let i = daysBack - 1; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const keyDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              let streak = 0;
              let checkDate = new Date(d);
              while (true) {
                const checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
                if (dateHasAllActive(checkKey)) {
                  streak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  break;
                }
              }
              history.push({ date: keyDate, streak });
            }
            cache.value = history.reverse();
            cache.version = s._version;
            return cache.value;
          };
        })(),

        /* GOALS CRUD */
        addGoalSafe: (partial) => {
          const g = normalizeGoal(partial || {});
          set((s) => ({
            goalsById: { ...s.goalsById, [g.id]: g },
            goalIds: [...s.goalIds, g.id],
            _version: s._version + 1,
          }));
          return g;
        },

        createGoalFromTemplate: (templateId, overrides) => {
          const tpl = get().templates.find((t) => t.id === templateId);
          if (!tpl) {
            const emptyGoal = normalizeGoal(overrides || {});
            set((s) => ({
              goalsById: { ...s.goalsById, [emptyGoal.id]: emptyGoal },
              goalIds: [...s.goalIds, emptyGoal.id],
              _version: s._version + 1,
            }));
            return emptyGoal;
          }
          const plan = tpl.defaultPlan ?? [];
          const steps: Step[] = [];
          plan.forEach((session) => {
            session.exercises.forEach((ex) => {
              steps.push({
                id: genId("step-"),
                title: ex.name ?? "Paso",
                duration: typeof ex.duration === "number" ? ex.duration : 5,
                completed: false,
                order: steps.length + 1,
                sets: typeof ex.sets === "number" ? ex.sets : undefined,
                reps: typeof ex.reps === "number" ? ex.reps : undefined,
                rest: typeof ex.rest === "number" ? ex.rest : undefined,
                session: session.name,
                metadata: ex.metadata ?? {},
              });
            });
          });
          const newGoal: Goal = {
            id: genId("goal-"),
            title: overrides?.title ?? tpl.name ?? "Nueva Meta",
            description: overrides?.description ?? tpl.description ?? "",
            category:
              (overrides?.category as GoalCategory) ?? tpl.category ?? "Otro",
            priority:
              (overrides?.priority as GoalPriority) ??
              tpl.defaultPriority ??
              "2",
            type: (overrides?.type as GoalType) ?? tpl.defaultType ?? "Meta",
            color:
              (overrides?.color ??
                tpl.color ??
                CATEGORY_META[tpl.category]?.color) ||
              "#6b7280",
            icon:
              (overrides?.icon ??
                tpl.icon ??
                CATEGORY_META[tpl.category]?.icon) ||
              "icon",
            deadline: overrides?.deadline,
            status: overrides?.status ?? "active",
            scheduleMode:
              overrides?.scheduleMode ?? tpl.defaultScheduleMode ?? "dailySame",
            templateId,
            timeBlocks: overrides?.timeBlocks ?? undefined,
            steps,
            plan,
            totalFocusMinutes: steps.reduce((a, b) => a + (b.duration || 0), 0),
            order: overrides?.order ?? get().goalIds.length + 1,
            muscleGroups: tpl.muscleGroups ?? undefined,
            completedDates: [],
          };
          set((s) => ({
            goalsById: { ...s.goalsById, [newGoal.id]: newGoal },
            goalIds: [...s.goalIds, newGoal.id],
            _version: s._version + 1,
          }));
          emitEvent("goal.createdSmart", { goal: newGoal });
          return newGoal;
        },

        createSmartGoal: ({
          title,
          description = "",
          minutes = 50,
          templateId,
          type,
          category,
          priority,
          overrides,
        }) => {
          if (templateId)
            return get().createGoalFromTemplate(templateId, overrides);
          const blocks: Step[] = [];
          let remaining = Math.max(0, Math.floor(minutes || 0));
          let order = 1;
          while (remaining > 0) {
            const work = Math.min(25, remaining);
            blocks.push({
              id: genId("step-"),
              title: `Pomodoro ${order}`,
              duration: work,
              completed: false,
              order: blocks.length + 1,
            });
            remaining -= work;
            if (remaining <= 0) break;
            const br = 5;
            blocks.push({
              id: genId("step-"),
              title: `Descanso ${order}`,
              duration: br,
              completed: false,
              order: blocks.length + 1,
            });
            order++;
          }
          const newGoal: Goal = {
            id: genId("goal-"),
            title: title ?? "Meta Inteligente",
            description,
            category: (category as GoalCategory) ?? "Otro",
            priority: (priority as GoalPriority) ?? "2",
            type: (type as GoalType) ?? "Hábito",
            color:
              overrides?.color ??
              CATEGORY_META[(category as GoalCategory) ?? "Otro"].color,
            icon:
              overrides?.icon ??
              CATEGORY_META[(category as GoalCategory) ?? "Otro"].icon,
            status: "active",
            scheduleMode: "dailySame",
            steps: blocks.map((b, i) => ({ ...b, order: i + 1 })),
            plan: undefined,
            totalFocusMinutes: blocks.reduce(
              (a, b) => a + (b.duration || 0),
              0,
            ),
            order: get().goalIds.length + 1,
            completedDates: [],
          };
          set((s) => ({
            goalsById: { ...s.goalsById, [newGoal.id]: newGoal },
            goalIds: [...s.goalIds, newGoal.id],
            _version: s._version + 1,
          }));
          emitEvent("goal.createdSmart", { goal: newGoal });
          return newGoal;
        },

        updateGoal: (id, data) => {
          set((s) => {
            const existing = s.goalsById[id];
            if (!existing) return s;
            const merged = normalizeGoal({ ...existing, ...data });
            return {
              goalsById: { ...s.goalsById, [id]: merged },
              _version: s._version + 1,
            };
          });
        },

        deleteGoal: (id) => {
          set((s) => {
            const map = { ...s.goalsById };
            delete map[id];
            return {
              goalsById: map,
              goalIds: s.goalIds.filter((g) => g !== id),
              _version: s._version + 1,
            };
          });
        },

        /* STEPS */
        addStep: (goalId, stepData) => {
          const step: Step = { ...stepData, id: genId("step-") };
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            return {
              goalsById: {
                ...s.goalsById,
                [goalId]: {
                  ...g,
                  steps: [...g.steps, step],
                  totalFocusMinutes:
                    (g.totalFocusMinutes || 0) + (step.duration || 0),
                },
              },
              _version: s._version + 1,
            };
          });
          emitEvent("step.added", { goalId, step });
          return step;
        },

        updateStep: (goalId, stepId, data) => {
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            const steps = g.steps.map((st) =>
              st.id === stepId ? { ...st, ...data } : st,
            );
            const updated = {
              ...g,
              steps,
              totalFocusMinutes: steps.reduce(
                (acc, x) => acc + (x.duration || 0),
                0,
              ),
            };
            return {
              goalsById: { ...s.goalsById, [goalId]: updated },
              _version: s._version + 1,
            };
          });
          emitEvent("step.updated", { goalId, stepId, data });
        },

        deleteStep: (goalId, stepId) => {
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            const steps = g.steps.filter((st) => st.id !== stepId);
            return {
              goalsById: { ...s.goalsById, [goalId]: { ...g, steps } },
              _version: s._version + 1,
            };
          });
          emitEvent("step.deleted", { goalId, stepId });
        },

        toggleStep: (goalId, stepId) => {
          const wasAll = get().areAllStepsCompleted(goalId);
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            const steps = g.steps.map((st) =>
              st.id === stepId ? { ...st, completed: !st.completed } : st,
            );
            const updatedGoal = { ...g, steps };
            const nowAll =
              updatedGoal.steps.length > 0 &&
              updatedGoal.steps.every((st) => st.completed);
            const today = getTodayKey();
            let additional: Partial<GoalsState> = {};
            if (nowAll && !g.completedDates?.includes(today)) {
              const map = { ...(s.dailyCompletionMap || {}) };
              const todayArr = map[today]
                ? Array.from(new Set([...map[today], goalId]))
                : [goalId];
              map[today] = todayArr;
              const updatedCompletedDates = Array.from(
                new Set([...(g.completedDates ?? []), today]),
              );
              additional = {
                dailyCompletionMap: map,
                goalsById: {
                  ...s.goalsById,
                  [goalId]: {
                    ...updatedGoal,
                    completedDates: updatedCompletedDates,
                  },
                },
              };
            } else if (!nowAll && g.completedDates?.includes(today)) {
              const map = { ...(s.dailyCompletionMap || {}) };
              const arr = (map[today] ?? []).filter((id) => id !== goalId);
              if (arr.length === 0) delete map[today];
              else map[today] = arr;
              const updatedCompletedDates = (g.completedDates ?? []).filter(
                (d) => d !== today,
              );
              additional = {
                dailyCompletionMap: map,
                goalsById: {
                  ...s.goalsById,
                  [goalId]: {
                    ...updatedGoal,
                    completedDates: updatedCompletedDates,
                  },
                },
              };
            }
            const tempS = {
              ...s,
              goalsById: { ...s.goalsById, [goalId]: updatedGoal },
              _version: s._version + 1,
              ...additional,
            };
            const streaks = calculateStreaks(tempS as GoalsState);
            return {
              goalsById: { ...s.goalsById, [goalId]: updatedGoal },
              _version: s._version + 1,
              ...additional,
              ...streaks,
            };
          });
          emitEvent("step.toggled", { goalId, stepId });
          emitEvent("itinerary.changed");
          const nowAll = get().areAllStepsCompleted(goalId);
          if (!wasAll && nowAll) emitEvent("goal.markedToday", { goalId });
          if (wasAll && !nowAll) emitEvent("goal.unmarkedToday", { goalId });
        },

        reorderSteps: (goalId, steps) =>
          set((s) => ({
            goalsById: {
              ...s.goalsById,
              [goalId]: { ...s.goalsById[goalId], steps },
            },
            _version: s._version + 1,
          })),

        rescheduleStep: (goalId, stepId, time) => {
          get().updateStep(goalId, stepId, { scheduledTime: time });
          emitEvent("itinerary.changed");
        },

        reorderItinerary: (fromIndex, toIndex) => {
          set((s) => {
            const items = [...s.dailySchedule];
            const [moved] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, moved);
            return { dailySchedule: items, _version: s._version + 1 };
          });
          emitEvent("itinerary.changed");
        },

        setStepsForGoal: (goalId, steps) => {
          const normalized = steps.map(normalizeStep);
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            const updated = {
              ...g,
              steps: normalized,
              totalFocusMinutes: normalized.reduce(
                (acc, x) => acc + (x.duration || 0),
                0,
              ),
            };
            return {
              goalsById: { ...s.goalsById, [goalId]: updated },
              _version: s._version + 1,
            };
          });
        },

        /* SCHEDULING */
        setDailySchedule: (blocks) =>
          set((s) => ({ dailySchedule: blocks, _version: s._version + 1 })),

        setDailyScheduleForDate: (date, blocks) =>
          set((s) => ({
            dailySchedulesByDate: {
              ...(s.dailySchedulesByDate || {}),
              [date]: blocks,
            },
            _version: s._version + 1,
          })),

        getDailyScheduleForDate: (date) => {
          const key = date ?? getTodayKey();
          const s = get();
          return (
            (s.dailySchedulesByDate && s.dailySchedulesByDate[key]) ||
            s.dailySchedule ||
            []
          );
        },

        getItinerary: (range, date) => {
          const s = get();
          if (range === "day") return s.getDailyScheduleForDate(date);
          const start = date ? parseYYYYMMDD(date) : new Date();
          const out: ScheduleBlock[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const blocks = s.dailySchedulesByDate?.[key] ?? [];
            blocks.forEach((b) => out.push({ ...b }));
          }
          return out;
        },

        generateScheduleProposal: (date) => {
          try {
            const s = get();
            const available = s.settings.availableTimeBlocks ?? [];
            type Slot = {
              startMin: number;
              endMin: number;
              cursor: number;
              remaining: number;
            };
            const slots: Slot[] = available
              .map((b) => {
                const startMin = timeStrToMinutes(b.start);
                const endMin = timeStrToMinutes(b.end);
                if (endMin <= startMin) return null;
                return {
                  startMin,
                  endMin,
                  cursor: startMin,
                  remaining: endMin - startMin,
                };
              })
              .filter(Boolean) as Slot[];

            const goals = get().getGoalsList();
            type PendingStep = {
              goalId: string;
              goalTitle: string;
              goalPriority: GoalPriority;
              goalOrder: number;
              stepId: string;
              stepOrder: number;
              duration: number;
              deadline?: string | undefined;
            };
            const pendingSteps: PendingStep[] = [];
            goals.forEach((g) => {
              if (g.status !== "active") return;
              g.steps.forEach((st) => {
                if (!st.completed) {
                  pendingSteps.push({
                    goalId: g.id,
                    goalTitle: g.title,
                    goalPriority: g.priority,
                    goalOrder: g.order,
                    stepId: st.id,
                    stepOrder: st.order,
                    duration: st.duration || 0,
                    deadline: g.deadline,
                  });
                }
              });
            });

            const totalAvailable = slots.reduce((a, b) => a + b.remaining, 0);
            const totalRequired = pendingSteps.reduce(
              (a, b) => a + b.duration,
              0,
            );
            const warnings: string[] = [];
            if (totalRequired > totalAvailable) {
              warnings.push(
                `Tareas requieren ${totalRequired} min pero solo hay ${totalAvailable} min disponibles.`,
              );
            }

            pendingSteps.sort((a: PendingStep, b: PendingStep) => {
              const pa = Number(a.goalPriority);
              const pb = Number(b.goalPriority);
              if (pa !== pb) return pa - pb;
              if (a.deadline && b.deadline)
                return (
                  new Date(a.deadline).getTime() -
                  new Date(b.deadline).getTime()
                );
              if (a.deadline) return -1;
              if (b.deadline) return 1;
              if (a.goalOrder !== b.goalOrder) return a.goalOrder - b.goalOrder;
              return a.stepOrder - b.stepOrder;
            });

            const proposal: ScheduleBlock[] = [];
            for (const step of pendingSteps) {
              let placed = false;
              for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                if (slot.remaining >= step.duration) {
                  const startMin = slot.cursor;
                  const endMin = slot.cursor + step.duration;
                  // protección para que no quiebre el cálculo
                  if (endMin <= slot.endMin) {
                    proposal.push({
                      id: genId("sb-"),
                      goalId: step.goalId,
                      goalTitle: step.goalTitle,
                      start: minutesToTimeStr(startMin),
                      end: minutesToTimeStr(endMin),
                      minutes: step.duration,
                      stepId: step.stepId,
                    });
                    slot.cursor = endMin;
                    slot.remaining = Math.max(0, slot.endMin - slot.cursor);
                    placed = true;
                    break;
                  }
                }
              }
              if (!placed) {
                warnings.push(
                  `No se pudo ubicar paso ${step.goalTitle} (${step.duration}m).`,
                );
              }
            }
            return { proposal, warnings };
          } catch (e) {
            console.warn("generateScheduleProposal error", e);
            return { proposal: [], warnings: ["Error generando propuesta"] };
          }
        },

        validateOverload: (date) => {
          try {
            const s = get();
            const available = s.settings.availableTimeBlocks ?? [];
            const slotsMinutes = available.reduce((acc, b) => {
              const st = timeStrToMinutes(b.start);
              const ed = timeStrToMinutes(b.end);
              return acc + Math.max(0, ed - st);
            }, 0);
            const goals = s.getGoalsList();
            const pendingMinutes = goals.reduce((acc, g) => {
              if (g.status !== "active") return acc;
              const gPending = g.steps
                .filter((st) => !st.completed)
                .reduce((a, b) => a + (b.duration || 0), 0);
              return acc + gPending;
            }, 0);
            const ok = pendingMinutes <= slotsMinutes;
            const warnings: string[] = [];
            let deficit: number | undefined = undefined;
            if (!ok) {
              deficit = pendingMinutes - slotsMinutes;
              warnings.push(
                `Falta ${deficit} minutos. Se priorizarán metas con prioridad más alta.`,
              );
            }
            return { ok, warnings, deficitMinutes: deficit };
          } catch (e) {
            console.warn("validateOverload error", e);
            return { ok: true, warnings: [] };
          }
        },

        updateScheduleBlock: (blockId, newStart, newEnd) =>
          set((s) => ({
            dailySchedule: s.dailySchedule.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    start: newStart,
                    end: newEnd,
                    minutes: Math.abs(
                      timeStrToMinutes(newEnd) - timeStrToMinutes(newStart),
                    ),
                  }
                : b,
            ),
            _version: s._version + 1,
          })),

        removeScheduleBlock: (blockId) =>
          set((s) => ({
            dailySchedule: s.dailySchedule.filter((b) => b.id !== blockId),
            _version: s._version + 1,
          })),

        /* FOCUS ENGINE */
        startFocus: (goalId, stepId, opts) => {
          const s = get();
          const g = s.goalsById[goalId];
          if (!g) return;
          let startIndex = 0;
          if (stepId) startIndex = g.steps.findIndex((x) => x.id === stepId);
          else startIndex = g.steps.findIndex((x) => !x.completed);
          if (startIndex === -1) return;
          const step = g.steps[startIndex];
          const totalSets = step.sets ?? 1;
          const restSeconds = step.rest ?? 60;
          const remainingSeconds = Math.max(
            1,
            opts?.seconds ?? step.duration * 60,
          );
          const now = Date.now();
          const session: FocusSession = {
            running: true,
            goalId,
            stepId: step.id,
            stepIndex: startIndex,
            phase: "work",
            remainingSeconds,
            currentSet: 1,
            totalSets,
            restSeconds,
            startedAt: now,
            lastTickAt: now,
            autoAdvance: opts?.autoAdvance ?? true,
            autoMark: opts?.autoMark ?? true,
          };
          set(() => ({ focusSession: session, _version: get()._version + 1 }));
          emitEvent("focus.started", { goalId, stepId: step.id });
        },

        pauseFocus: () => {
          set((s) =>
            s.focusSession
              ? {
                  focusSession: { ...s.focusSession, running: false },
                  _version: s._version + 1,
                }
              : {},
          );
          emitEvent("focus.paused");
        },

        resumeFocus: () => {
          set((s) =>
            s.focusSession
              ? {
                  focusSession: {
                    ...s.focusSession,
                    running: true,
                    lastTickAt: Date.now(),
                  },
                  _version: s._version + 1,
                }
              : {},
          );
          emitEvent("focus.resumed");
        },

        skipSetOrStep: () => {
          const s = get();
          const fs = s.focusSession;
          if (!fs) return;
          set((st) => ({
            focusSession: st.focusSession
              ? { ...st.focusSession, remainingSeconds: 0 }
              : null,
            _version: st._version + 1,
          }));
          get().tick(Date.now());
        },

        tick: (now = Date.now()) => {
          const s = get();
          let fs = s.focusSession;
          if (!fs || !fs.running) return;
          let delta = Math.max(
            0,
            Math.floor((now - (fs.lastTickAt || now)) / 1000),
          );
          if (delta <= 0) return;

          let localFS: FocusSession | null = { ...fs };
          const safeGetCurrentStep = () => {
            const gg = get().goalsById[localFS!.goalId];
            if (!gg) return null;
            return gg.steps[localFS!.stepIndex] ?? null;
          };

          while (delta > 0 && localFS) {
            if (!localFS.running) break;
            if (delta <= localFS.remainingSeconds) {
              localFS.remainingSeconds = localFS.remainingSeconds - delta;
              delta = 0;
              localFS.lastTickAt = now;
              break;
            } else {
              delta = delta - localFS.remainingSeconds;
              localFS.remainingSeconds = 0;
              const currentStep = safeGetCurrentStep();
              if (!currentStep) {
                localFS = null;
                break;
              }
              if (localFS.phase === "work") {
                if (localFS.currentSet < localFS.totalSets) {
                  if ((localFS.restSeconds ?? 0) > 0) {
                    localFS.phase = "rest";
                    localFS.remainingSeconds = localFS.restSeconds;
                  } else {
                    localFS.currentSet = localFS.currentSet + 1;
                    localFS.phase = "work";
                    localFS.remainingSeconds = (currentStep.duration || 1) * 60;
                  }
                } else {
                  get().updateStep(localFS.goalId, localFS.stepId, {
                    completed: true,
                  });
                  emitEvent("focus.step.completed", {
                    goalId: localFS.goalId,
                    stepId: localFS.stepId,
                  });
                  const goal = get().goalsById[localFS.goalId];
                  if (!goal) {
                    localFS = null;
                    break;
                  }
                  const nextIdx = goal.steps.findIndex(
                    (st, i) => i > localFS!.stepIndex && !st.completed,
                  );
                  if (nextIdx !== -1 && localFS.autoAdvance) {
                    const nextStep = goal.steps[nextIdx];
                    localFS.stepIndex = nextIdx;
                    localFS.stepId = nextStep.id;
                    localFS.phase = "work";
                    localFS.currentSet = 1;
                    localFS.totalSets = nextStep.sets ?? 1;
                    localFS.restSeconds = nextStep.rest ?? 60;
                    localFS.remainingSeconds = (nextStep.duration || 1) * 60;
                  } else {
                    const allDone = goal.steps.every((st) => st.completed);
                    if (allDone) {
                      if (localFS.autoMark)
                        get().markGoalCompletedToday(localFS.goalId);
                      emitEvent("focus.goal.completed", {
                        goalId: localFS.goalId,
                      });
                    }
                    localFS = null;
                    break;
                  }
                }
              } else if (localFS.phase === "rest") {
                localFS.currentSet = localFS.currentSet + 1;
                localFS.phase = "work";
                const cs = safeGetCurrentStep();
                localFS.remainingSeconds = (cs?.duration ?? 1) * 60;
              } else {
                localFS = null;
                break;
              }
            }
          }

          if (!localFS) {
            set((st) => ({ focusSession: null, _version: st._version + 1 }));
            emitEvent("focus.finished");
            return;
          } else {
            localFS.lastTickAt = now;
            set((st) => ({ focusSession: localFS, _version: st._version + 1 }));
          }
        },

        finishFocus: () => {
          const s = get();
          if (!s.focusSession) return;
          set(() => ({ focusSession: null }));
          emitEvent("focus.finished");
        },

        /* EVENTS y utilidades */
        on: (e, cb) => {
          if (!eventsBus[e]) eventsBus[e] = [];
          eventsBus[e].push(cb);
        },

        off: (e, cb) => {
          eventsBus[e] = (eventsBus[e] || []).filter((c) => c !== cb);
        },

        emit: (e, payload) => emitEvent(e, payload),

        setAccentColor: (c) =>
          set((s) => ({
            settings: { ...s.settings, accentColor: c },
            _version: s._version + 1,
          })),

        setAvailableTimeBlocks: (blocks) =>
          set((s) => ({
            settings: { ...s.settings, availableTimeBlocks: blocks },
            _version: s._version + 1,
          })),

        setTheme: (mode) =>
          set((s) => ({
            settings: { ...s.settings, theme: mode },
            _version: s._version + 1,
          })),
        setMinimalMode: (minimalMode) =>
          set((s) => ({
            settings: { ...s.settings, minimalMode },
            _version: s._version + 1,
          })),

        completeOnboarding: () =>
          set((s) => ({
            hasFinishedOnboarding: true,
            _version: s._version + 1,
          })),

        isTodayMarked: () => {
          const today = getTodayKey();
          const arr = get().dailyCompletionMap[today] ?? [];
          return arr.length > 0;
        },

        markTodayComplete: () => get().markTodayCompleteIfEligible(),

        resetAll: () =>
          set(() => ({
            goalsById: {},
            goalIds: [],
            dailySchedule: [],
            dailySchedulesByDate: {},
            dailyCompletionMap: {},
            _version: 0,
            focusSession: null,
            globalStreak: 0,
            bestStreak: 0,
          })),

        backupToJSON: () =>
          JSON.stringify({
            storeVersion: get().storeVersion,
            goalsById: get().goalsById,
            goalIds: get().goalIds,
            settings: get().settings,
            dailyCompletionMap: get().dailyCompletionMap,
          }),

        restoreFromJSON: (json) => {
          try {
            const parsed = JSON.parse(json);
            if (!parsed) return;
            const safeGoalsById: Record<string, Goal> = {};
            if (parsed.goalsById && typeof parsed.goalsById === "object") {
              Object.keys(parsed.goalsById).forEach((k) => {
                safeGoalsById[k] = normalizeGoal(parsed.goalsById[k]);
              });
            }
            set(() => ({
              goalsById: safeGoalsById,
              goalIds: Array.isArray(parsed.goalIds)
                ? parsed.goalIds
                : Object.keys(safeGoalsById),
              settings: parsed.settings ?? get().settings,
              dailySchedulesByDate: parsed.dailySchedulesByDate ?? {},
              dailyCompletionMap: parsed.dailyCompletionMap ?? {},
              _version: Date.now(),
            }));
          } catch (e) {
            console.warn("restoreFromJSON error", e);
          }
        },

        markGoalCompletedToday: (goalId: string) => {
          const today = getTodayKey();
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g || g.completedDates?.includes(today)) return s;
            const map = { ...s.dailyCompletionMap };
            map[today] = Array.from(new Set([...(map[today] || []), goalId]));
            const newCompletedDates = Array.from(
              new Set([...(g.completedDates || []), today]),
            );
            const newGoalsById = {
              ...s.goalsById,
              [goalId]: { ...g, completedDates: newCompletedDates },
            };
            const newS = {
              ...s,
              dailyCompletionMap: map,
              goalsById: newGoalsById,
              _version: s._version + 1,
            };
            return { ...newS, ...calculateStreaks(newS as GoalsState) };
          });
          emitEvent("goal.markedToday", { goalId });
        },

        unmarkGoalCompletedToday: (goalId: string) => {
          const today = getTodayKey();
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g || !g.completedDates?.includes(today)) return s;
            const map = { ...s.dailyCompletionMap };
            map[today] = (map[today] || []).filter((id) => id !== goalId);
            if (map[today].length === 0) delete map[today];
            const newCompletedDates = (g.completedDates || []).filter(
              (d) => d !== today,
            );
            const newGoalsById = {
              ...s.goalsById,
              [goalId]: { ...g, completedDates: newCompletedDates },
            };
            const newS = {
              ...s,
              dailyCompletionMap: map,
              goalsById: newGoalsById,
              _version: s._version + 1,
            };
            return { ...newS, ...calculateStreaks(newS as GoalsState) };
          });
          emitEvent("goal.unmarkedToday", { goalId });
        },

        markTodayCompleteIfEligible: () => {
          const activeGoals = get().getActiveGoalsMemo();
          const allEligible = activeGoals.every((g) =>
            get().areAllStepsCompleted(g.id),
          );
          if (allEligible) {
            activeGoals.forEach((g) => get().markGoalCompletedToday(g.id));
            return true;
          }
          return false;
        },

        recalculateStreaks: () => {
          set((s) => ({ ...s, ...calculateStreaks(s) }));
        },

        /* ============================
           ROLLOVER DIARIO
           - Resetea pasos completados al comenzar un nuevo día
           - Recalcula rachas
           - Archiva metas cuya deadline ya pasó
           ============================ */
        performDailyRollover: (today?: string) => {
          const todayKey = today ?? getTodayKey();
          const s = get();
          if (s.lastRolloverDate === todayKey) {
            return { rolled: false, archivedGoals: [] };
          }

          const archivedGoals: string[] = [];
          const updatedGoalsById: Record<string, Goal> = { ...s.goalsById };

          Object.keys(updatedGoalsById).forEach((gid) => {
            const g = updatedGoalsById[gid];
            if (!g) return;
            // Si tiene deadline y ya pasó (deadline < today), archivamos la meta
            if (g.deadline) {
              const dl = parseYYYYMMDD(g.deadline);
              const tdate = parseYYYYMMDD(todayKey);
              // si deadline es anterior al día actual -> se considera pasada
              if (dl.getTime() < tdate.getTime()) {
                // archivamos
                updatedGoalsById[gid] = { ...g, status: "archived" };
                archivedGoals.push(gid);
                return;
              }
            }
            // Si la meta está activa -> reseteamos pasos para el nuevo día
            if (
              g.status === "active" &&
              Array.isArray(g.steps) &&
              g.steps.length > 0
            ) {
              const resetSteps = g.steps.map((st) =>
                // Dejamos completed: false para empezar el día
                ({ ...st, completed: false }),
              );
              updatedGoalsById[gid] = {
                ...g,
                steps: resetSteps,
              };
            }
          });

          const newState: Partial<GoalsState> = {
            goalsById: updatedGoalsById,
            lastRolloverDate: todayKey,
            _version: s._version + 1,
          };

          const streaks = calculateStreaks({
            ...(s as any),
            ...newState,
          } as GoalsState);

          set((prev) => ({
            ...prev,
            ...newState,
            ...streaks,
          }));

          emitEvent("daily.rollover", { date: todayKey, archivedGoals });
          emitEvent("itinerary.changed");

          return { rolled: true, archivedGoals };
        },

        rolloverIfNeeded: (today?: string) => get().performDailyRollover(today),
      };
    },
    {
      name: "ascend-store-v6",
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      migrate: (persistedState) => {
        const state = (persistedState as any)?.state ?? persistedState;
        if (!state) return persistedState;
        const migrated: any = { ...state };
        if (
          Array.isArray(state.goals) &&
          (!state.goalsById || Object.keys(state.goalsById).length === 0)
        ) {
          const byId: Record<string, Goal> = {};
          const ids: string[] = [];
          (state.goals as any[]).forEach((gRaw) => {
            const g = normalizeGoal(gRaw);
            byId[g.id] = g;
            ids.push(g.id);
          });
          migrated.goalsById = byId;
          migrated.goalIds = ids;
        }
        if (migrated.goalsById) {
          Object.keys(migrated.goalsById).forEach((k) => {
            const g = migrated.goalsById[k];
            g.steps = Array.isArray(g.steps) ? g.steps.map(normalizeStep) : [];
            g.completedDates = Array.isArray(g.completedDates)
              ? g.completedDates
              : [];
          });
        }
        if (typeof migrated.globalStreak === "undefined")
          migrated.globalStreak = 0;
        if (typeof migrated.bestStreak === "undefined") migrated.bestStreak = 0;
        // asegurar settings si vienen incompletos en migraciones antiguas
        migrated.settings = migrated.settings ?? {
          accentColor: "#f59e0b",
          availableTimeBlocks: [
            { start: "08:00", end: "12:00" },
            { start: "17:00", end: "20:00" },
          ],
          dayStartTime: "08:00",
          dayEndTime: "22:00",
          theme: "system",
          minimalMode: false,
        };
        if (!migrated.settings.theme) migrated.settings.theme = "system";
        // asegurar lastRolloverDate si no existe
        if (typeof migrated.lastRolloverDate === "undefined")
          migrated.lastRolloverDate = undefined;
        migrated.storeVersion = 6;
        return migrated;
      },
    },
  ),
);

export default useGoalsStore;

/* ============================
   UTIL: buildStats
   ============================ */
function buildStats(goals: Goal[], globalStreak: number, bestStreak: number) {
  const totalGoals = goals.length;
  const activeGoals = goals.filter(
    (g) => g.status === "active" && g.steps.length > 0,
  ).length;
  const totalSteps = goals.reduce((acc, g) => acc + g.steps.length, 0);
  const completedSteps = goals.reduce(
    (acc, g) => acc + g.steps.filter((s) => s.completed).length,
    0,
  );
  const totalMinutes = goals.reduce(
    (acc, g) => acc + g.steps.reduce((b, s) => b + (s.duration || 0), 0),
    0,
  );
  const totalFocusMinutes = goals.reduce(
    (acc, g) => acc + (g.totalFocusMinutes || 0),
    0,
  );
  const consistency =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  return {
    totalGoals,
    activeGoals,
    completedSteps,
    totalSteps,
    totalMinutes,
    totalFocusMinutes,
    consistency,
    globalStreak,
    bestStreak,
  };
}
