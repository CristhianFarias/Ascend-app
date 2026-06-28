import type { FocusSession, Goal } from "./goalTypes";
import { emitEvent } from "./storeEvents";
import type { GoalsState } from "./storeTypes";

type StoreSet = (
  partial:
    | Partial<GoalsState>
    | GoalsState
    | ((state: GoalsState) => Partial<GoalsState> | GoalsState),
) => void;

type StoreGet = () => GoalsState;

/**
 * Motor de Modo Focus.
 * Controla timer, sets, descansos, autoavance y marcado automático.
 */
export const createFocusSlice = (set: StoreSet, get: StoreGet) => ({
  startFocus: (
    goalId: string,
    stepId?: string,
    opts?: { seconds?: number; autoAdvance?: boolean; autoMark?: boolean },
  ) => {
    const state = get();
    const goal = state.goalsById[goalId];
    if (!goal || goal.status !== "active") return;

    const startIndex = stepId
      ? goal.steps.findIndex((step) => step.id === stepId)
      : goal.steps.findIndex((step) => !step.completed);

    if (startIndex === -1) return;

    const step = goal.steps[startIndex];
    const totalSets = Math.max(1, step.sets ?? 1);
    const restSeconds = Math.max(0, step.rest ?? 60);
    const remainingSeconds = Math.max(1, opts?.seconds ?? step.duration * 60);
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

    set((current) => ({
      focusSession: session,
      _version: current._version + 1,
    }));

    emitEvent("focus.started", { goalId, stepId: step.id });
  },

  pauseFocus: () => {
    set((state) =>
      state.focusSession
        ? {
            focusSession: { ...state.focusSession, running: false },
            _version: state._version + 1,
          }
        : {},
    );
    emitEvent("focus.paused");
  },

  resumeFocus: () => {
    set((state) =>
      state.focusSession
        ? {
            focusSession: {
              ...state.focusSession,
              running: true,
              lastTickAt: Date.now(),
            },
            _version: state._version + 1,
          }
        : {},
    );
    emitEvent("focus.resumed");
  },

  skipSetOrStep: () => {
    const focusSession = get().focusSession;
    if (!focusSession) return;

    set((state) => ({
      focusSession: state.focusSession
        ? { ...state.focusSession, remainingSeconds: 0 }
        : null,
      _version: state._version + 1,
    }));

    get().tick(Date.now());
  },

  tick: (now = Date.now()) => {
    const state = get();
    const focusSession = state.focusSession;
    if (!focusSession || !focusSession.running) return;

    let delta = Math.max(
      0,
      Math.floor((now - (focusSession.lastTickAt || now)) / 1000),
    );
    if (delta <= 0) return;

    let localSession: FocusSession | null = { ...focusSession };

    const safeGetCurrentStep = () => {
      if (!localSession) return null;
      const goal = get().goalsById[localSession.goalId];
      if (!goal) return null;
      return goal.steps[localSession.stepIndex] ?? null;
    };

    while (delta > 0 && localSession) {
      if (!localSession.running) break;

      if (delta <= localSession.remainingSeconds) {
        localSession.remainingSeconds -= delta;
        delta = 0;
        localSession.lastTickAt = now;
        break;
      }

      delta -= localSession.remainingSeconds;
      localSession.remainingSeconds = 0;

      const currentStep = safeGetCurrentStep();
      if (!currentStep) {
        localSession = null;
        break;
      }

      if (localSession.phase === "work") {
        if (localSession.currentSet < localSession.totalSets) {
          if ((localSession.restSeconds ?? 0) > 0) {
            localSession.phase = "rest";
            localSession.remainingSeconds = localSession.restSeconds;
          } else {
            localSession.currentSet += 1;
            localSession.phase = "work";
            localSession.remainingSeconds = Math.max(
              1,
              (currentStep.duration || 1) * 60,
            );
          }
        } else {
          get().updateStep(localSession.goalId, localSession.stepId, {
            completed: true,
          });

          emitEvent("focus.step.completed", {
            goalId: localSession.goalId,
            stepId: localSession.stepId,
          });

          const goal: Goal | undefined = get().goalsById[localSession.goalId];
          if (!goal) {
            localSession = null;
            break;
          }

          const nextIndex = goal.steps.findIndex(
            (step, index) => index > localSession!.stepIndex && !step.completed,
          );

          if (nextIndex !== -1 && localSession.autoAdvance) {
            const nextStep = goal.steps[nextIndex];
            localSession.stepIndex = nextIndex;
            localSession.stepId = nextStep.id;
            localSession.phase = "work";
            localSession.currentSet = 1;
            localSession.totalSets = Math.max(1, nextStep.sets ?? 1);
            localSession.restSeconds = Math.max(0, nextStep.rest ?? 60);
            localSession.remainingSeconds = Math.max(
              1,
              (nextStep.duration || 1) * 60,
            );
          } else {
            const allDone = goal.steps.every((step) => step.completed);
            if (allDone && localSession.autoMark) {
              get().markGoalCompletedToday(localSession.goalId);
            }

            if (allDone) {
              emitEvent("focus.goal.completed", {
                goalId: localSession.goalId,
              });
            }

            localSession = null;
            break;
          }
        }
      } else if (localSession.phase === "rest") {
        localSession.currentSet += 1;
        localSession.phase = "work";

        const current = safeGetCurrentStep();
        localSession.remainingSeconds = Math.max(
          1,
          (current?.duration ?? 1) * 60,
        );
      } else {
        localSession = null;
        break;
      }
    }

    if (!localSession) {
      set((current) => ({
        focusSession: null,
        _version: current._version + 1,
      }));
      emitEvent("focus.finished");
      return;
    }

    localSession.lastTickAt = now;

    set((current) => ({
      focusSession: localSession,
      _version: current._version + 1,
    }));
  },

  finishFocus: () => {
    if (!get().focusSession) return;

    set(() => ({
      focusSession: null,
    }));

    emitEvent("focus.finished");
  },
});
