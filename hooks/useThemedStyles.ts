// src/hooks/useThemedStyles.ts
import { useMemo } from "react";
import { useAppTheme } from "./useAppTheme";

/**
 * useThemedStyles(factory)
 * - factory: (theme) => StyleSheet.create({...})
 * - devuelve los estilos memoizados según tokens del theme.
 * Ejemplo: const styles = useThemedStyles((t) => ({ container: { backgroundColor: t.background } }))
 */
export function useThemedStyles<T extends Record<string, any>>(
  factory: (theme: ReturnType<typeof useAppTheme>) => T,
) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => factory(theme),
    [
      factory,
      theme.background,
      theme.card,
      theme.text,
      theme.primary,
      theme.border,
      theme.subtext,
    ],
  );
  return styles;
}
