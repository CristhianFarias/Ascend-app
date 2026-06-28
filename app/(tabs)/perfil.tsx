// app/(tabs)/perfil.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfileViewModel } from "../../hooks/useProfileViewModel";

export default function PerfilScreen() {
  const {
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
    colors,
  } = useProfileViewModel();

  const { bg, card, text, subtext, border, accentColor } = colors;
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

