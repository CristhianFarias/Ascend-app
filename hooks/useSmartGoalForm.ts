import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import useGoalsStore, {
  GoalCategory,
  GoalObjective,
  GoalPriority,
  GoalTemplate,
  TemplateSession,
  Step,
  WorkoutEnvironment,
} from "../store/useGoalsStore";
import {
  CATEGORY_OBJECTIVES,
  OBJECTIVE_LABELS,
  PlanAvailability,
  PlanDesignerMode,
  PlanLevel,
  designPersonalPlan,
} from "../store/personalPlanDesigner";

type Params = {
  editId?: string | null;
  onClose: () => void;
};

/**
 * Maneja la lógica de negocio del formulario de metas.
 * El componente queda enfocado en pintar campos, botones y secciones.
 */
export const useSmartGoalForm = ({ editId, onClose }: Params) => {
  const tempIdCounter = useRef(0);

  const addGoalSafe = useGoalsStore((s) => s.addGoalSafe);
  const createGoalFromTemplate = useGoalsStore((s) => s.createGoalFromTemplate);
  const updateGoal = useGoalsStore((s) => s.updateGoal);
  const deleteGoal = useGoalsStore((s) => s.deleteGoal);
  const getCategoryMeta = useGoalsStore((s) => s.getCategoryMeta);
  const accentColor = useGoalsStore(
    (s) => s.settings.accentColor || "#f59e0b",
  );
  const templates = useGoalsStore((s) => s.templates);
  const editingGoal = useGoalsStore((s) =>
    editId ? s.goalsById[editId] : undefined,
  );

  const createDraftStep = (
    titleValue = "Primer paso",
    durationValue = 25,
  ): Step => ({
    id: `temp-${tempIdCounter.current++}`,
    title: titleValue,
    duration: durationValue,
    completed: false,
    order: 1,
  });

  // Estado editable del formulario.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Otro");
  const [subCategory, setSubCategory] = useState("General");
  const [workoutEnvironment, setWorkoutEnvironment] =
    useState<WorkoutEnvironment>("Mixto");
  const [workoutStyle, setWorkoutStyle] = useState("General");
  const [priority, setPriority] = useState<GoalPriority>("2");
  const [deadline, setDeadline] = useState<string | undefined>(undefined);
  const [color, setColor] = useState("#6b7280");
  const [customColor, setCustomColor] = useState(false);
  const [icon, setIcon] = useState("target");
  const [steps, setSteps] = useState<Step[]>([]);
  const [plan, setPlan] = useState<TemplateSession[]>([]);
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(7);
  const [plannedWeekdays, setPlannedWeekdays] = useState<number[] | undefined>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [creatorMode, setCreatorMode] = useState<PlanDesignerMode>("design");
  const [primaryObjective, setPrimaryObjective] =
    useState<GoalObjective>("custom");
  const [secondaryObjectives, setSecondaryObjectives] = useState<GoalObjective[]>([]);
  const [planAvailability, setPlanAvailability] =
    useState<PlanAvailability>("normal");
  const [planLevel, setPlanLevel] =
    useState<PlanLevel>("intermediate");
  const [planNotes, setPlanNotes] = useState<string[]>([]);

  const isFitness = category === "Fitness";
  const templatesByCategory = useMemo(
    () => templates.filter((template) => template.category === category),
    [category, templates],
  );

  // Filtra plantillas según categoría, subcategoría y preferencias fitness.
  const visibleTemplates = useMemo(
    () =>
      templatesByCategory.filter((template) => {
        const tmpl = template as GoalTemplate;
        const tmplSub = tmpl.subCategory ?? "General";
        const tmplStyle = tmpl.workoutStyle ?? "General";
        const tmplEnv = tmpl.workoutEnvironment ?? "Mixto";
        const matchesSubCategory =
          subCategory === "General" || tmplSub === subCategory;

        if (!isFitness) return matchesSubCategory;

        const matchesStyle =
          workoutStyle === "General" || tmplStyle === workoutStyle;
        const matchesEnvironment =
          workoutEnvironment === "Mixto" ||
          tmplEnv === workoutEnvironment ||
          !tmplEnv;

        return matchesSubCategory && matchesStyle && matchesEnvironment;
      }),
    [
      isFitness,
      subCategory,
      templatesByCategory,
      workoutEnvironment,
      workoutStyle,
    ],
  );

  useEffect(() => {
    const meta = getCategoryMeta(category);
    setIcon(meta.icon);

    if (!customColor) setColor(meta.color);
  }, [category, customColor, getCategoryMeta]);

  useEffect(() => {
    const allowed = CATEGORY_OBJECTIVES[category] ?? ["custom"];

    // Al cambiar de categoría, mantenemos objetivos válidos para esa categoría.
    setPrimaryObjective((current) =>
      allowed.includes(current) ? current : allowed[0],
    );
    setSecondaryObjectives((current) =>
      current.filter((objective) => allowed.includes(objective)),
    );
  }, [category]);

  useEffect(() => {
    tempIdCounter.current = 0;

    if (editId) {
      if (!editingGoal) return;

      setTitle(editingGoal.title);
      setDescription(editingGoal.description ?? "");
      setCategory(editingGoal.category);
      setPriority(editingGoal.priority);
      setDeadline(editingGoal.deadline ?? undefined);
      setColor(editingGoal.color);
      setIcon(editingGoal.icon ?? "target");
      setSteps(
        editingGoal.steps.length > 0
          ? editingGoal.steps
          : [createDraftStep("Primer avance", 25)],
      );
      setPlan(editingGoal.plan ?? []);
      setSelectedTemplateId(editingGoal.templateId ?? null);
      setFrequencyPerWeek(editingGoal.frequencyPerWeek ?? 7);
      setPlannedWeekdays(editingGoal.plannedWeekdays);
      setPrimaryObjective(editingGoal.primaryObjective ?? "custom");
      setSecondaryObjectives(editingGoal.secondaryObjectives ?? []);
      setPlanNotes(editingGoal.planNotes ?? []);
      setSubCategory("General");
      setWorkoutEnvironment(editingGoal.workoutEnvironment ?? "Mixto");
      setWorkoutStyle(editingGoal.workoutStyle ?? "General");
      return;
    }

    // Reinicia el formulario al abrirlo en modo creación.
    const meta = getCategoryMeta("Otro");
    setTitle("");
    setDescription("");
    setCategory("Otro");
    setPriority("2");
    setDeadline(undefined);
    setColor(meta.color);
    setIcon(meta.icon);
    // Una meta manual nace con un paso editable para que el flujo sea visible.
    setSteps([createDraftStep()]);
    setPlan([]);
    setFrequencyPerWeek(7);
    setPlannedWeekdays(undefined);
    setSelectedTemplateId(null);
    setPlanNotes([]);
    setCreatorMode("design");
    setPrimaryObjective("custom");
    setSecondaryObjectives([]);
    setPlanAvailability("normal");
    setPlanLevel("intermediate");
    setSubCategory("General");
    setWorkoutEnvironment("Mixto");
    setWorkoutStyle("General");
  }, [editId, editingGoal, getCategoryMeta]);

  const buildStepsFromSessions = (sessions: any[] = []): Step[] => {
    const builtSteps: Step[] = [];

    sessions.forEach((session) => {
      session.exercises.forEach((exercise: any) => {
        builtSteps.push({
          id: `temp-${tempIdCounter.current++}`,
          title: exercise.name ?? "Paso",
          duration: exercise.duration ?? 10,
          completed: false,
          order: builtSteps.length + 1,
          sets: exercise.sets,
          reps: exercise.reps,
          rest: exercise.rest,
          session: session.name,
        });
      });
    });

    return builtSteps;
  };

  const getTemplatePlan = (template: GoalTemplate) => {
    if (!isFitness) return template.defaultPlan ?? [];

    return (
      template.environmentPlans?.[workoutEnvironment] ??
      template.environmentPlans?.Mixto ??
      template.defaultPlan ??
      []
    );
  };

  const applyTemplate = (templateId: string) => {
    const template = useGoalsStore
      .getState()
      .templates.find((item) => item.id === templateId) as
      | GoalTemplate
      | undefined;

    if (!template) return;

    setSelectedTemplateId(templateId);
    setCategory(template.category);
    setSubCategory(template.subCategory ?? "General");
    setWorkoutEnvironment(template.workoutEnvironment ?? "Mixto");
    setWorkoutStyle(template.workoutStyle ?? "General");
    setTitle(template.name ?? "");
    setDescription(template.description ?? "");
    setFrequencyPerWeek(template.frequencyPerWeek ?? 7);
    setPlannedWeekdays(undefined);
    setPrimaryObjective(template.primaryObjectives?.[0] ?? primaryObjective);
    setSecondaryObjectives(template.secondaryObjectives ?? []);
    const templatePlan = getTemplatePlan(template);
    setPlan(templatePlan);
    setSteps(buildStepsFromSessions(templatePlan));
  };

  const applyPersonalPlan = () => {
    const proposal = designPersonalPlan({
      templates,
      category,
      title,
      deadline,
      primaryObjective,
      secondaryObjectives,
      availability: planAvailability,
      level: planLevel,
      workoutEnvironment,
      workoutStyle,
    });

    setTitle(proposal.title);
    setDescription(proposal.description);
    setPriority(proposal.priority);
    setSelectedTemplateId(proposal.template?.id ?? null);
    setPlan(proposal.plan);
    setSteps(buildStepsFromSessions(proposal.plan));
    setFrequencyPerWeek(proposal.frequencyPerWeek);
    setPlannedWeekdays(proposal.plannedWeekdays);
    setPrimaryObjective(proposal.primaryObjective);
    setSecondaryObjectives(proposal.secondaryObjectives);
    setPlanNotes(proposal.notes);
  };

  const refreshCurrentTemplate = () => {
    if (!selectedTemplateId) {
      Alert.alert("Sin plantilla", "Primero selecciona una plantilla.");
      return;
    }

    const template = useGoalsStore
      .getState()
      .templates.find((item) => item.id === selectedTemplateId) as
      | GoalTemplate
      | undefined;

    if (!template) {
      Alert.alert("Plantilla no encontrada");
      return;
    }

    const templatePlan = getTemplatePlan(template);
    setPlan(templatePlan);
    setSteps(buildStepsFromSessions(templatePlan));
    Alert.alert("Plantilla actualizada", "Se reaplicó con tu selección actual.");
  };

  const toggleSecondaryObjective = (objective: GoalObjective) => {
    if (objective === primaryObjective) return;

    setSecondaryObjectives((current) =>
      current.includes(objective)
        ? current.filter((item) => item !== objective)
        : [...current, objective],
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
      prev.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    );
  };

  const removeLocalStep = (stepId: string) => {
    setSteps((prev) =>
      prev
        .filter((step) => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 })),
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
      plan,
      subCategory,
      workoutEnvironment: isFitness ? workoutEnvironment : undefined,
      workoutStyle: isFitness ? workoutStyle : undefined,
      frequencyPerWeek,
      restStrategy: "auto" as const,
      plannedWeekdays,
      primaryObjective,
      secondaryObjectives,
      planNotes,
      sessionRotation: "activeDays" as const,
    };

    if (editId) updateGoal(editId, payload);
    else if (selectedTemplateId) createGoalFromTemplate(selectedTemplateId, payload);
    else addGoalSafe(payload);

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

  const resetCategoryColor = () => {
    const meta = getCategoryMeta(category);
    setColor(meta.color);
    setCustomColor(false);
  };

  return {
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
    categoryObjectives: CATEGORY_OBJECTIVES[category] ?? ["custom"],
    objectiveLabels: OBJECTIVE_LABELS,
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
  };
};
