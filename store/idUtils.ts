/**
 * Genera ids legibles para entidades locales.
 * No busca ser criptográfico; solo evitar colisiones prácticas en el dispositivo.
 */
export const genId = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
