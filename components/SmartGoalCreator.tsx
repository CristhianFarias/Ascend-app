// src/components/SmartGoalCreator.tsx
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import useGoalsStore, {
  GoalCategory,
  GoalPriority,
  Step,
} from "../store/useGoalsStore";

type Props = {
  editId?: string | null;
  onClose: () => void;
};

const styles = StyleSheet.create({
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
  previewBox: {
    alignItems: "center",
  },
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
    backgroundColor: "#111827",
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Otro");
  const [priority, setPriority] = useState<GoalPriority>("2");
  const [deadline, setDeadline] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string>("#6b7280");
  const [icon, setIcon] = useState<string>("target");
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const templatesByCategory = useMemo(
    () => getTemplatesByCategory(category),
    [category],
  );

  // Auto color/icon
  useEffect(() => {
    const meta = getCategoryMeta(category);
    setColor(meta.color);
    setIcon(meta.icon);
  }, [category]);

  // Carga / reset
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
      }
    } else {
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
    }
  }, [editId]);

  // Aplicar plantilla
  const applyTemplate = (tmplId: string) => {
    const tmpl = useGoalsStore
      .getState()
      .templates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    setSelectedTemplateId(tmplId);
    setTitle(tmpl.name ?? "");
    setDescription(tmpl.description ?? "");

    const builtSteps: Step[] = [];
    tmpl.defaultPlan?.forEach((session) => {
      session.exercises.forEach((ex) => {
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
    setSteps(builtSteps);
  };

  // Pasos locales
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

  // Guardar
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
    Alert.alert("Eliminar", "¿Seguro que quieres eliminar esta meta?", [
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
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    );
    setShowDatePicker(false);
  };

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

        {/* Plantillas */}
        {templatesByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Plantillas rápidas</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
            >
              {templatesByCategory.map((tmpl) => (
                <TouchableOpacity
                  key={tmpl.id}
                  onPress={() => applyTemplate(tmpl.id)}
                  style={[
                    styles.templateBox,
                    selectedTemplateId === tmpl.id && styles.templateActive,
                  ]}
                >
                  <Text style={styles.templateTitle}>{tmpl.name}</Text>
                  <Text style={styles.templateDesc}>{tmpl.description}</Text>
                  <Text style={styles.templateMeta}>
                    ≈ {tmpl.estimatedMinutes} min • {tmpl.frequencyPerWeek || 1}
                    x/semana
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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

        {/* Preview icono y color */}
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
        </View>

        {/* Pasos */}
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botones fijos abajo */}
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
