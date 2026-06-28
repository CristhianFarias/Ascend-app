import { getTodayKey, minutesToTimeStr, timeStrToMinutes } from "./ItineraryUtils";
import type { Goal, ScheduleBlock, Step } from "./goalTypes";

/**
 * Expande un bloque visible a pasos con horarios estimados.
 * Si el bloque es más corto que la suma original, escala las duraciones.
 */
export function expandStepsForBlock(
  block: ScheduleBlock,
  goal?: Goal,
): { step: Step; start: string; end: string }[] {
  if (!goal) {
    if (!block.stepId) return [];

    return [
      {
        step: {
          id: block.stepId,
          title: block.goalTitle || "Paso",
          duration: block.minutes || 1,
          completed: false,
          order: 1,
        },
        start: block.start,
        end: block.end,
      },
    ];
  }

  const blockStartMin = timeStrToMinutes(block.start);
  const blockEndMin = timeStrToMinutes(block.end);
  const blockMinutes = Math.max(1, blockEndMin - blockStartMin);
  const candidates = [...(goal.steps || [])];
  if (candidates.length === 0) return [];

  const totalOriginal =
    candidates.reduce((acc, step) => acc + (step.duration || 0), 0) ||
    candidates.length;
  const scale = totalOriginal > blockMinutes ? blockMinutes / totalOriginal : 1;

  let cursor = blockStartMin;
  const expanded: { step: Step; start: string; end: string }[] = [];

  for (const step of candidates) {
    const originalDuration = Math.max(1, step.duration || 1);
    const assignedDuration = Math.max(1, Math.round(originalDuration * scale));
    const endMin = Math.min(blockEndMin, cursor + assignedDuration);

    expanded.push({
      step,
      start: minutesToTimeStr(cursor),
      end: minutesToTimeStr(endMin),
    });

    cursor = endMin;
    if (cursor >= blockEndMin) break;
  }

  return expanded;
}

/**
 * Agrupa bloques reales por meta para mostrarlos como un bloque compacto.
 * Esto solo afecta la vista; no destruye los bloques originales.
 */
export function mergeScheduleBlocks(raw: ScheduleBlock[] = []): ScheduleBlock[] {
  const groups: Record<string, ScheduleBlock[]> = {};
  const others: ScheduleBlock[] = [];

  for (const block of raw) {
    if (!block) continue;
    if (block.id?.startsWith("combined-")) continue;

    if (block.goalId) {
      if (!groups[block.goalId]) groups[block.goalId] = [];
      groups[block.goalId].push(block);
    } else {
      others.push(block);
    }
  }

  const result: ScheduleBlock[] = [...others];

  for (const goalId of Object.keys(groups)) {
    const blocks = groups[goalId];
    if (!blocks || blocks.length === 0) continue;

    const starts = blocks.map((block) => timeStrToMinutes(block.start));
    const ends = blocks.map((block) => timeStrToMinutes(block.end));
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const first = blocks[0];

    result.push({
      id: `combined-${goalId}`,
      goalId,
      goalTitle: first.goalTitle ?? first.goalId ?? "",
      start: minutesToTimeStr(minStart),
      end: minutesToTimeStr(maxEnd),
      minutes: Math.max(1, Math.round(maxEnd - minStart)),
    });
  }

  result.sort((a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start));
  return result;
}

/**
 * Convierte el orden visual de bloques combinados a bloques reales recalculados.
 */
export function reorderMergedScheduleBlocks(
  raw: ScheduleBlock[] = [],
  ordered: ScheduleBlock[],
): ScheduleBlock[] {
  const rawMap = new Map<string, ScheduleBlock>();
  const rawByGoal = new Map<string, ScheduleBlock[]>();

  raw.forEach((block) => {
    if (block?.id) rawMap.set(block.id, block);
    if (block?.goalId) {
      const list = rawByGoal.get(block.goalId) || [];
      list.push(block);
      rawByGoal.set(block.goalId, list);
    }
  });

  const flatReordered: ScheduleBlock[] = [];

  ordered.forEach((item) => {
    if (item.id?.startsWith("combined-") && item.goalId) {
      const originals = rawByGoal.get(item.goalId) || [];
      originals.sort(
        (a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start),
      );
      flatReordered.push(...originals);
      return;
    }

    const original = (item.id && rawMap.get(item.id)) || item;
    flatReordered.push(original);
  });

  if (flatReordered.length === 0) return [];

  const starts = raw.map((block) => timeStrToMinutes(block.start));
  let cursorMinutes = starts.length > 0 ? Math.min(...starts) : 8 * 60;

  return flatReordered.map((block) => {
    const duration =
      block.minutes ||
      timeStrToMinutes(block.end) - timeStrToMinutes(block.start) ||
      30;

    const newStart = minutesToTimeStr(cursorMinutes);
    const newEnd = minutesToTimeStr(cursorMinutes + duration);
    cursorMinutes += duration;

    return {
      ...block,
      start: newStart,
      end: newEnd,
      minutes: duration,
    };
  });
}

export const shouldMirrorTodaySchedule = (date: string) =>
  date === getTodayKey();
