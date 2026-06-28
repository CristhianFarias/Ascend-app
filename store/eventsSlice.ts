import { emitEvent, eventsBus } from "./storeEvents";

/**
 * Acciones públicas para suscribirse a eventos internos del store.
 * Las usan pantallas que necesitan reaccionar a rollover, focus o cambios de agenda.
 */
export const createEventsSlice = () => ({
  on: (event: string, cb: (payload?: any) => void) => {
    if (!eventsBus[event]) eventsBus[event] = [];
    eventsBus[event].push(cb);
  },

  off: (event: string, cb: (payload?: any) => void) => {
    eventsBus[event] = (eventsBus[event] || []).filter(
      (candidate) => candidate !== cb,
    );
  },

  emit: (event: string, payload?: any) => emitEvent(event, payload),
});
