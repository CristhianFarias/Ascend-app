import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { getTodayKey } from "../store/ItineraryUtils";
import useGoalsStore, { ScheduleBlock } from "../store/useGoalsStore";

// Habilitar animaciones en Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  onClose: () => void;
}

export default function ItineraryModal({ onClose }: Props) {
  const {
    settings,
    generateScheduleProposal,
    setDailyScheduleForDate,
    externalEvents,
    updateSettings,
  } = useGoalsStore();

  const [expanded, setExpanded] = useState<string | null>("itinerary");
  const [tempSchedule, setTempSchedule] = useState<ScheduleBlock[]>([]);
  const todayKey = getTodayKey();

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === section ? null : section);
  };

  const handleAutoOrganize = () => {
    const { proposal, warnings } = generateScheduleProposal(todayKey);
    setTempSchedule(proposal);
    if (warnings.length > 0) {
      Alert.alert("Aviso de Conflictos", warnings.join("\n"));
    }
  };

  const saveAndClose = () => {
    if (tempSchedule.length > 0) {
      setDailyScheduleForDate(todayKey, tempSchedule);
    }
    onClose();
  };

  return (
    <View style={styles.fullScreen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planificador de Día</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={32} color="#ccc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* SECCIÓN 1: CONFIGURACIÓN DE HORA */}
        <TouchableOpacity
          style={styles.sectionTab}
          onPress={() => toggleSection("config")}
        >
          <Text style={styles.sectionLabel}>⏰ Mi ventana de tiempo</Text>
          <Ionicons
            name={expanded === "config" ? "chevron-up" : "chevron-down"}
            size={20}
          />
        </TouchableOpacity>

        {expanded === "config" && (
          <View style={styles.configBox}>
            <Text style={styles.helperText}>
              ¿A qué hora quieres empezar a trabajar en tus metas?
            </Text>
            <View style={styles.timeInputRow}>
              <View>
                <Text style={styles.label}>Inicio</Text>
                <TextInput
                  style={styles.timeInput}
                  value={settings.dayStartTime}
                  placeholder="08:00"
                  // Aquí llamarías a una función para actualizar settings en el store
                />
              </View>
              <Ionicons name="arrow-forward" size={20} color="#999" />
              <View>
                <Text style={styles.label}>Fin</Text>
                <TextInput
                  style={styles.timeInput}
                  value={settings.dayEndTime}
                  onChangeText={(v) => updateSettings({ dayEndTime: v })}
                  placeholder="22:00"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.magicBtn}
              onPress={handleAutoOrganize}
            >
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.magicBtnText}>
                Organizar por hora de inicio
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SECCIÓN 2: CITAS (CITAS DEL CALENDARIO) */}
        <TouchableOpacity
          style={styles.sectionTab}
          onPress={() => toggleSection("events")}
        >
          <Text style={styles.sectionLabel}>
            📅 Citas y Compromisos ({externalEvents.length})
          </Text>
          <Ionicons
            name={expanded === "events" ? "chevron-up" : "chevron-down"}
            size={20}
          />
        </TouchableOpacity>

        {expanded === "events" && (
          <View style={styles.eventList}>
            {externalEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventTimeBar} />
                <View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.start} - {event.end}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECCIÓN 3: ITINERARIO RESULTANTE */}
        <TouchableOpacity
          style={styles.sectionTab}
          onPress={() => toggleSection("itinerary")}
        >
          <Text style={styles.sectionLabel}>🚀 Itinerario de Metas</Text>
          <Ionicons
            name={expanded === "itinerary" ? "chevron-up" : "chevron-down"}
            size={20}
          />
        </TouchableOpacity>

        {expanded === "itinerary" && (
          <View style={styles.itineraryList}>
            {tempSchedule.length > 0 ? (
              tempSchedule.map((item) => (
                <View key={item.id} style={styles.itineraryItem}>
                  <Text style={styles.itemTime}>{item.start}</Text>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemGoal}>{item.goalTitle}</Text>
                    <Text style={styles.itemStep}>{item.minutes} min</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Presiona el botón de organizar para ver tu ruta.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveAndClose}>
          <Text style={styles.saveBtnText}>Confirmar Itinerario</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  content: { flex: 1 },
  sectionTab: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    backgroundColor: "#fff",
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionLabel: { fontSize: 16, fontWeight: "600" },
  configBox: { padding: 20, backgroundColor: "#fff" },
  helperText: { color: "#666", marginBottom: 15 },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  timeInput: {
    fontSize: 24,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#f59e0b",
    width: 80,
    textAlign: "center",
  },
  label: { fontSize: 12, color: "#999", textAlign: "center" },
  magicBtn: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  magicBtnText: { color: "#fff", fontWeight: "bold" },
  eventList: { padding: 15 },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  eventTimeBar: {
    width: 4,
    backgroundColor: "#2196F3",
    borderRadius: 2,
    marginRight: 10,
  },
  eventTitle: { fontWeight: "700", color: "#1976D2" },
  eventTime: { fontSize: 12, color: "#444" },
  itineraryList: { padding: 15 },
  itineraryItem: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
  },
  itemTime: { width: 60, fontWeight: "bold", color: "#f59e0b" },
  itemContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 1,
  },
  itemGoal: { fontWeight: "bold" },
  itemStep: { fontSize: 12, color: "#666" },
  footer: { padding: 20, backgroundColor: "#fff" },
  saveBtn: {
    backgroundColor: "#f59e0b",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 30 },
});
