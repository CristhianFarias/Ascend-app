import { getTodayKey, timeStrToMinutes } from "./ItineraryUtils";
import { parseYYYYMMDD } from "./dateKeyUtils";
import type { ScheduleBlock } from "./goalTypes";
import {
  generateScheduleProposalFromGoals,
  validateScheduleOverload,
} from "./schedulePlanner";
import type { GoalsState } from "./storeTypes";

type StoreSet = (
  partial:
    | Partial<GoalsState>
    | GoalsState
    | ((state: GoalsState) => Partial<GoalsState> | GoalsState),
) => void;

type StoreGet = () => GoalsState;

type ScheduleSlice = Pick<
  GoalsState,
  | "setDailySchedule"
  | "setDailyScheduleForDate"
  | "getDailyScheduleForDate"
  | "getItinerary"
  | "generateScheduleProposal"
  | "validateOverload"
  | "updateScheduleBlock"
  | "removeScheduleBlock"
>;

/**
 * Acciones de agenda y planeación.
 * Centraliza los cambios sobre bloques diarios y propuestas de horario.
 */
export const createScheduleSlice = (
  set: StoreSet,
  get: StoreGet,
): ScheduleSlice => ({
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
      blocks.forEach((block) => out.push({ ...block }));
    }

    return out;
  },

  generateScheduleProposal: (date) => {
    try {
      const s = get();
      return generateScheduleProposalFromGoals(
        s.getGoalsList(),
        s.settings.availableTimeBlocks ?? [],
        date ?? getTodayKey(),
      );
    } catch (e) {
      console.warn("generateScheduleProposal error", e);
      return { proposal: [], warnings: ["Error generando propuesta"] };
    }
  },

  validateOverload: (date) => {
    try {
      const s = get();
      return validateScheduleOverload(
        s.getGoalsList(),
        s.settings.availableTimeBlocks ?? [],
        date ?? getTodayKey(),
      );
    } catch (e) {
      console.warn("validateOverload error", e);
      return { ok: true, warnings: [] };
    }
  },

  updateScheduleBlock: (blockId, newStart, newEnd) =>
    set((s) => ({
      dailySchedule: s.dailySchedule.map((block) =>
        block.id === blockId
          ? {
              ...block,
              start: newStart,
              end: newEnd,
              minutes: Math.abs(
                timeStrToMinutes(newEnd) - timeStrToMinutes(newStart),
              ),
            }
          : block,
      ),
      _version: s._version + 1,
    })),

  removeScheduleBlock: (blockId) =>
    set((s) => ({
      dailySchedule: s.dailySchedule.filter((block) => block.id !== blockId),
      _version: s._version + 1,
    })),
});
