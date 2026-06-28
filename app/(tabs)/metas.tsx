// app/(tabs)/metas.tsx
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FocusMode from "../../components/Focusmode";
import SmartGoalCreator from "../../components/SmartGoalCreator";
import useGoalsStore, { Goal } from "../../store/useGoalsStore";

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#111827" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  listContent: { padding: 20, paddingTop: 12 },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
  cardBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDesc: { marginTop: 8, fontSize: 15 },
  progressText: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyList: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 40,
  },

  // Detalle modal
  detailContainer: { flex: 1 },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  detailTitle: { fontSize: 26, fontWeight: "800" },
  detailContent: { padding: 20 },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 16,
  },
  detailBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  detailMetaText: { fontSize: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 12,
  },
  planSession: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionName: { fontWeight: "700", fontSize: 16 },
  exerciseText: { marginTop: 8, marginLeft: 8 },
  stepItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stepDetails: { flex: 1 },
  stepTitle: { fontWeight: "600", fontSize: 16 },
  stepMeta: { fontSize: 14, marginTop: 4 },
  checkbox: { fontSize: 28 },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  focusBtn: {},
  todayBtn: {
    borderWidth: 1,
  },
  btnTextWhite: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnTextDark: { fontWeight: "700", fontSize: 16 },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

/* ============================
   Sub-componente MetaCard
   ============================ */
const MetaCard = ({
  item,
  onPress,
  colors,
}: {
  item: Goal;
  onPress: (id: string) => void;
  colors: any;
}) => {
  const done = item.steps.filter((s) => s.completed).length;
  const total = item.steps.length || 1;
  const percent = Math.round((done / total) * 100);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={[styles.cardDesc, { color: colors.subtext }]}>
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.progressText, { color: colors.text }]}>
            Progreso: {percent}% ({done}/{total} pasos)
          </Text>
        </View>
        <View
          style={[
            styles.cardBadge,
            { backgroundColor: item.color || "#6b7280" },
          ]}
        >
          <Feather name={item.icon as any} size={28} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MetasScreen() {
  const goals = useGoalsStore((s) => s.getGoalsListMemo());
  const startFocus = useGoalsStore((s) => s.startFocus);
  const deleteGoal = useGoalsStore((s) => s.deleteGoal);
  const addGoalSafe = useGoalsStore((s) => s.addGoalSafe);
  const getGoalById = useGoalsStore((s) => s.getGoalById);
  const toggleStep = useGoalsStore((s) => s.toggleStep);
  const areAllStepsCompleted = useGoalsStore((s) => s.areAllStepsCompleted);
  const markGoalCompletedToday = useGoalsStore((s) => s.markGoalCompletedToday);
  const settings = useGoalsStore((s) => s.settings);

  const { colors, dark } = useTheme();
  const bg = colors.background ?? (dark ? "#0b1220" : "#f9fafb");
  const card = colors.card ?? (dark ? "#1f2937" : "#ffffff");
  const text = colors.text ?? (dark ? "#f3f4f6" : "#111827");
  const subtext = colors.border ?? (dark ? "#9ca3af" : "#6b7280");
  const border = colors.border ?? (dark ? "#374151" : "#e5e7eb");
  const primary = colors.primary ?? settings.accentColor ?? "#111827";

  const accentColor = settings.accentColor || primary;

  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setShowCreator(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setShowCreator(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar meta", "¿Seguro que quieres eliminar esta meta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteGoal(id) },
    ]);
  };

  const handleDuplicate = (id: string) => {
    const g = getGoalById(id);
    if (!g) return;
    const clone = {
      ...g,
      id: `${g.id}-copy-${Date.now()}`,
      title: `${g.title} (copia)`,
      steps: g.steps.map((s) => ({
        ...s,
        id: `${s.id}-copy-${Date.now()}`,
        completed: false,
      })),
      totalFocusMinutes: 0,
      completedDates: [],
    };
    addGoalSafe(clone as any);
  };

  const openDetail = (id: string) => setExpandedId(id);
  const closeDetail = () => setExpandedId(null);

  const expandedGoal = expandedId ? getGoalById(expandedId) : null;

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: bg }]}>
      <View style={styles.container}>
        <View
          style={[
            styles.header,
            { backgroundColor: card, borderBottomColor: border },
          ]}
        >
          <Text style={[styles.title, { color: text }]}>Mis Metas</Text>
          <TouchableOpacity
            onPress={openCreate}
            style={[styles.addBtn, { backgroundColor: primary }]}
          >
            <Feather name="plus" size={24} color={"#fff"} />
            <Text style={styles.addBtnText}>Nueva Meta</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <Text style={[styles.emptyList, { color: subtext }]}>
            No tienes metas aún. ¡Crea tu primera meta para empezar!
          </Text>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MetaCard
                item={item}
                onPress={openDetail}
                colors={{ card, border, text, subtext }}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Creator modal */}
        <Modal
          visible={showCreator}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView
            style={[styles.detailContainer, { backgroundColor: bg }]}
          >
            <SmartGoalCreator
              editId={editingId}
              onClose={() => {
                setShowCreator(false);
                setEditingId(null);
              }}
            />
          </SafeAreaView>
        </Modal>

        {/* Detalle modal */}
        <Modal visible={!!expandedGoal} animationType="slide">
          <SafeAreaView
            style={[styles.detailContainer, { backgroundColor: bg }]}
          >
            <View
              style={[
                styles.detailHeader,
                { backgroundColor: card, borderBottomColor: border },
              ]}
            >
              <Text style={[styles.detailTitle, { color: text }]}>
                Detalle de Meta
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: card,
                    borderWidth: 1,
                    borderColor: border,
                  },
                ]}
                onPress={closeDetail}
              >
                <Feather name="x" size={28} color={subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
              {expandedGoal && (
                <>
                  <Text style={[styles.detailTitle, { color: text }]}>
                    {expandedGoal.title}
                  </Text>
                  <Text style={{ color: subtext, marginTop: 8, fontSize: 16 }}>
                    {expandedGoal.description || "Sin descripción"}
                  </Text>

                  <View style={styles.detailMetaRow}>
                    <View
                      style={[
                        styles.detailBadge,
                        { backgroundColor: expandedGoal.color },
                      ]}
                    >
                      <Feather
                        name={expandedGoal.icon as any}
                        size={36}
                        color="#fff"
                      />
                    </View>
                    <View>
                      <Text style={[styles.detailMetaText, { color: text }]}>
                        Categoría: {expandedGoal.category}
                      </Text>
                      <Text style={[styles.detailMetaText, { color: text }]}>
                        Prioridad:{" "}
                        {expandedGoal.priority === "1"
                          ? "Alta"
                          : expandedGoal.priority === "2"
                            ? "Media"
                            : "Baja"}
                      </Text>
                      {expandedGoal.deadline && (
                        <Text style={[styles.detailMetaText, { color: text }]}>
                          Límite:{" "}
                          {new Date(expandedGoal.deadline).toLocaleDateString(
                            "es-ES",
                          )}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Plan de acción */}
                  {expandedGoal.plan && expandedGoal.plan.length > 0 && (
                    <View style={{ marginTop: 32 }}>
                      <Text style={[styles.sectionTitle, { color: text }]}>
                        Plan de Acción
                      </Text>
                      {expandedGoal.plan.map((sess, i) => (
                        <View
                          key={i}
                          style={[
                            styles.planSession,
                            { backgroundColor: card, borderColor: border },
                          ]}
                        >
                          <Text style={[styles.sessionName, { color: text }]}>
                            {sess.name}
                          </Text>
                          {sess.exercises.map((ex, j) => (
                            <Text
                              key={j}
                              style={[styles.exerciseText, { color: subtext }]}
                            >
                              • {ex.name}{" "}
                              {ex.sets ? `${ex.sets}x${ex.reps ?? ""}` : ""}{" "}
                              {ex.duration ? `• ${ex.duration} min` : ""}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Pasos */}
                  <View style={{ marginTop: 32 }}>
                    <Text style={[styles.sectionTitle, { color: text }]}>
                      Pasos
                    </Text>
                    {expandedGoal.steps.map((step) => (
                      <View
                        key={step.id}
                        style={[
                          styles.stepItem,
                          { backgroundColor: card, borderColor: border },
                        ]}
                      >
                        <View style={styles.stepDetails}>
                          <Text style={[styles.stepTitle, { color: text }]}>
                            {step.title}
                          </Text>
                          <Text style={[styles.stepMeta, { color: subtext }]}>
                            {step.duration} min{" "}
                            {step.sets ? `• ${step.sets} sets` : ""}{" "}
                            {step.reps ? `• ${step.reps} reps` : ""}{" "}
                            {step.rest ? `• ${step.rest}s descanso` : ""}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => toggleStep(expandedGoal.id, step.id)}
                        >
                          <Text style={styles.checkbox}>
                            {step.completed ? "✅" : "⬜"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <View style={{ height: 120 }} />
                </>
              )}
            </ScrollView>

            {/* Acciones fijas abajo */}
            {expandedGoal && (
              <View
                style={[
                  {
                    padding: 20,
                    backgroundColor: card,
                    borderTopWidth: 1,
                    borderTopColor: border,
                  },
                ]}
              >
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.focusBtn,
                      { backgroundColor: primary },
                    ]}
                    onPress={() => startFocus(expandedGoal.id)}
                  >
                    <Text style={styles.btnTextWhite}>Iniciar Modo Focus</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.todayBtn,
                      { backgroundColor: card, borderColor: border },
                    ]}
                    onPress={() => {
                      if (areAllStepsCompleted(expandedGoal.id)) {
                        markGoalCompletedToday(expandedGoal.id);
                        Alert.alert(
                          "¡Completado!",
                          "Meta marcada como cumplida hoy.",
                        );
                      } else {
                        Alert.alert(
                          "No listo",
                          "Completa todos los pasos primero.",
                        );
                      }
                    }}
                  >
                    <Text style={[styles.btnTextDark, { color: text }]}>
                      Marcar como cumplida hoy
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 20,
                    marginTop: 16,
                  }}
                >
                  <TouchableOpacity onPress={() => openEdit(expandedGoal.id)}>
                    <Text style={{ color: accentColor, fontWeight: "600" }}>
                      Editar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDuplicate(expandedGoal.id)}
                  >
                    <Text style={{ color: "#6366f1", fontWeight: "600" }}>
                      Duplicar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(expandedGoal.id)}
                  >
                    <Text style={{ color: "#dc2626", fontWeight: "600" }}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SafeAreaView>
        </Modal>

        <FocusMode />
      </View>
    </SafeAreaView>
  );
}
