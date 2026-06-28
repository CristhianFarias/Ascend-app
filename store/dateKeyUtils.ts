/**
 * Convierte una fecha local guardada como YYYY-MM-DD a Date.
 * Se usa para rachas y deadlines sin pasar por UTC.
 */
export const parseYYYYMMDD = (value: string) => {
  const [y, m, d] = (value || "").split("-").map((x) => Number(x) || 0);
  return new Date(y, m - 1, d);
};

/**
 * Formatea un Date local como YYYY-MM-DD.
 * Evita toISOString porque cambia de día según zona horaria.
 */
export const formatYYYYMMDD = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
