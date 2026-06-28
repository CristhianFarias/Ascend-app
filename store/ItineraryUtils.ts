// src/store/ItineraryUtils.ts

// Utilidades para construir / normalizar / analizar el Itinerario.
// Este archivo NO debe importar el store para evitar dependencias circulares.
// Exporta tipos y funciones puras que el store puede usar.

export type StepLike = {
  id: string;
  title?: string;
  duration?: number; // minutos
  completed?: boolean;
  scheduledTime?: string; // "HH:MM"
  order?: number;
  [k: string]: any;
};

export type GoalLike = {
  id: string;
  title?: string;
  color?: string;
  status?: string;
  priority?: string | number; // Agregado para tipado estricto
  steps?: StepLike[];
  [k: string]: any;
};

export type ScheduleBlock = {
  id: string;
  goalId: string;
  goalTitle: string;
  start: string; // "HH:MM" o "" si sin horario
  end?: string; // optional
  minutes: number;
  stepId?: string;
  [k: string]: any;
};

export type ItineraryItem = {
  id: string;
  goalId: string;
  goalTitle: string;
  stepId?: string;
  stepTitle?: string;
  start?: string; // "HH:MM"
  end?: string;
  minutes: number;
  color?: string;
  order?: number;
  priority?: string | number; // Propiedad faltante agregada
  metadata?: Record<string, any>;
};

export type Conflict = {
  item1: ItineraryItem;
  item2: ItineraryItem;
  overlapMinutes: number;
};

// ----------------------
// Helpers de tiempo
// ----------------------
export function timeStrToMinutes(t: string | undefined): number {
  if (!t || typeof t !== "string" || !t.includes(":")) return 0;
  const [hStr, mStr] = t.split(":");
  const h = Number.isNaN(Number(hStr)) ? 0 : Number(hStr);
  const m = Number.isNaN(Number(mStr)) ? 0 : Number(mStr);
  return h * 60 + m;
}

export function minutesToTimeStr(mins: number): string {
  const m = Math.max(0, Math.floor(mins));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function addMinutes(timeStr: string | undefined, mins: number): string {
  const base = timeStrToMinutes(timeStr);
  return minutesToTimeStr(base + Math.max(0, Math.floor(mins || 0)));
}

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ----------------------
// buildItineraryForDate
// - Genera ItineraryItem[] desde un array de goals (no muta nada).
// - Filtra solo goals activos si wish (opcional).
// ----------------------
export function buildItineraryForDate(
  goals: GoalLike[],
  date: Date,
  opts?: { onlyActive?: boolean; sortByPriority?: boolean }, // Tipo actualizado
): ItineraryItem[] {
  const items: ItineraryItem[] = [];
  const onlyActive = opts?.onlyActive ?? true;
  // const dateKey = date.toISOString().split("T")[0]; // Reservado para uso futuro si se filtra por fecha específica

  goals.forEach((g) => {
    if (onlyActive && g.status && g.status !== "active") return;
    (g.steps || []).forEach((s, idx) => {
      // No insertar pasos completados (asumimos que caller decide)
      if (s.completed) return;
      const start = s.scheduledTime || "";

      items.push({
        id: `${g.id}-${s.id}`,
        goalId: g.id,
        goalTitle: g.title || "Meta",
        stepId: s.id,
        stepTitle: s.title || undefined,
        start,
        end: s.scheduledTime ? addMinutes(start, s.duration || 0) : undefined,
        minutes: s.duration || 0,
        color: g.color,
        priority: g.priority, // Se transfiere la prioridad
        order: typeof s.order === "number" ? s.order : idx + 1,
        metadata: { ...((s as any).metadata || {}) },
      });
    });
  });

  if (opts?.sortByPriority) {
    items.sort((a, b) => Number(a.priority || "3") - Number(b.priority || "3")); // Asume priority en GoalLike, low number = high prio
  } else {
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  return items;
}

// ----------------------
// normalizeItinerary
// - Asegura shape consistente.
// ----------------------
export function normalizeItinerary(
  items: Partial<ItineraryItem>[],
  defaults?: Partial<ItineraryItem>,
): ItineraryItem[] {
  return items.map((it, i) => {
    const id = it.id ?? `${it.goalId ?? "g"}-${it.stepId ?? i}`;
    const minutes = typeof it.minutes === "number" ? it.minutes : 0;
    const start = it.start ?? "";
    const end = it.end ?? (start ? addMinutes(start, minutes) : "");
    return {
      id,
      goalId: it.goalId ?? "",
      goalTitle: it.goalTitle ?? "Meta",
      stepId: it.stepId,
      stepTitle: it.stepTitle,
      start,
      end,
      minutes,
      color: it.color ?? "#6b7280",
      order: typeof it.order === "number" ? it.order : i + 1,
      priority: it.priority,
      metadata: it.metadata ?? {},
      ...(defaults ?? {}),
    };
  });
}

// ----------------------
// computeItinerarySummary
// - totalMinutes, completedMinutes, percentDone.
// - Se considera metadata.completed en cada item.
// ----------------------
export function computeItinerarySummary(items: ItineraryItem[]): {
  totalMinutes: number;
  completedMinutes: number;
  percentDone: number;
} {
  const totalMinutes = items.reduce((acc, i) => acc + (i.minutes || 0), 0);
  const completedMinutes = items.reduce(
    (acc, i) => acc + ((i.metadata?.completed ? i.minutes : 0) || 0),
    0,
  );
  const percentDone = totalMinutes
    ? Math.round((completedMinutes / totalMinutes) * 100)
    : 0;
  return { totalMinutes, completedMinutes, percentDone };
}

// ----------------------
// findNextItem
// - Retorna el primer item pendiente por hora (o el primero no completado).
// ----------------------
export function findNextItem(
  items: ItineraryItem[],
  now?: Date,
): ItineraryItem | null {
  const current = now ?? new Date();

  // Prioriza items con start válido para hoy y no completados
  const pending = items.filter((i) => !i.metadata?.completed);

  if (pending.length === 0) return null;

  // Convertir start "HH:MM" a minutos del día
  const withTime = pending.map((i) => {
    let timeMinutes = timeStrToMinutes(i.start || "");
    return { item: i, timeMinutes };
  });

  // Ordenar cronológicamente
  withTime.sort((a, b) => a.timeMinutes - b.timeMinutes);

  // Busca el primero que aún no pasó o el primero pendiente del día
  const nowMinutes = current.getHours() * 60 + current.getMinutes();

  // Encontrar el primer item cuyo tiempo de inicio sea >= ahora
  const next = withTime.find((w) => w.timeMinutes >= nowMinutes) ?? withTime[0];

  return next ? next.item : null;
}

// ----------------------
// detectConflicts
// - Detecta solapamientos por start/end (asume start "HH:MM" y end calculable).
// ----------------------
export function detectConflicts(items: ItineraryItem[]): Conflict[] {
  const out: Conflict[] = [];
  // Clona y normaliza para no mutar el original
  const normalized = normalizeItinerary([...items]);

  // Ordenar por inicio en minutos
  normalized.sort(
    (a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start),
  );

  for (let i = 0; i < normalized.length - 1; i++) {
    const a = normalized[i];
    const b = normalized[i + 1];

    // Si 'a' no tiene horario, no puede haber conflicto de tiempo
    if (!a.start || !b.start) continue;

    const endA = timeStrToMinutes(a.end || addMinutes(a.start, a.minutes));
    const startB = timeStrToMinutes(b.start);

    // Si A termina después de que B empieza, hay solapamiento
    if (endA > startB) {
      out.push({
        item1: a,
        item2: b,
        overlapMinutes: endA - startB,
      });
    }
  }
  return out;
}

// ----------------------
// util: agrupar items consecutivos por misma meta (opcional)
// ----------------------
export function mergeAdjacentSameGoals(
  items: ItineraryItem[],
): ItineraryItem[] {
  if (!items || items.length === 0) return [];

  // Normalizar y ordenar antes de agrupar
  const sorted = normalizeItinerary(items).sort(
    (a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start),
  );

  const merged: ItineraryItem[] = [];

  for (const it of sorted) {
    const last = merged[merged.length - 1];

    if (last && last.goalId === it.goalId && (!last.stepId || !it.stepId)) {
      // Ampliar bloque anterior
      last.minutes = (last.minutes || 0) + (it.minutes || 0);
      last.end = it.end || addMinutes(last.start, last.minutes);
    } else {
      merged.push({ ...it });
    }
  }
  return merged;
}

export const __helpers = {
  timeStrToMinutes,
  minutesToTimeStr,
  addMinutes,
};
