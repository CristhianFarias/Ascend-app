// src/components/SmartGoalCreator.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CATEGORY_SUBCATEGORIES,
  COLOR_PALETTE,
  FITNESS_STYLES,
  GOAL_CATEGORIES,
  WORKOUT_ENVIRONMENTS,
} from "./smartGoalCreatorOptions";
import { useSmartGoalForm } from "../hooks/useSmartGoalForm";
import {
  GoalObjective,
  GoalPriority,
  GoalTemplate,
} from "../store/useGoalsStore";
import type {
  PlanAvailability,
  PlanLevel,
} from "../store/personalPlanDesigner";

type Props = {
  editId?: string | null;
  onClose: () => void;
};

const styles = StyleSheet.create({
  styleBox: { width: 220, padding: 18, justifyContent: "space-between" },
  refreshTemplateBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  refreshTemplateText: {
    fontWeight: "800",
    color: "#374151",
    textAlign: "center",
  },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  colorChip: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorChipActive: { borderColor: "#111827" },
  resetColorBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  resetColorText: { fontWeight: "700", color: "#374151" },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 26, fontWeight: "800", color: "#111827" },
  closeBtn: { padding: 8 },
  content: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 28 },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  multilineInput: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  chipTextActive: { color: "#fff" },
  templateScroll: { marginTop: 12 },
  templateBox: {
    width: 240,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 16,
  },
  templateActive: { borderColor: "#111827" },
  templateTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  templateDesc: { fontSize: 14, color: "#475569", marginTop: 6 },
  templateMeta: { fontSize: 13, color: "#64748b", marginTop: 12 },
  previewContainer: { flexDirection: "row", gap: 20, marginTop: 12 },
  previewBox: { alignItems: "center" },
  previewLabel: { fontSize: 14, color: "#475569", marginBottom: 8 },
  iconPreview: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  colorPreview: {
    width: 100,
    height: 100,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  stepCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  stepRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  stepInput: { flex: 1 },
  deleteStep: {
    alignSelf: "flex-end",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
  },
  deleteStepText: { color: "#dc2626", fontWeight: "600" },
  addStepBtn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  addStepText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  btnPrimary: {
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
  btnDanger: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#dc2626",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  btnTextWhite: { color: "#fff", fontWeight: "700", fontSize: 17 },
  emptySteps: { color: "#64748b", fontStyle: "italic", marginTop: 8 },
  // Estilos agregados que estaban al final
  fitnessSummaryCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  fitnessSummaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  fitnessSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  fitnessSummaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  fitnessSummaryValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  emptyTemplateBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyTemplateText: {
    color: "#475569",
    fontWeight: "600",
    textAlign: "center",
  },
  assistantCard: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  assistantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  assistantTitle: { fontSize: 17, fontWeight: "900", color: "#111827" },
  assistantText: { marginTop: 8, color: "#4b5563", fontWeight: "600" },
  assistantAction: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  assistantActionText: { color: "#fff", fontWeight: "800" },
  advisorNote: { color: "#4338ca", fontWeight: "700", marginTop: 6 },
  sessionChip: {
    minWidth: 130,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sessionChipTitle: { fontSize: 14, fontWeight: "900", color: "#111827" },
  sessionChipMeta: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#475569" },
  sessionGroup: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe3ee",
  },
  sessionGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionGroupTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  sessionGroupMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  addSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  stepHint: {
    marginBottom: 10,
    color: "#475569",
    fontWeight: "700",
    fontSize: 13,
  },
});

export default function SmartGoalCreator({ editId, onClose }: Props) {
  const {
    accentColor,
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    subCategory,
    setSubCategory,
    workoutEnvironment,
    setWorkoutEnvironment,
    workoutStyle,
    setWorkoutStyle,
    priority,
    setPriority,
    deadline,
    setDeadline,
    color,
    setColor,
    setCustomColor,
    icon,
    steps,
    plan,
    groupedSteps,
    sessionOptions,
    selectedTemplateId,
    setSelectedTemplateId,
    showDatePicker,
    setShowDatePicker,
    isFitness,
    visibleTemplates,
    creatorMode,
    setCreatorMode,
    primaryObjective,
    setPrimaryObjective,
    secondaryObjectives,
    toggleSecondaryObjective,
    planAvailability,
    setPlanAvailability,
    planLevel,
    setPlanLevel,
    planNotes,
    categoryObjectives,
    objectiveLabels,
    frequencyPerWeek,
    getCategoryMeta,
    applyTemplate,
    applyPersonalPlan,
    refreshCurrentTemplate,
    addStep,
    updateLocalStep,
    removeLocalStep,
    handleSave,
    handleDelete,
    onConfirmDate,
    resetCategoryColor,
  } = useSmartGoalForm({ editId, onClose });
  // ==================== RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {editId ? "Editar Meta" : "Nueva Meta"}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={28} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Modo de creación: separa control manual/plantillas del asistente guiado. */}
        {!editId && (
          <View style={styles.section}>
            <Text style={styles.label}>Forma de creación</Text>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setCreatorMode("design")}
                style={[
                  styles.chip,
                  creatorMode === "design" && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    creatorMode === "design" && styles.chipTextActive,
                  ]}
                >
                  Diseñar plan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCreatorMode("assistant")}
                style={[
                  styles.chip,
                  creatorMode === "assistant" && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    creatorMode === "assistant" && styles.chipTextActive,
                  ]}
                >
                  Asistente
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.label}>Título de la meta</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Correr 5km todas las semanas"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Detalles sobre tu meta..."
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Categoría */}
        <View style={styles.section}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.row}>
            {GOAL_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setSubCategory("General");
                  setWorkoutEnvironment("Mixto");
                  setWorkoutStyle("General");
                  setSelectedTemplateId(null);
                }}
                style={[styles.chip, category === cat && styles.chipActive]}
              >
                <Feather
                  name={getCategoryMeta(cat).icon as any}
                  size={20}
                  color={category === cat ? "#fff" : "#374151"}
                />
                <Text
                  style={[
                    styles.chipText,
                    category === cat && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Objetivos combinables del plan personal. */}
        <View style={styles.section}>
          <Text style={styles.label}>Objetivo principal</Text>
          <View style={styles.row}>
            {categoryObjectives.map((objective: GoalObjective) => (
              <TouchableOpacity
                key={objective}
                onPress={() => {
                  setPrimaryObjective(objective);
                  if (secondaryObjectives.includes(objective)) {
                    toggleSecondaryObjective(objective);
                  }
                }}
                style={[
                  styles.chip,
                  primaryObjective === objective && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    primaryObjective === objective && styles.chipTextActive,
                  ]}
                >
                  {objectiveLabels[objective]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>
            Objetivos secundarios
          </Text>
          <View style={styles.row}>
            {categoryObjectives
              .filter((objective: GoalObjective) => objective !== primaryObjective)
              .map((objective: GoalObjective) => {
                const active = secondaryObjectives.includes(objective);
                return (
                  <TouchableOpacity
                    key={objective}
                    onPress={() => toggleSecondaryObjective(objective)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {objectiveLabels[objective]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>

        {/* Subcategoría */}
        {creatorMode === "design" && (
        <View style={styles.section}>
          <Text style={styles.label}>Subcategoría</Text>
          <View style={styles.row}>
            {(CATEGORY_SUBCATEGORIES[category] ?? ["General"]).map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => setSubCategory(sub)}
                style={[styles.chip, subCategory === sub && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    subCategory === sub && styles.chipTextActive,
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        )}

        {/* Fitness: Entorno + Estilo */}
        {creatorMode === "design" && isFitness && (
          <View style={styles.section}>
            <Text style={styles.label}>Entorno de entrenamiento</Text>
            <View style={styles.row}>
              {WORKOUT_ENVIRONMENTS.map((env) => (
                <TouchableOpacity
                  key={env}
                  onPress={() => setWorkoutEnvironment(env)}
                  style={[
                    styles.chip,
                    workoutEnvironment === env && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      workoutEnvironment === env && styles.chipTextActive,
                    ]}
                  >
                    {env}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>
              Estilo de rutina
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
            >
              <TouchableOpacity
                onPress={refreshCurrentTemplate}
                style={styles.refreshTemplateBtn}
              >
                <Text style={styles.refreshTemplateText}>
                  Reaplicar plantilla con selección actual
                </Text>
              </TouchableOpacity>

              {FITNESS_STYLES.map((styleName) => (
                <TouchableOpacity
                  key={styleName}
                  onPress={() => setWorkoutStyle(styleName)}
                  style={[
                    styles.templateBox,
                    styles.styleBox,
                    workoutStyle === styleName && styles.templateActive,
                  ]}
                >
                  <Text style={styles.templateTitle}>{styleName}</Text>
                  <Text style={styles.templateDesc}>
                    {styleName === "General"
                      ? "Rutina base flexible"
                      : `Plan adaptado para ${workoutEnvironment.toLowerCase()}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Plantillas rápidas */}
        {creatorMode === "design" && (
        <View style={styles.section}>
          <Text style={styles.label}>Plantillas rápidas</Text>

          {visibleTemplates.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
            >
              {visibleTemplates.map((tmpl) => (
                <View key={tmpl.id} style={{ marginRight: 16 }}>
                  <TouchableOpacity
                    onPress={() => applyTemplate(tmpl.id)}
                    style={[
                      styles.templateBox,
                      selectedTemplateId === tmpl.id && styles.templateActive,
                    ]}
                  >
                    <Text style={styles.templateTitle}>{tmpl.name}</Text>
                    <Text style={styles.templateDesc}>{tmpl.description}</Text>
                    <Text style={styles.templateMeta}>
                      {isFitness
                        ? `${(tmpl as GoalTemplate).subCategory ?? "General"} • ${(tmpl as GoalTemplate).workoutStyle ?? "General"} • ${(tmpl as GoalTemplate).workoutEnvironment ?? "Mixto"}`
                        : `${(tmpl as GoalTemplate).subCategory ?? "General"} • ${tmpl.frequencyPerWeek || 1}x/semana`}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyTemplateBox}>
              <Text style={styles.emptyTemplateText}>
                No hay plantillas que coincidan con tu selección actual.
              </Text>
            </View>
          )}
        </View>
        )}

        {/* Prioridad */}
        <View style={styles.section}>
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.row}>
            {(["1", "2", "3"] as GoalPriority[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[styles.chip, priority === p && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    priority === p && styles.chipTextActive,
                  ]}
                >
                  {p === "1" ? "🔥 Alta" : p === "2" ? "⚖️ Media" : "📌 Baja"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fecha límite */}
        <View style={styles.section}>
          <Text style={styles.label}>Fecha límite (opcional)</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.chip}
          >
            <Feather name="calendar" size={18} color="#374151" />
            <Text style={styles.chipText}>
              {deadline
                ? new Date(deadline).toLocaleDateString("es-ES")
                : "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>
          {deadline && (
            <TouchableOpacity
              onPress={() => setDeadline(undefined)}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: "#dc2626", fontWeight: "600" }}>
                Quitar fecha límite
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Asistente guiado: usa plantillas y reglas locales, sin IA externa. */}
        {!editId && creatorMode === "assistant" && (
          <View style={styles.assistantCard}>
            <View style={styles.assistantHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.assistantTitle}>
                  Asistente de plan personal
                </Text>
                <Text style={styles.assistantText}>
                  Combina objetivo, nivel y disponibilidad para crear una base editable.
                </Text>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>
              Disponibilidad
            </Text>
            <View style={styles.row}>
              {(
                [
                  ["light", "Ligera"],
                  ["normal", "Normal"],
                  ["intense", "Intensa"],
                ] as [PlanAvailability, string][]
              ).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setPlanAvailability(value)}
                  style={[
                    styles.chip,
                    planAvailability === value && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      planAvailability === value && styles.chipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {isFitness && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>
                  Entorno de entrenamiento
                </Text>
                <View style={styles.row}>
                  {WORKOUT_ENVIRONMENTS.map((env) => (
                    <TouchableOpacity
                      key={env}
                      onPress={() => setWorkoutEnvironment(env)}
                      style={[
                        styles.chip,
                        workoutEnvironment === env && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          workoutEnvironment === env && styles.chipTextActive,
                        ]}
                      >
                        {env}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>Nivel</Text>
            <View style={styles.row}>
              {(
                [
                  ["beginner", "Inicial"],
                  ["intermediate", "Intermedio"],
                  ["advanced", "Avanzado"],
                ] as [PlanLevel, string][]
              ).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setPlanLevel(value)}
                  style={[
                    styles.chip,
                    planLevel === value && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      planLevel === value && styles.chipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={applyPersonalPlan}
              style={styles.assistantAction}
            >
              <Text style={styles.assistantActionText}>Generar plan editable</Text>
            </TouchableOpacity>
          </View>
        )}

        {planNotes.length > 0 && (
          <View style={styles.assistantCard}>
            <Text style={styles.assistantTitle}>Propuesta aplicada</Text>
            {planNotes.map((note) => (
              <Text key={note} style={styles.advisorNote}>
                {note}
              </Text>
            ))}
          </View>
        )}

        {plan.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Sesiones rotativas</Text>
            <View style={styles.row}>
              {plan.map((session, index) => (
                <View key={`${session.name}-${index}`} style={styles.sessionChip}>
                  <Text style={styles.sessionChipTitle}>{session.name}</Text>
                  <Text style={styles.sessionChipMeta}>
                    {session.exercises.length} pasos
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Vista previa + Color */}
        <View style={styles.section}>
          <Text style={styles.label}>Vista previa</Text>
          <View style={styles.previewContainer}>
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Icono</Text>
              <View style={styles.iconPreview}>
                <Feather name={icon as any} size={50} color="#374151" />
              </View>
            </View>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Color</Text>
              <View style={[styles.colorPreview, { backgroundColor: color }]} />
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>Elegir color</Text>
          <View style={styles.colorGrid}>
            {COLOR_PALETTE.map((c) => {
              const active = c === color;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setColor(c);
                    setCustomColor(true);
                  }}
                  style={[
                    styles.colorChip,
                    { backgroundColor: c },
                    active && styles.colorChipActive,
                  ]}
                >
                  {active && <Feather name="check" size={18} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={resetCategoryColor}
            style={styles.resetColorBtn}
          >
            <Text style={styles.resetColorText}>
              Restablecer color por categoría
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sesiones del plan: organiza pasos por día/sesión para que la rutina sea legible. */}
        <View style={styles.section}>
          <Text style={styles.label}>Sesiones del plan</Text>
          {steps.length === 0 && (
            <Text style={styles.emptySteps}>
              Aún no hay pasos. Agrega uno para empezar.
            </Text>
          )}

          {groupedSteps.map((group) => (
            <View key={group.key} style={styles.sessionGroup}>
              <View style={styles.sessionGroupHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionGroupTitle}>{group.title}</Text>
                  <Text style={styles.sessionGroupMeta}>
                    {group.steps.reduce((total, step) => total + (step.duration || 0), 0)} min
                    {" · "}
                    {group.steps.length} pasos
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => addStep(group.sessionName)}
                  style={styles.addSmallBtn}
                >
                  <Feather name="plus" size={16} color="#111827" />
                </TouchableOpacity>
              </View>

              {group.steps.map((step) => {
                const muscles = Array.isArray(step.metadata?.muscles)
                  ? step.metadata?.muscles.join(", ")
                  : undefined;

                return (
                  <View key={step.id} style={styles.stepCard}>
                    {muscles && (
                      <Text style={styles.stepHint}>Trabaja: {muscles}</Text>
                    )}

                    {sessionOptions.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.previewLabel}>Mover a sesión</Text>
                        <View style={styles.row}>
                          {sessionOptions.map((sessionName) => {
                            const active = step.session === sessionName;
                            return (
                              <TouchableOpacity
                                key={`${step.id}-${sessionName}`}
                                onPress={() =>
                                  updateLocalStep(step.id, { session: sessionName })
                                }
                                style={[styles.chip, active && styles.chipActive]}
                              >
                                <Text
                                  style={[
                                    styles.chipText,
                                    active && styles.chipTextActive,
                                  ]}
                                >
                                  {sessionName}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    <TextInput
                      style={styles.input}
                      value={step.title}
                      onChangeText={(t) => updateLocalStep(step.id, { title: t })}
                      placeholder="Título del paso"
                      placeholderTextColor="#64748b"
                    />
                    <View style={styles.stepRow}>
                      <TextInput
                        style={[styles.input, styles.stepInput]}
                        keyboardType="numeric"
                        value={String(step.duration)}
                        onChangeText={(v) =>
                          updateLocalStep(step.id, { duration: Number(v) || 10 })
                        }
                        placeholder="Duración (min)"
                        placeholderTextColor="#64748b"
                      />
                      <TextInput
                        style={[styles.input, styles.stepInput]}
                        keyboardType="numeric"
                        value={step.sets ? String(step.sets) : ""}
                        onChangeText={(v) =>
                          updateLocalStep(step.id, {
                            sets: v ? Number(v) : undefined,
                          })
                        }
                        placeholder="Sets"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                    <View style={styles.stepRow}>
                      <TextInput
                        style={[styles.input, styles.stepInput]}
                        keyboardType="numeric"
                        value={step.reps ? String(step.reps) : ""}
                        onChangeText={(v) =>
                          updateLocalStep(step.id, {
                            reps: v ? Number(v) : undefined,
                          })
                        }
                        placeholder="Reps"
                        placeholderTextColor="#64748b"
                      />
                      <TextInput
                        style={[styles.input, styles.stepInput]}
                        keyboardType="numeric"
                        value={step.rest ? String(step.rest) : ""}
                        onChangeText={(v) =>
                          updateLocalStep(step.id, {
                            rest: v ? Number(v) : undefined,
                          })
                        }
                        placeholder="Descanso (seg)"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => removeLocalStep(step.id)}
                      style={styles.deleteStep}
                    >
                      <Text style={styles.deleteStepText}>Eliminar paso</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}

          <TouchableOpacity onPress={() => addStep()} style={styles.addStepBtn}>
            <Feather name="plus" size={24} color="#374151" />
            <Text style={styles.addStepText}>Añadir nuevo paso</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen Fitness (solo visible en Fitness) */}
        {isFitness && (
          <View style={styles.fitnessSummaryCard}>
            <Text style={styles.fitnessSummaryTitle}>Configuración actual</Text>
            <View style={styles.fitnessSummaryRow}>
              <Text style={styles.fitnessSummaryLabel}>Entorno</Text>
              <Text style={styles.fitnessSummaryValue}>
                {workoutEnvironment}
              </Text>
            </View>
            <View style={styles.fitnessSummaryRow}>
              <Text style={styles.fitnessSummaryLabel}>Estilo</Text>
              <Text style={styles.fitnessSummaryValue}>{workoutStyle}</Text>
            </View>
            <View style={styles.fitnessSummaryRow}>
              <Text style={styles.fitnessSummaryLabel}>Subcategoría</Text>
              <Text style={styles.fitnessSummaryValue}>{subCategory}</Text>
            </View>
            <View style={styles.fitnessSummaryRow}>
              <Text style={styles.fitnessSummaryLabel}>
                Sesiones del plan
              </Text>
              <Text style={styles.fitnessSummaryValue}>
                {plan.length}
              </Text>
            </View>
            <View style={styles.fitnessSummaryRow}>
              <Text style={styles.fitnessSummaryLabel}>Frecuencia</Text>
              <Text style={styles.fitnessSummaryValue}>
                {frequencyPerWeek}x/semana
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer fijo */}
      <View style={styles.footer}>
        {editId && (
          <TouchableOpacity onPress={handleDelete} style={styles.btnDanger}>
            <Text style={styles.btnTextWhite}>Eliminar Meta</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.btnPrimary, { backgroundColor: accentColor }]}
        >
          <Text style={styles.btnTextWhite}>
            {editId ? "Guardar Cambios" : "Crear Meta"}
          </Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={onConfirmDate}
        onCancel={() => setShowDatePicker(false)}
        locale="es-ES"
      />
    </SafeAreaView>
  );
}



