type StoreEventCallback = (payload?: any) => void;

/**
 * Bus interno para avisos entre acciones del store y pantallas.
 * No se persiste: solo vive mientras la app está abierta.
 */
export const eventsBus: Record<string, StoreEventCallback[]> = {};

export function emitEvent(event: string, payload?: any) {
  (eventsBus[event] || []).forEach((cb) => {
    try {
      cb(payload);
    } catch (err) {
      console.warn("event cb error", err);
    }
  });
}
