import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert, useColorScheme } from "react-native";

import useGoalsStore from "../store/useGoalsStore";

const isValidHex = (value: string) => /^#([0-9A-F]{3}){1,2}$/i.test(value);

/**
 * ViewModel de Perfil.
 * Separa acciones de ajustes/datos para que la pantalla solo renderice controles.
 */
export const useProfileViewModel = () => {
  const { colors } = useTheme();
  const storedTheme = useGoalsStore((s) => s.settings.theme || "system");
  const storedAccent = useGoalsStore((s) => s.settings.accentColor);
  const setTheme = useGoalsStore((s) => s.setTheme);
  const setAccentColor = useGoalsStore((s) => s.setAccentColor);
  const getGlobalStats = useGoalsStore((s) => s.getGlobalStats);
  const backupToJSON = useGoalsStore((s) => s.backupToJSON);
  const restoreFromJSON = useGoalsStore((s) => s.restoreFromJSON);
  const resetAll = useGoalsStore((s) => s.resetAll);

  const systemScheme = useColorScheme();
  const effectiveTheme = storedTheme === "system" ? systemScheme : storedTheme;
  const isDark = effectiveTheme === "dark";

  // Datos locales de perfil; por ahora no se persisten en el store.
  const [accent, setAccent] = useState(storedAccent || "#f59e0b");
  const [backupText, setBackupText] = useState("");
  const [userName, setUserName] = useState("Cristhian");
  const [userBio, setUserBio] = useState("Enfocado en crecer cada día");

  const stats = getGlobalStats();

  useEffect(() => {
    setAccent(storedAccent || "#f59e0b");
  }, [storedAccent]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleSetAccent = () => {
    if (!isValidHex(accent)) {
      Alert.alert("Color inválido", "Ingresa un HEX válido (ej. #06b6d4)");
      return;
    }

    setAccentColor(accent);
    Alert.alert("¡Listo!", "Color de acento actualizado");
  };

  const handleBackup = () => {
    try {
      setBackupText(backupToJSON());
      Alert.alert("Backup creado", "JSON listo abajo para copiar.");
    } catch {
      Alert.alert("Error", "No se pudo generar backup");
    }
  };

  const handleRestore = () => {
    if (!backupText) {
      Alert.alert("Restaurar", "Pega el JSON primero.");
      return;
    }

    try {
      restoreFromJSON(backupText);
      Alert.alert("Restaurado", "Datos cargados correctamente");
    } catch {
      Alert.alert("Error", "JSON inválido");
    }
  };

  const confirmReset = () => {
    Alert.alert("Resetear app", "¿Borrar todo? (metas, rachas, ajustes)", [
      { text: "Cancelar" },
      {
        text: "Resetear",
        style: "destructive",
        onPress: () => {
          resetAll();
          Alert.alert("Hecho", "App reseteada");
        },
      },
    ]);
  };

  const initials = userName
    .split(" ")
    .map((part) => (part ? part[0] : ""))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bg = colors.background ?? (isDark ? "#0b1220" : "#f9fafb");
  const card = colors.card ?? (isDark ? "#1f2937" : "#ffffff");
  const text = colors.text ?? (isDark ? "#f3f4f6" : "#111827");
  const subtext = colors.border ?? (isDark ? "#9ca3af" : "#6b7280");
  const border = colors.border ?? (isDark ? "#374151" : "#e5e7eb");
  const accentColor = storedAccent || "#f59e0b";

  return {
    accent,
    setAccent,
    backupText,
    setBackupText,
    userName,
    setUserName,
    userBio,
    setUserBio,
    stats,
    isDark,
    initials,
    toggleTheme,
    handleSetAccent,
    handleBackup,
    handleRestore,
    confirmReset,
    colors: { bg, card, text, subtext, border, accentColor },
  };
};
