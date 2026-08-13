// src/hooks/use-ui.ts
import { useTheme } from "@react-navigation/native";
import { PixelRatio } from "react-native";
import useGoalsStore from "../store/useGoalsStore";

export function useUI() {
  const { colors, dark } = useTheme();
  const settings = useGoalsStore((s) => s.settings || {});
  // support for optional user override (you can add this setting to store later)
  const userFontScale = (settings as any).fontScale ?? 1; // default 1

  // system font scale (user accessibility setting)
  const sysScale = PixelRatio.getFontScale() || 1;

  // final scale = system * optional user override
  const scale = Math.max(1, sysScale * userFontScale);

  const accent = settings.accentColor || colors?.primary || "#f59e0b";

  // base sizes (desktop/mobile friendly). We'll scale them.
  const base = {
    title: 28,
    body: 16,
    small: 14,
  };

  const tokens = {
    bg: colors?.background ?? (dark ? "#0b1220" : "#f9fafb"),
    card: colors?.card ?? (dark ? "#111827" : "#ffffff"),
    text: colors?.text ?? (dark ? "#f3f4f6" : "#111827"),
    // For small text prefer stronger color than textSecondary
    textSecondary: dark ? "#d1d5db" : "#475569",
    textSmallColor: colors?.text ?? (dark ? "#f3f4f6" : "#111827"), // stronger for small text
    border: colors?.border ?? (dark ? "#374151" : "#e5e7eb"),
    accent,
    minimal: Boolean(settings?.minimalMode),
    spacing: settings?.minimalMode
      ? { page: 8, section: 8 }
      : { page: 20, section: 16 },
    font: {
      title: Math.round(base.title * scale),
      body: Math.round(base.body * scale),
      small: Math.round(base.small * scale),
    },
    // recommended lineHeights for readability
    lineHeight: {
      title: Math.round(base.title * 1.2 * scale),
      body: Math.round(base.body * 1.4 * scale),
      small: Math.round(base.small * 1.45 * scale),
    },
    iconSize: settings?.minimalMode ? 18 : 24,
    showLabels: !settings?.minimalMode,
  };

  return { tokens, colors, dark, settings, scale };
}

export default useUI;
