// src/utils/notifications.ts
import * as Notifications from "expo-notifications";

/**
 * Utilidades para notificaciones locales (expo-notifications)
 * - initNotifications: pedir permisos y setear handler básico
 * - scheduleNotificationForDate: programa una notificación para una fecha JS (Date)
 * - cancelNotification / cancelManyNotifications
 * - pickMotivationalPhrase
 *
 * Nota: invoca initNotifications() al inicio de la app (App.tsx).
 */

/**
 * Handler: devuelve la forma que exige NotificationBehavior en las definiciones TS modernas.
 * Ajusta según prefieras (showBanner/showList).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      // propiedades requeridas por versiones más nuevas de los tipos
      shouldShowBanner: true,
      shouldShowList: true,
    } as Notifications.NotificationBehavior;
  },
});

export async function initNotifications(): Promise<Notifications.NotificationPermissionsStatus | null> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (
      existing.granted ||
      existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return existing;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return requested;
  } catch (e) {
    console.warn("initNotifications error", e);
    return null;
  }
}

/**
 * scheduleNotificationForDate
 * Construye el trigger usando 'timestamp' para mayor compatibilidad entre versiones de expo-notifications.
 */
export async function scheduleNotificationForDate(opts: {
  date: Date;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<string | null> {
  try {
    const trigger: any = {
      type: "date" as const,
      // timestamp en ms (evita diferencias con 'date' / 'value' entre versiones)
      timestamp: opts.date.getTime(),
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        data: opts.data ?? {},
      },
      trigger,
    });
    return id;
  } catch (e) {
    console.warn("scheduleNotificationForDate error", e);
    return null;
  }
}

export async function cancelNotification(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.warn("cancelNotification error", e);
  }
}

export async function cancelManyNotifications(ids: string[] = []) {
  try {
    for (const id of ids) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {
        // continue
      }
    }
  } catch (e) {
    console.warn("cancelManyNotifications error", e);
  }
}

export function pickMotivationalPhrase(): string {
  const PHRASES = [
    "Ve a por ello — un paso a la vez.",
    "Pequeñas acciones grandes resultados — comienza ahora.",
    "Mantén la constancia: hoy cuentas más que ayer.",
    "Tu futuro yo te lo agradecerá — empieza ya.",
    "Concéntrate y avanza — lo estás haciendo bien.",
    "Hazlo por el progreso, no por la perfección.",
  ];
  return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}
