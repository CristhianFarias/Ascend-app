// src/components/SmartGoalCreator.tsx
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import useGoalsStore, {
  GoalCategory,
  GoalPriority,
  GoalTemplate,
  Step,
  WorkoutEnvironment,
} from "../store/useGoalsStore";

type Props = {
  editId?: string | null;
  onClose: () => void;
};

// ==================== CONSTANTES GLOBALES ====================
const CATEGORY_SUBCATEGORIES: Record<GoalCategory, string[]> = {
  Fitness: [
    "General",
    "Casa",
    "Gimnasio",
    "Calistenia",
    "Atletismo",
    "Fuerza",
    "Hipertrofia",
    "Resistencia",
    "Movilidad",
  ],
  Estudio: ["General", "Pomodoro", "Repaso", "Exámenes", "Lectura"],
  Carrera: ["General", "Portafolio", "CV", "Entrevistas", "Postulaciones"],
  Salud: ["General", "Sueño", "Nutrición", "Movimiento", "Autocuidado"],
  Finanzas: ["General", "Presupuesto", "Ahorro", "Inversión", "Deudas"],
  Otro: ["General", "Productividad", "Hábito", "Aprendizaje", "Orden"],
};

const FITNESS_STYLES = [
  "General",
  "Arnold Split",
  "Heavy Duty",
  "Full Body",
  "Push Pull Legs",
  "Torso Pierna",
  "Upper Lower",
  "Calistenia",
  "Atletismo",
  "Movilidad",
  "Resistencia",
];

const WORKOUT_ENVIRONMENTS: WorkoutEnvironment[] = [
  "Casa",
  "Gimnasio",
  "Mixto",
];

const COLOR_PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#111827",
  "#6b7280",
];

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
  templateDesc: { fontSize: 14, color: "#6b7280", marginTop: 6 },
  templateMeta: { fontSize: 13, color: "#9ca3af", marginTop: 12 },
  previewContainer: { flexDirection: "row", gap: 20, marginTop: 12 },
  previewBox: { alignItems: "center" },
  previewLabel: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
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
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
  emptySteps: { color: "#9ca3af", fontStyle: "italic", marginTop: 8 },
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
    color: "#6b7280",
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
    color: "#6b7280",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default function SmartGoalCreator({ editId, onClose }: Props) {
  const tempIdCounter = useRef(0);

  const {
    addGoalSafe,
    createGoalFromTemplate,
    updateGoal,
    deleteGoal,
    getGoalById,
    getTemplatesByCategory,
    getCategoryMeta,
    settings,
  } = useGoalsStore();

  const accentColor = settings.accentColor || "#f59e0b";

  // ==================== ESTADOS ====================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Otro");
  const [subCategory, setSubCategory] = useState<string>("General");
  const [workoutEnvironment, setWorkoutEnvironment] =
    useState<WorkoutEnvironment>("Mixto");
  const [workoutStyle, setWorkoutStyle] = useState<string>("General");
  const [priority, setPriority] = useState<GoalPriority>("2");
  const [deadline, setDeadline] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string>("#6b7280");
  const [customColor, setCustomColor] = useState(false);
  const [icon, setIcon] = useState<string>("target");
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ==================== COMPUTADOS ====================
  const isFitness = category === "Fitness";

  const templatesByCategory = getTemplatesByCategory(category);

  const visibleTemplates = templatesByCategory.filter((tmpl) => {
    const tmplTyped = tmpl as GoalTemplate;
    const tmplSub = tmplTyped.subCategory ?? "General";
    const tmplStyle = tmplTyped.workoutStyle ?? "General";
    const tmplEnv = tmplTyped.workoutEnvironment ?? "Mixto";

    const matchesSubCategory =
      subCategory === "General" || tmplSub === subCategory;

    if (isFitness) {
      const matchesStyle =
        workoutStyle === "General" || tmplStyle === workoutStyle;
      const matchesEnvironment =
        workoutEnvironment === "Mixto" ||
        tmplEnv === workoutEnvironment ||
        !tmplEnv;

      return matchesSubCategory && matchesStyle && matchesEnvironment;
    }

    return matchesSubCategory;
  });

  // ==================== EFECTOS ====================
  useEffect(() => {
    const meta = getCategoryMeta(category);
    setIcon(meta.icon);
    setSubCategory("General");
    setWorkoutEnvironment("Mixto");
    setWorkoutStyle("General");

    if (!customColor) {
      setColor(meta.color);
    }
  }, [category, customColor, getCategoryMeta]);

  useEffect(() => {
    tempIdCounter.current = 0;

    if (editId) {
      const g = getGoalById(editId);
      if (g) {
        setTitle(g.title);
        setDescription(g.description ?? "");
        setCategory(g.category);
        setPriority(g.priority);
        setDeadline(g.deadline ?? undefined);
        setColor(g.color);
        setIcon(g.icon ?? "target");
        setSteps(g.steps);
        setSelectedTemplateId(g.templateId ?? null);
        setSubCategory((g as GoalTemplate).subCategory ?? "General");
        setWorkoutEnvironment(
          (g as GoalTemplate).workoutEnvironment ?? "Mixto",
        );
        setWorkoutStyle((g as GoalTemplate).workoutStyle ?? "General");
      }
    } else {
      // reset
      setTitle("");
      setDescription("");
      setCategory("Otro");
      setPriority("2");
      setDeadline(undefined);
      const meta = getCategoryMeta("Otro");
      setColor(meta.color);
      setIcon(meta.icon);
      setSteps([]);
      setSelectedTemplateId(null);
      setSubCategory("General");
      setWorkoutEnvironment("Mixto");
      setWorkoutStyle("General");
    }
  }, [editId, getGoalById, getCategoryMeta]);

  // ==================== FUNCIONES ====================
  const buildStepsFromSessions = (sessions: any[] = []): Step[] => {
    const builtSteps: Step[] = [];
    sessions.forEach((session) => {
      session.exercises.forEach((ex: any) => {
        builtSteps.push({
          id: `temp-${tempIdCounter.current++}`,
          title: ex.name ?? "Paso",
          duration: ex.duration ?? 10,
          completed: false,
          order: builtSteps.length + 1,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          session: session.name,
        });
      });
    });
    return builtSteps;
  };

  const applyTemplate = (tmplId: string) => {
    const tmpl = useGoalsStore
      .getState()
      .templates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    const env = isFitness ? workoutEnvironment : undefined;
    const tmplTyped = tmpl as GoalTemplate;
    const chosenPlan = isFitness
      ? (tmplTyped.environmentPlans?.[env as WorkoutEnvironment] ??
        tmplTyped.environmentPlans?.Mixto ??
        tmplTyped.defaultPlan ??
        [])
      : (tmplTyped.defaultPlan ?? []);

    setSelectedTemplateId(tmplId);
    setCategory(tmpl.category);
    setSubCategory((tmpl as GoalTemplate).subCategory ?? "General");
    setWorkoutEnvironment((tmpl as GoalTemplate).workoutEnvironment ?? "Mixto");
    setWorkoutStyle((tmpl as GoalTemplate).workoutStyle ?? "General");
    setTitle(tmpl.name ?? "");
    setDescription(tmpl.description ?? "");

    setSteps(buildStepsFromSessions(chosenPlan));
  };

  const refreshCurrentTemplate = () => {
    if (!selectedTemplateId) {
      Alert.alert("Sin plantilla", "Primero selecciona una plantilla.");
      return;
    }

    const tmpl = useGoalsStore
      .getState()
      .templates.find((t) => t.id === selectedTemplateId);
    if (!tmpl) {
      Alert.alert("Plantilla no encontrada");
      return;
    }

    const tmplTyped = tmpl as GoalTemplate;
    const chosenPlan = isFitness
      ? (tmplTyped.environmentPlans?.[
          workoutEnvironment as WorkoutEnvironment
        ] ??
        tmplTyped.environmentPlans?.Mixto ??
        tmplTyped.defaultPlan ??
        [])
      : (tmplTyped.defaultPlan ?? []);

    setSteps(buildStepsFromSessions(chosenPlan));

    Alert.alert(
      "Plantilla actualizada",
      "Se reaplicó con tu selección actual.",
    );
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: `temp-${tempIdCounter.current++}`,
        title: "Nuevo paso",
        duration: 10,
        completed: false,
        order: prev.length + 1,
      },
    ]);
  };

  const updateLocalStep = (stepId: string, patch: Partial<Step>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    );
  };

  const removeLocalStep = (stepId: string) => {
    setSteps((prev) =>
      prev
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 })),
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    const stepsForSave = editId
      ? steps
      : steps.map(({ id, ...rest }) => rest as Step);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      deadline,
      color,
      icon,
      templateId: selectedTemplateId ?? undefined,
      steps: stepsForSave,
      subCategory,
      workoutEnvironment: isFitness ? workoutEnvironment : undefined,
      workoutStyle: isFitness ? workoutStyle : undefined,
    };

    if (editId) {
      updateGoal(editId, payload);
    } else {
      if (selectedTemplateId) {
        createGoalFromTemplate(selectedTemplateId, payload);
      } else {
        addGoalSafe(payload);
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert("Eliminar meta", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteGoal(editId);
          onClose();
        },
      },
    ]);
  };

  const onConfirmDate = (date: Date) => {
    setDeadline(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`,
    );
    setShowDatePicker(false);
  };

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
        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.label}>Título de la meta</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Correr 5km todas las semanas"
            placeholderTextColor="#9ca3af"
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
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Categoría */}
        <View style={styles.section}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.row}>
            {(
              [
                "Fitness",
                "Estudio",
                "Carrera",
                "Salud",
                "Finanzas",
                "Otro",
              ] as GoalCategory[]
            ).map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setCategory(cat);
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

        {/* Subcategoría */}
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

        {/* Fitness: Entorno + Estilo */}
        {isFitness && (
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
            onPress={() => {
              const meta = getCategoryMeta(category);
              setColor(meta.color);
              setCustomColor(false);
            }}
            style={styles.resetColorBtn}
          >
            <Text style={styles.resetColorText}>
              Restablecer color por categoría
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pasos / Ejercicios */}
        <View style={styles.section}>
          <Text style={styles.label}>Pasos / Ejercicios</Text>
          {steps.length === 0 && (
            <Text style={styles.emptySteps}>
              Aún no hay pasos. Agrega uno para empezar.
            </Text>
          )}

          {steps.map((step) => (
            <View key={step.id} style={styles.stepCard}>
              <TextInput
                style={styles.input}
                value={step.title}
                onChangeText={(t) => updateLocalStep(step.id, { title: t })}
                placeholder="Título del paso"
                placeholderTextColor="#9ca3af"
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
                  placeholderTextColor="#9ca3af"
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
                  placeholderTextColor="#9ca3af"
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
                  placeholderTextColor="#9ca3af"
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
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <TouchableOpacity
                onPress={() => removeLocalStep(step.id)}
                style={styles.deleteStep}
              >
                <Text style={styles.deleteStepText}>Eliminar paso</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity onPress={addStep} style={styles.addStepBtn}>
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
                Plantillas visibles
              </Text>
              <Text style={styles.fitnessSummaryValue}>
                {visibleTemplates.length}
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
