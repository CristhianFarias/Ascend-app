// app/(tabs)/perfil.tsx
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useGoalsStore from "../../store/useGoalsStore";

export default function PerfilScreen() {
  // Tema react-navigation (proporcionado por ThemeProvider en _layout.tsx)
  const { colors } = useTheme();

  // Preferencia guardada en el store ("light" | "dark" | "system")
  const storedTheme = useGoalsStore((s) => s.settings.theme || "system");
  // Accent persistido
  const storedAccent = useGoalsStore((s) => s.settings.accentColor);
  // Acciones del store
  const setTheme = useGoalsStore((s) => s.setTheme);
  const setAccentColor = useGoalsStore((s) => s.setAccentColor);
  const getGlobalStats = useGoalsStore((s) => s.getGlobalStats);
  const backupToJSON = useGoalsStore((s) => s.backupToJSON);
  const restoreFromJSON = useGoalsStore((s) => s.restoreFromJSON);
  const resetAll = useGoalsStore((s) => s.resetAll);

  // Si el usuario eligió "system", obtenemos el scheme actual del dispositivo
  const systemScheme = useColorScheme();
  const effectiveTheme = storedTheme === "system" ? systemScheme : storedTheme;
  const isDark = effectiveTheme === "dark";

  // Estado local para controlar input del color antes de aplicar
  const [accent, setAccent] = useState(storedAccent || "#f59e0b");
  const [backupText, setBackupText] = useState("");
  const [userName, setUserName] = useState("Cristhian");
  const [userBio, setUserBio] = useState("Enfocado en crecer cada día 💪");

  // Estadísticas
  const stats = getGlobalStats();

  useEffect(() => {
    // Mantener el input sincronizado si cambia desde otra parte de la app
    setAccent(storedAccent || "#f59e0b");
  }, [storedAccent]);

  // Toggle theme: alterna entre light/dark (no toca 'system')
  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    // NO usar Appearance.setColorScheme(...) — no es recomendable ni necesario aquí.
  };

  // Validación HEX simple (#RGB or #RRGGBB)
  const isValidHex = (h: string) => /^#([0-9A-F]{3}){1,2}$/i.test(h);

  const handleSetAccent = () => {
    if (!isValidHex(accent))
      return Alert.alert(
        "Color inválido",
        "Ingresa un HEX válido (ej. #06b6d4)",
      );
    setAccentColor(accent);
    Alert.alert("¡Listo!", "Color de acento actualizado");
  };

  const handleBackup = () => {
    try {
      const json = backupToJSON();
      setBackupText(json);
      Alert.alert("Backup creado", "JSON listo abajo para copiar.");
    } catch (e) {
      Alert.alert("Error", "No se pudo generar backup");
    }
  };

  const handleRestore = () => {
    if (!backupText) return Alert.alert("Restaurar", "Pega el JSON primero.");
    try {
      restoreFromJSON(backupText);
      Alert.alert("Restaurado", "Datos cargados correctamente");
    } catch (e) {
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
    .map((n) => (n ? n[0] : ""))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Colores derivados (fallbacks seguros)
  const bg = colors.background ?? (isDark ? "#0b1220" : "#f9fafb");
  const card = colors.card ?? (isDark ? "#1f2937" : "#ffffff");
  const text = colors.text ?? (isDark ? "#f3f4f6" : "#111827");
  const subtext = colors.border ?? (isDark ? "#9ca3af" : "#6b7280");
  const border = colors.border ?? (isDark ? "#374151" : "#e5e7eb");
  const accentColor = storedAccent || "#f59e0b";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Perfil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.8}>
            <View style={[styles.avatar, { backgroundColor: card }]}>
              <Text style={[styles.avatarText, { color: text }]}>
                {initials || "U"}
              </Text>
            </View>
            <View style={[styles.cameraIcon, { backgroundColor: text }]}>
              <Feather name="camera" size={16} color={card} />
            </View>
          </TouchableOpacity>

          <TextInput
            style={[styles.userName, { color: text } as any]}
            value={userName}
            onChangeText={setUserName}
            placeholder="Tu nombre"
            placeholderTextColor={subtext}
          />

          <TextInput
            style={[styles.userBio, { color: subtext }]}
            value={userBio}
            onChangeText={setUserBio}
            placeholder="Algo sobre ti..."
            placeholderTextColor={subtext}
            multiline
          />
        </View>

        {/* Estadísticas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Mis Estadísticas
          </Text>
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                styles.shadow,
                { backgroundColor: card, borderColor: border },
              ]}
            >
              <Feather name="target" size={28} color={accentColor} />
              <Text style={[styles.statValue, { color: text }]}>
                {stats.totalGoals}
              </Text>
              <Text style={[styles.statLabel, { color: subtext }]}>
                Metas totales
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                styles.shadow,
                { backgroundColor: card, borderColor: border },
              ]}
            >
              <Feather name="clock" size={28} color={accentColor} />
              <Text style={[styles.statValue, { color: text }]}>
                {stats.totalFocusMinutes}m
              </Text>
              <Text style={[styles.statLabel, { color: subtext }]}>
                Minutos enfocados
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                styles.shadow,
                { backgroundColor: card, borderColor: border },
              ]}
            >
              <Feather name="activity" size={28} color={accentColor} />
              <Text style={[styles.statValue, { color: text }]}>
                {stats.globalStreak}
              </Text>
              <Text style={[styles.statLabel, { color: subtext }]}>
                Racha actual
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                styles.shadow,
                { backgroundColor: card, borderColor: border },
              ]}
            >
              <Feather name="award" size={28} color={accentColor} />
              <Text style={[styles.statValue, { color: text }]}>
                {stats.bestStreak}
              </Text>
              <Text style={[styles.statLabel, { color: subtext }]}>
                Mejor racha
              </Text>
            </View>
          </View>
        </View>

        {/* Ajustes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: text }]}>Ajustes</Text>

          {/* Modo Oscuro */}
          <View
            style={[
              styles.settingRow,
              styles.shadowSmall,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <View>
              <Text style={[styles.settingLabel, { color: text }]}>
                Modo Oscuro
              </Text>
              <Text style={[styles.settingDesc, { color: subtext }]}>
                {isDark ? "Activado" : "Desactivado"}
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#d1d5db", true: accentColor }}
              thumbColor={isDark ? "#fff" : "#f3f4f6"}
            />
          </View>

          {/* Color Acento */}
          <View
            style={[
              styles.settingRow,
              styles.shadowSmall,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: text }]}>
                Color de Acento
              </Text>

              <TextInput
                style={[
                  styles.accentInput,
                  { borderColor: border, backgroundColor: card, color: text },
                ]}
                value={accent}
                onChangeText={setAccent}
                placeholder="#f59e0b"
                placeholderTextColor={subtext}
              />
            </View>

            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: accentColor }]}
              onPress={handleSetAccent}
            >
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Datos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: text }]}>Datos</Text>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.shadowSmall,
              { backgroundColor: card },
            ]}
            onPress={handleBackup}
          >
            <Feather name="download" size={20} color={text} />
            <Text style={[styles.actionText, { color: text }]}>
              Generar Backup JSON
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.backupInput,
              styles.shadowSmall,
              { borderColor: border, backgroundColor: card, color: text },
            ]}
            value={backupText}
            onChangeText={setBackupText}
            placeholder="Pega tu backup JSON aquí..."
            placeholderTextColor={subtext}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.shadowSmall,
              { backgroundColor: card },
            ]}
            onPress={handleRestore}
          >
            <Feather name="upload" size={20} color={text} />
            <Text style={[styles.actionText, { color: text }]}>
              Restaurar desde JSON
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerBtn, styles.shadowSmall]}
            onPress={confirmReset}
          >
            <Feather name="alert-triangle" size={20} color="#dc2626" />
            <Text style={styles.dangerText}>Resetear toda la app</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 48, fontWeight: "bold" },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    padding: 12,
    borderRadius: 30,
    borderWidth: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  userBio: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: "80%",
  },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  statValue: { fontSize: 32, fontWeight: "800", marginTop: 12 },
  statLabel: { fontSize: 14, marginTop: 4 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingDesc: { fontSize: 14, marginTop: 4 },
  accentInput: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    color: "#111",
  },
  applyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 12,
    alignSelf: "flex-end",
  },
  applyBtnText: { color: "#fff", fontWeight: "700" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    gap: 16,
  },
  actionText: { fontSize: 16, fontWeight: "600" },
  backupInput: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    marginBottom: 16,
    fontSize: 14,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    gap: 16,
  },
  dangerText: { fontSize: 16, fontWeight: "600", color: "#dc2626" },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  shadowSmall: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
