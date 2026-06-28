import { minutesToTimeStr, timeStrToMinutes } from "./ItineraryUtils";
import { parseYYYYMMDD } from "./dateKeyUtils";
import {
  getEligibleStepsForDate,
  getRemainingActiveDaysUntilDeadline,
  getRequiredSessionDays,
  getSessionNameForDate,
  isGoalPastDeadline,
  isGoalScheduledForDate,
} from "./goalScheduleUtils";
import { genId } from "./idUtils";
import type { Goal, GoalPriority, ScheduleBlock, TimeBlock } from "./goalTypes";

type Slot = {
  startMin: number;
  endMin: number;
  cursor: number;
  remaining: number;
};

type PendingStep = {
  goalId: string;
  goalTitle: string;
  goalPriority: GoalPriority;
  goalOrder: number;
  stepId: string;
  stepOrder: number;
  duration: number;
  deadline?: string;
  session?: string;
};

const buildSlots = (blocks: TimeBlock[]): Slot[] =>
  blocks
    .map((block) => {
      const startMin = timeStrToMinutes(block.start);
      const endMin = timeStrToMinutes(block.end);
      if (endMin <= startMin) return null;

      return {
        startMin,
        endMin,
        cursor: startMin,
        remaining: endMin - startMin,
      };
    })
    .filter(Boolean) as Slot[];

const collectPendingSteps = (goals: Goal[], dateKey: string): PendingStep[] => {
  const pendingSteps: PendingStep[] = [];

  goals.forEach((goal) => {
    const eligibleSteps = getEligibleStepsForDate(goal, dateKey);
    const sessionName = getSessionNameForDate(goal, dateKey);

    eligibleSteps.forEach((step) => {
      pendingSteps.push({
        goalId: goal.id,
        goalTitle: goal.title,
        goalPriority: goal.priority,
        goalOrder: goal.order,
        stepId: step.id,
        stepOrder: step.order,
        duration: step.duration || 0,
        deadline: goal.deadline,
        session: sessionName,
      });
    });
  });

  return pendingSteps;
};

/**
 * Genera una propuesta de agenda con prioridad por:
 * prioridad de meta, deadline, orden de meta y orden de paso.
 */
export function generateScheduleProposalFromGoals(
  goals: Goal[],
  availableTimeBlocks: TimeBlock[],
  dateKey: string,
): { proposal: ScheduleBlock[]; warnings: string[] } {
  const slots = buildSlots(availableTimeBlocks);
  const pendingSteps = collectPendingSteps(goals, dateKey);

  const totalAvailable = slots.reduce((acc, slot) => acc + slot.remaining, 0);
  const totalRequired = pendingSteps.reduce(
    (acc, step) => acc + step.duration,
    0,
  );

  const warnings: string[] = [];
  if (slots.length === 0) {
    warnings.push("No hay franjas disponibles válidas para acomodar el día.");
  }

  if (totalRequired > totalAvailable) {
    warnings.push(
      `Tareas requieren ${totalRequired} min pero solo hay ${totalAvailable} min disponibles.`,
    );
  }

  goals.forEach((goal) => {
    if (goal.status !== "active") return;

    if (isGoalPastDeadline(goal, dateKey)) {
      warnings.push(`"${goal.title}" ya pasó su fecha límite.`);
      return;
    }

    if (!isGoalScheduledForDate(goal, dateKey) && goal.steps.some((s) => !s.completed)) {
      warnings.push(`"${goal.title}" queda en descanso automático para esta fecha.`);
    }

    const remainingActiveDays = getRemainingActiveDaysUntilDeadline(goal, dateKey);
    if (typeof remainingActiveDays !== "number") return;

    const requiredDays = getRequiredSessionDays(goal);
    if (requiredDays > remainingActiveDays) {
      warnings.push(
        `"${goal.title}" está en riesgo: requiere ${requiredDays} sesiones y quedan ${remainingActiveDays} días activos hasta el deadline.`,
      );
    }
  });

  pendingSteps.sort((a, b) => {
    const priorityA = Number(a.goalPriority);
    const priorityB = Number(b.goalPriority);
    if (priorityA !== priorityB) return priorityA - priorityB;

    if (a.deadline && b.deadline) {
      return (
        parseYYYYMMDD(a.deadline).getTime() -
        parseYYYYMMDD(b.deadline).getTime()
      );
    }

    if (a.deadline) return -1;
    if (b.deadline) return 1;
    if (a.goalOrder !== b.goalOrder) return a.goalOrder - b.goalOrder;
    return a.stepOrder - b.stepOrder;
  });

  const proposal: ScheduleBlock[] = [];

  for (const step of pendingSteps) {
    let placed = false;

    for (const slot of slots) {
      if (slot.remaining < step.duration) continue;

      const startMin = slot.cursor;
      const endMin = slot.cursor + step.duration;
      if (endMin > slot.endMin) continue;

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

    if (!placed) {
      warnings.push(
        `No se pudo ubicar paso ${step.goalTitle} (${step.duration}m).`,
      );
    }
  }

  return { proposal, warnings };
}

/**
 * Valida si el tiempo pendiente cabe en las franjas disponibles.
 * Solo calcula advertencias; no modifica la agenda.
 */
export function validateScheduleOverload(
  goals: Goal[],
  availableTimeBlocks: TimeBlock[],
  dateKey: string,
) {
  const slotsMinutes = availableTimeBlocks.reduce((acc, block) => {
    const start = timeStrToMinutes(block.start);
    const end = timeStrToMinutes(block.end);
    return acc + Math.max(0, end - start);
  }, 0);

  const pendingMinutes = goals.reduce((acc, goal) => {
    const goalPending = getEligibleStepsForDate(goal, dateKey)
      .reduce((stepAcc, step) => stepAcc + (step.duration || 0), 0);

    return acc + goalPending;
  }, 0);

  const ok = pendingMinutes <= slotsMinutes;
  const warnings: string[] = [];
  const deficitMinutes = ok ? undefined : pendingMinutes - slotsMinutes;

  if (deficitMinutes) {
    warnings.push(
      `Falta ${deficitMinutes} minutos. Se priorizarán metas con prioridad más alta.`,
    );
  }

  return { ok, warnings, deficitMinutes };
}
