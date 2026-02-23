// src/theme/theme.ts
export type AppThemeTokens = {
  mode: "light" | "dark";
  background: string;
  surface: string;
  text: string;
  subtext: string;
  border: string;
  primary: string; // accent
  success: string;
  danger: string;
};

export const lightTokens: AppThemeTokens = {
  mode: "light",
  background: "#ffffff",
  surface: "#f7f7f8",
  text: "#111827",
  subtext: "#6b7280",
  border: "#e5e7eb",
  primary: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
};

export const darkTokens: AppThemeTokens = {
  mode: "dark",
  background: "#0b1220",
  surface: "#0f1724",
  text: "#e6eef8",
  subtext: "#9ca3af",
  border: "#1f2937",
  primary: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
};
