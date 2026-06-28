import type { GoalsState } from "./storeTypes";

export const STORE_VERSION = 7;

/**
 * Ajustes iniciales de la app local.
 * Se reutilizan al iniciar y al migrar datos antiguos incompletos.
 */
export const DEFAULT_SETTINGS: GoalsState["settings"] = {
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

/**
 * Eventos de ejemplo para mostrar cómo se verían compromisos externos.
 * Cuando integremos calendario real, esta lista debería venir del usuario.
 */
export const DEFAULT_EXTERNAL_EVENTS: GoalsState["externalEvents"] = [
  { id: "1", title: "Cita Médica", start: "10:00", end: "11:00" },
  { id: "2", title: "Reunión Trabajo", start: "15:00", end: "16:00" },
];
