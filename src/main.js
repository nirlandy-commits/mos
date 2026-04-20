import React, { useEffect, useMemo, useRef, useState } from "https://esm.sh/react@18";
import { createRoot } from "https://esm.sh/react-dom@18/client";
import htm from "https://esm.sh/htm@3";
import {
  createConsumedMealEntry,
  createAppNotification,
  createFeedbackEntry,
  createPlanMealEntry,
  createSupplementEntry,
  createWaterEntry,
  deleteConsumedFoodItem,
  deleteConsumedMealEntry,
  deletePlanFoodItem,
  deletePlanMealEntry,
  deleteSupplementEntry,
  deleteWaterEntry,
  fetchAppNotifications,
  getAuthenticatedUser,
  getCurrentAuthState,
  getSupabaseSetupMessage,
  isSupabaseConfigured,
  normalizeAppMessage,
  saveMeasureEntry,
  saveConsumedFoodItem,
  savePlanFoodItem,
  saveProfileData,
  sendRecoverEmail,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthChanges,
  updatePassword,
  updateSupplementEntry,
} from "./lib/auth.js";
import {
  calculateMosState,
  calculateMosExecutionSignals,
  generateMosMainMessage,
  generateMosOperationalInsight,
  generateMosShortRecommendation,
} from "./lib/mos-brain.js";

const html = htm.bind(React.createElement);

const TRAINING_MUSCLE_GROUPS = [
  {
    label: "SUPERIOR",
    options: ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Antebraço"],
  },
  {
    label: "CORE",
    options: ["Abdômen"],
  },
  {
    label: "INFERIOR",
    options: ["Glúteos", "Quadríceps", "Posterior de coxa", "Panturrilha"],
  },
  {
    label: "GERAL",
    options: ["Corpo inteiro", "Cardio", "Outro"],
  },
];

const TRAINING_MUSCLE_OPTIONS = TRAINING_MUSCLE_GROUPS.flatMap((group) => group.options);

const TRAINING_THEME = {
  surface: "bg-white border border-[#e6e8ef] text-[#0F172A] shadow-[0_12px_22px_rgba(15,23,42,0.08)]",
  surfaceSoft: "bg-surface-container-low border border-[#e6e8ef] text-[#0F172A]",
  surfaceMuted: "bg-[#f2f3f5] border border-[#e6e8ef] text-[#0F172A]",
  accentText: "text-[#0F172A]",
  accentSurface: "bg-surface-container-low text-[#0F172A]",
  mutedText: "text-[#0F172A]/70",
  mutedBorder: "border-[#e6e8ef]",
};

function isRecoveryRedirect() {
  try {
    const hash = globalThis.location?.hash?.replace(/^#/, "") || "";
    if (!hash) return false;
    const params = new URLSearchParams(hash);
    return params.get("type") === "recovery";
  } catch {
    return false;
  }
}

function normalizeMosPath(pathname = globalThis.location?.pathname || "/") {
  return pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
}

function getMosRoute(pathname = globalThis.location?.pathname || "/") {
  const normalizedPath = normalizeMosPath(pathname);
  return normalizedPath.endsWith("/app") ? "app" : "landing";
}

function buildMosPath(route = "landing") {
  const pathname = normalizeMosPath(globalThis.location?.pathname || "/");
  const segments = pathname.split("/").filter(Boolean);
  const baseSegments = segments[segments.length - 1] === "app" ? segments.slice(0, -1) : segments;
  const basePath = `/${baseSegments.join("/")}`.replace(/\/+/g, "/");
  if (route === "app") return `${basePath === "/" ? "" : basePath}/app`;
  return basePath === "" ? "/" : basePath;
}

function navigateMosRoute(route = "landing", { replace = false } = {}) {
  const nextPath = buildMosPath(route);
  const method = replace ? "replaceState" : "pushState";
  globalThis.history?.[method]?.({}, "", nextPath);
}

const LOCAL_DEMO_MODE = Boolean(globalThis.MOS_LOCAL_DEMO);
const STORAGE_KEY = LOCAL_DEMO_MODE ? "mos-local-demo-state" : "mos-stitch-faithful";
const FORCE_LOGIN_KEY = LOCAL_DEMO_MODE ? "mos-local-demo-force-login" : "mos-force-login";
const MOS_ADMIN_EMAILS = new Set(["nirlandy@gmail.com", "nirlandy@gmail.com.br", "nirlandy.pinheiro@gmail.com", "pinheironirla@gmail.com"]);
const MOS_FEEDBACK_EMAIL = "nirlanddy@gmail.com";
const DEMO_TODAY_KEY = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();

function buildFeedbackEmailUrl({ section = "Geral", message = "", profile = {}, auth = {} } = {}) {
  const name = profile.name || "Usuário MOS!";
  const email = profile.email || auth.email || "Não informado";
  const sentAt = new Date().toLocaleString("pt-BR");
  const pageUrl = globalThis.location?.href || "Não informado";
  const userAgent = globalThis.navigator?.userAgent || "Não informado";
  const subject = `Feedback MOS! - ${section}`;
  const body = [
    "Novo feedback enviado pelo MOS!",
    "",
    `Nome: ${name}`,
    `Email: ${email}`,
    `Seção: ${section}`,
    `Data: ${sentAt}`,
    `Página: ${pageUrl}`,
    `Navegador: ${userAgent}`,
    "",
    "Mensagem:",
    message,
    "",
    "Observação:",
    "Este feedback também foi salvo dentro do MOS! quando a conexão com o banco estava disponível.",
  ].join("\n");

  return `mailto:${MOS_FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const planImages = {
  breakfast:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDyjkkOji4D3DUTOvZiJsz52i2JaSqRA_HJ1kqsY0AruHmX8hD9ePEwRfdwvzftplGKYW6x2B3UoqDN-ODL2d9F8VP81P0TOdadGphurP1bqUvtIJ1XIzD5bW005g28RHCdnC7ncl3KiwbkRaPML0x2mU2tsxfB-eoxBqri3HkNNAyZPThSxDXqOsaDLjZBQH8oIrDqNNhM1JY9MaA8BEAzNbeDN3uLFJpgeDKXUk7k5YsAxa7Ielah7-LvR0QvB8aZznzJiLMdj8I",
  lunch:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBlrHGtspQhfPDzvfXMkHJI0m-uzCqgs-wq5zTb6S-UgmUWn_PpgtkEkUz7LMSc21eEh0Xh1rMXt0bNUl68vVLYzRernwXicSBxfjI0CZws91FhcOlcL99Bh_6-wGDioa9Ii0143dobcoKvj1Hd9whH5bGQCNzG0CB6Q2SMQUPRzLBK9B3XBowGQ2vwAzHMGWn2bcGMkNWO3gbRAQ5FqGWN4rOHLHfLPZKA_AAQfop1BosnwCcFqeZ-27yUo7OxfAvvjMlHq6Pzw-c",
  snack:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDSsQd9b6R7ydCOhMjf5-yJC4eO5QFwE4GWEixizAnpur_z8iJZZBJnVzqBCU7ANy41Lm7VvNIVNiWF9DesmSklA_sWseARUK33CkQU6cbE9I7mjrHQATWsdIY2aMmi-pKbTyEw8RbnzK_dDBiVXoqz7g1eQEJLg7XW_HMl8bzcfW0BCTn5icC2TFpu7RYxhI9CYaLNU7XWnjT1Yv-J-M1p3Eix-SGoYivIJa3wjIkNKZ5_QdURFebnnvxSxvUfxDEKRFUw19mrEdc",
};

const defaultState = {
  auth: {
    registered: LOCAL_DEMO_MODE,
    signedIn: LOCAL_DEMO_MODE,
    email: "",
    password: "",
  },
  profile: {
    calorieTarget: 2400,
    waterTargetMl: 3000,
    activeGoal: "",
    planFocus: "",
    planNotes: "",
    name: "Nirlandy Leitão Pinheiro",
    email: "",
    city: "",
    birthday: "",
    weight: 0,
    height: 0,
    age: 0,
    targetWeight: 0,
  },
  feedbackEntries: [],
  appNotifications: [],
  measureEntries: [
    {
      id: "measure-2025-12-02",
      date: "2025-12-02",
      weight: 82.9,
      height: 170,
      bodyFat: 25.2,
      muscleMass: 58.7,
      bodyWater: 53.2,
      metabolicAge: 54,
    },
    {
      id: "measure-2026-01-06",
      date: "2026-01-06",
      weight: 77.7,
      height: 170,
      bodyFat: 24.5,
      muscleMass: 55.7,
      bodyWater: 53.8,
      metabolicAge: 50,
    },
  ],
  consumedMeals: {
    [DEMO_TODAY_KEY]: [
      {
        id: "meal-demo-breakfast",
        name: "Café da manhã",
        icon: "light_mode",
        description: "Ovos, pão integral e café sem açúcar",
        foods: [
          { id: "meal-demo-breakfast-1", name: "Ovos mexidos", quantity: "2 ovos", calories: 180, protein: 14, carbs: 2, fat: 12, benefit: "Ajuda a manter saciedade pela manhã." },
          { id: "meal-demo-breakfast-2", name: "Pão integral", quantity: "2 fatias", calories: 140, protein: 6, carbs: 24, fat: 2, benefit: "Entrega energia equilibrada para começar o dia." },
          { id: "meal-demo-breakfast-3", name: "Café", quantity: "200 ml", calories: 5, protein: 0, carbs: 1, fat: 0, benefit: "Ajuda na rotina matinal sem pesar na refeição." },
        ],
      },
      {
        id: "meal-demo-lunch",
        name: "Almoço",
        icon: "restaurant",
        description: "Frango, arroz, feijão e salada",
        foods: [
          { id: "meal-demo-lunch-1", name: "Peito de frango grelhado", quantity: "140g", calories: 230, protein: 34, carbs: 0, fat: 8, benefit: "Boa base de proteína para o plano." },
          { id: "meal-demo-lunch-2", name: "Arroz integral", quantity: "120g", calories: 150, protein: 3, carbs: 31, fat: 1, benefit: "Fornece energia com boa saciedade." },
          { id: "meal-demo-lunch-3", name: "Feijão", quantity: "80g", calories: 90, protein: 6, carbs: 15, fat: 1, benefit: "Ajuda no equilíbrio nutricional da refeição." },
          { id: "meal-demo-lunch-4", name: "Salada verde", quantity: "1 prato", calories: 25, protein: 1, carbs: 4, fat: 0, benefit: "Aumenta volume e leveza do prato." },
        ],
      },
      {
        id: "meal-demo-snack",
        name: "Lanche da tarde",
        icon: "eco",
        description: "Iogurte, banana e aveia",
        foods: [
          { id: "meal-demo-snack-1", name: "Iogurte natural", quantity: "1 pote", calories: 110, protein: 9, carbs: 8, fat: 4, benefit: "Ajuda a sustentar a tarde com praticidade." },
          { id: "meal-demo-snack-2", name: "Banana", quantity: "1 un", calories: 89, protein: 1, carbs: 23, fat: 0, benefit: "Boa opção de energia rápida antes da rotina seguir." },
          { id: "meal-demo-snack-3", name: "Aveia", quantity: "20g", calories: 78, protein: 3, carbs: 13, fat: 2, benefit: "Acrescenta fibra e mais saciedade ao lanche." },
        ],
      },
      {
        id: "meal-demo-dinner",
        name: "Jantar",
        icon: "dark_mode",
        description: "Tilápia, purê e legumes",
        foods: [
          { id: "meal-demo-dinner-1", name: "Tilápia grelhada", quantity: "160g", calories: 210, protein: 34, carbs: 0, fat: 7, benefit: "Fecha o dia com proteína leve e de boa digestão." },
          { id: "meal-demo-dinner-2", name: "Purê de batata", quantity: "130g", calories: 142, protein: 3, carbs: 27, fat: 3, benefit: "Traz conforto e energia sem pesar demais." },
          { id: "meal-demo-dinner-3", name: "Legumes no vapor", quantity: "1 porção", calories: 48, protein: 2, carbs: 9, fat: 0, benefit: "Ajuda no equilíbrio e no volume do prato." },
        ],
      },
    ],
  },
  planMeals: [
    {
      id: "plan-breakfast",
      name: "Café da manhã",
      time: "08:30",
      icon: "light_mode",
      color: "border-[#DFF37D]",
      accent: "#DFF37D",
      image: planImages.breakfast,
      title: "Ovos mexidos com Abacate",
      description: "2 ovos, 50g de abacate, 1 fatia de pão integral",
      foods: [
        { id: "pf1", name: "Ovos mexidos", quantity: "2 ovos", calories: 180, protein: 14, carbs: 2, fat: 12, benefit: "Ajuda a manter saciedade pela manhã." },
        { id: "pf2", name: "Abacate", quantity: "50g", calories: 80, protein: 1, carbs: 4, fat: 7, benefit: "Boa fonte de gordura e energia estável." },
        { id: "pf3", name: "Pão integral", quantity: "1 fatia", calories: 75, protein: 3, carbs: 12, fat: 1, benefit: "Complementa com carboidrato simples para a rotina." },
      ],
    },
    {
      id: "plan-lunch",
      name: "Almoço",
      time: "12:30",
      icon: "restaurant",
      color: "border-[#4558C8]",
      accent: "#4558C8",
      image: planImages.lunch,
      title: "Frango Grelhado com Brócolis",
      description: "150g de frango, 100g arroz integral, legumes à vontade",
      foods: [
        { id: "pf4", name: "Arroz Integral Cozido", quantity: "150g", calories: 185, protein: 4, carbs: 38, fat: 1, benefit: "Entrega energia de forma equilibrada." },
        { id: "pf5", name: "Peito de Frango Grelhado", quantity: "120g", calories: 198, protein: 36, carbs: 0, fat: 5, benefit: "Excelente fonte de proteína magra." },
        { id: "pf6", name: "Mix de Salada Verde", quantity: "50g", calories: 15, protein: 1, carbs: 3, fat: 0, benefit: "Ajuda na digestão e micronutrientes." },
        { id: "pf7", name: "Azeite de Oliva Extra Virgem", quantity: "10ml", calories: 88, protein: 0, carbs: 0, fat: 10, benefit: "Complementa a refeição com gordura boa." },
      ],
    },
    {
      id: "plan-snack",
      name: "Lanche da tarde",
      time: "16:00",
      icon: "eco",
      color: "border-[#EF5F37]",
      accent: "#EF5F37",
      image: planImages.snack,
      title: "Mix de Nuts & Fruta",
      description: "30g de castanhas, 1 maçã média",
      foods: [
        { id: "pf8", name: "Castanhas", quantity: "30g", calories: 170, protein: 5, carbs: 6, fat: 14, benefit: "Ajuda na saciedade e rotina entre refeições." },
        { id: "pf9", name: "Maçã", quantity: "1 un", calories: 70, protein: 0, carbs: 18, fat: 0, benefit: "Boa opção leve e prática para o lanche." },
      ],
    },
  ],
  supplements: [
    { id: "s1", period: "Pós-treino", category: "Performance", time: "18:00", name: "Creatina", dosage: "5 gramas", instruction: "Usar 1x por dia para consistência no treino.", card: "bg-old-flax text-custom-jet" },
    { id: "s2", period: "Manhã", category: "Proteína", time: "08:00", name: "Whey Protein", dosage: "30 gramas", instruction: "Boa opção para subir proteína no café da manhã.", card: "bg-secondary text-white" },
    { id: "s3", period: "Almoço", category: "Saúde", time: "12:30", name: "Ômega 3", dosage: "2 caps", instruction: "Consumir junto com refeição principal.", card: "bg-[#D9B8F3] text-custom-jet" },
    { id: "s4", period: "Pré-treino", category: "Energia", time: "16:30", name: "Cafeína", dosage: "210 mg", instruction: "Usar somente quando fizer sentido na rotina.", card: "bg-[#EF5F37] text-white" },
  ],
  trainingPlans: [
    {
      id: "training-a",
      name: "Peito + Ombro",
      estimatedMinutes: 50,
      exercises: [
        { id: "training-a-1", name: "Supino reto", focus: "Peito", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 90, suggestedLoadKg: 40, loadDelta: "+2kg" },
        { id: "training-a-2", name: "Supino inclinado", focus: "Peito", sets: 4, reps: "8-10", targetReps: 10, restSeconds: 75, suggestedLoadKg: 36, loadDelta: "+2kg" },
        { id: "training-a-3", name: "Crucifixo", focus: "Peito", sets: 3, reps: "12-15", targetReps: 15, restSeconds: 60, suggestedLoadKg: 12, loadDelta: "+1kg" },
        { id: "training-a-4", name: "Desenvolvimento", focus: "Ombros", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 90, suggestedLoadKg: 18, loadDelta: "+2kg" },
      ],
    },
    {
      id: "training-b",
      name: "Costas + Bíceps",
      estimatedMinutes: 55,
      exercises: [
        { id: "training-b-1", name: "Puxada frontal", focus: "Costas", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 75, suggestedLoadKg: 45, loadDelta: "+5kg" },
        { id: "training-b-2", name: "Remada baixa", focus: "Costas", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 75, suggestedLoadKg: 40, loadDelta: "+2kg" },
        { id: "training-b-3", name: "Rosca direta", focus: "Bíceps", sets: 3, reps: "8-10", targetReps: 10, restSeconds: 60, suggestedLoadKg: 20, loadDelta: "+2kg" },
      ],
    },
  ],
  trainingHistory: [],
  water: {
    [DEMO_TODAY_KEY]: 2450,
  },
  waterHistory: {
    [DEMO_TODAY_KEY]: [
      { id: "water-demo-1", amount: 300, label: "Ao acordar", time: "07:15" },
      { id: "water-demo-2", amount: 500, label: "Após o café da manhã", time: "09:40" },
      { id: "water-demo-3", amount: 450, label: "Antes do almoço", time: "12:10" },
      { id: "water-demo-4", amount: 600, label: "Durante a tarde", time: "16:25" },
      { id: "water-demo-5", amount: 350, label: "Após o treino", time: "19:05" },
      { id: "water-demo-6", amount: 250, label: "No jantar", time: "20:20" },
    ],
  },
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value) {
  const [year, month, day] = String(value || getTodayKey())
    .split("-")
    .map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDateLabel(value) {
  const date = parseDateKey(value);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatMonthLabel(value) {
  const date = parseDateKey(value);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function round(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function calculateSuggestedCalories({ weight, height, age, goal }) {
  const safeWeight = Number(weight) || 0;
  const safeHeight = Number(height) || 0;
  const safeAge = Number(age) || 0;
  if (!safeWeight || !safeHeight || !safeAge) return 0;
  const maintenance = safeWeight * 24 + safeHeight * 4 - safeAge * 3;
  const offset = goal === "gain" ? 250 : goal == "maintain" ? 0 : -400;
  const suggested = maintenance + offset;
  return Math.max(1200, Math.min(4000, Math.round(suggested / 10) * 10));
}

function getGoalMeta(goal) {
  if (goal === "maintain") return { label: "Plano atual: Manter peso", focus: "Manutenção com rotina estável" };
  if (goal === "gain") return { label: "Plano atual: Ganhar massa", focus: "Superávit leve com consistência" };
  return { label: "Plano atual: Perder peso", focus: "Déficit calórico com mais constância" };
}

function computeBmi(weight, heightCm) {
  const height = Number(heightCm) / 100;
  if (!height || !weight) return 0;
  return round(Number(weight) / (height * height));
}

function normalizeMeasureEntry(entry = {}, index = 0) {
  const weight = Number(entry.weight ?? entry.massa) || 0;
  const height = Number(entry.height ?? entry.estatura) || 170;
  const bodyFat = Number(entry.bodyFat ?? entry.bioimpedancia_gordura) || 0;
  const muscleMass = Number(entry.muscleMass ?? entry.bioimpedancia_massa) || 0;
  const bodyWater = Number(entry.bodyWater ?? entry.bioimpedancia_agua) || 0;
  const metabolicAge = Number(entry.metabolicAge ?? entry.bioimpedancia_idade) || 0;

  return {
    id: entry.id || `measure-${entry.date || entry.dataAvaliacao || index + 1}`,
    date: entry.date || entry.dataAvaliacao || getTodayKey(),
    weight,
    height,
    bodyFat,
    muscleMass,
    bodyWater,
    metabolicAge,
  };
}

function normalizeTrainingMuscleGroup(value = "") {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!normalized) return "";

  const aliasMap = {
    peito: "Peito",
    costas: "Costas",
    "grande dorsal": "Costas",
    "costas médias": "Costas",
    "costas medias": "Costas",
    ombros: "Ombros",
    deltoides: "Ombros",
    bíceps: "Bíceps",
    biceps: "Bíceps",
    tríceps: "Tríceps",
    triceps: "Tríceps",
    antebraço: "Antebraço",
    antebraco: "Antebraço",
    abdômen: "Abdômen",
    abdomen: "Abdômen",
    core: "Abdômen",
    glúteos: "Glúteos",
    gluteos: "Glúteos",
    quadríceps: "Quadríceps",
    quadriceps: "Quadríceps",
    "posterior de coxa": "Posterior de coxa",
    posterior: "Posterior de coxa",
    panturrilha: "Panturrilha",
    "corpo inteiro": "Corpo inteiro",
    "full body": "Corpo inteiro",
    cardio: "Cardio",
    outro: "Outro",
  };

  const directMatch = aliasMap[normalized];
  if (directMatch) return directMatch;

  return TRAINING_MUSCLE_OPTIONS.find((option) => option.toLowerCase() === normalized) || "";
}

function normalizeTrainingExercise(exercise = {}, index = 0) {
  const sets = Math.min(12, Math.max(1, Number(exercise.sets) || 3));
  const reps = sanitizeTrainingReps(exercise.reps || `${exercise.targetReps || 10}`) || "10-12";
  const targetReps = Math.max(1, Number(exercise.targetReps) || Number(String(reps).split("-").pop()) || 10);
  return {
    id: exercise.id || `training-exercise-${index + 1}`,
    name: exercise.name || `Exercício ${index + 1}`,
    focus: normalizeTrainingMuscleGroup(exercise.focus),
    sets,
    reps,
    targetReps,
    restSeconds: Math.min(600, Math.max(15, Number(exercise.restSeconds) || 60)),
    suggestedLoadKg: Math.min(500, Math.max(0, Number(exercise.suggestedLoadKg) || 0)),
    loadDelta: exercise.loadDelta || "",
  };
}

function normalizeTrainingPlan(plan = {}, index = 0, options = {}) {
  const { allowEmptyExercises = false } = options;
  const normalizedExercises = Array.isArray(plan.exercises) && plan.exercises.length
    ? plan.exercises.map((exercise, exerciseIndex) => normalizeTrainingExercise(exercise, exerciseIndex))
    : [];
  return {
    id: plan.id || `training-plan-${index + 1}`,
    name: plan.name || `Treino ${index + 1}`,
    estimatedMinutes: Math.max(15, Number(plan.estimatedMinutes) || 45),
    exercises: normalizedExercises.length || allowEmptyExercises
      ? normalizedExercises
      : [normalizeTrainingExercise({}, 0)],
  };
}

function summarizeExerciseNames(plan = {}) {
  const names = (plan.exercises || []).map((exercise) => exercise.name).filter(Boolean);
  if (!names.length) return "Monte os exercícios deste treino para começar.";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
}

function formatClock(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getAverageReps(value = "") {
  const parts = String(value)
    .split("-")
    .map((part) => Number(part.trim()))
    .filter(Boolean);
  if (!parts.length) return 0;
  if (parts.length === 1) return parts[0];
  return Math.round(parts.reduce((acc, part) => acc + part, 0) / parts.length);
}

function normalizeTrainingLookup(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sanitizeTrainingReps(value = "") {
  const raw = String(value || "").replace(/\s+/g, "").replace(/,+/g, "-");
  if (!raw) return "";
  const matches = raw.match(/\d+/g);
  if (!matches?.length) return "";
  const numbers = matches.map((item) => Math.min(50, Math.max(1, Number(item) || 0))).filter(Boolean);
  if (!numbers.length) return "";
  if (raw.includes("-") && numbers.length >= 2) {
    const first = Math.min(numbers[0], numbers[1]);
    const second = Math.max(numbers[0], numbers[1]);
    return `${first}-${second}`;
  }
  return `${numbers[0]}`;
}

function parseTrainingLoadDelta(value = "") {
  const match = String(value || "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return 0;
  return Number(match[0].replace(",", ".")) || 0;
}

function formatTrainingLoad(value = 0) {
  return `${round(Number(value) || 0)}kg`;
}

function buildTrainingExerciseLibrary(trainingPlans = []) {
  const seen = new Map();
  (trainingPlans || []).forEach((plan) => {
    (plan.exercises || []).forEach((exercise) => {
      const key = normalizeTrainingLookup(exercise.name);
      if (!key || seen.has(key)) return;
      seen.set(key, {
        name: exercise.name,
        focus: normalizeTrainingMuscleGroup(exercise.focus),
        sets: Number(exercise.sets) || 3,
        reps: sanitizeTrainingReps(exercise.reps) || "10-12",
        restSeconds: Number(exercise.restSeconds) || 60,
        suggestedLoadKg: Number(exercise.suggestedLoadKg) || 0,
        loadDelta: exercise.loadDelta || "",
      });
    });
  });
  return Array.from(seen.values());
}

const TRAINING_EXERCISE_LIBRARY = buildTrainingExerciseLibrary(defaultState.trainingPlans);

function getTrainingExerciseMatch(name = "", trainingPlans = [], trainingHistory = []) {
  const lookup = normalizeTrainingLookup(name);
  if (lookup.length < 2) return null;

  const historyMatches = [];
  (trainingHistory || []).forEach((entry) => {
    (entry.exercises || []).forEach((exercise) => {
      historyMatches.push({
        ...exercise,
        source: "history",
        completedAt: entry.completedAt,
      });
    });
  });

  historyMatches.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  const exactHistory = historyMatches.find((exercise) => normalizeTrainingLookup(exercise.name) === lookup);
  if (exactHistory) return exactHistory;

  const library = [
    ...buildTrainingExerciseLibrary(trainingPlans),
    ...TRAINING_EXERCISE_LIBRARY,
  ];
  const dedupedLibrary = Array.from(
    library.reduce((acc, exercise) => {
      const key = normalizeTrainingLookup(exercise.name);
      if (!key || acc.has(key)) return acc;
      acc.set(key, exercise);
      return acc;
    }, new Map()).values(),
  );

  const exactLibrary = dedupedLibrary.find((exercise) => normalizeTrainingLookup(exercise.name) === lookup);
  if (exactLibrary) return { ...exactLibrary, source: "library" };

  const partialMatches = dedupedLibrary.filter((exercise) => {
    const exerciseLookup = normalizeTrainingLookup(exercise.name);
    return exerciseLookup.includes(lookup) || lookup.includes(exerciseLookup);
  });
  if (partialMatches.length === 1) return { ...partialMatches[0], source: "library" };

  return null;
}

function applyTrainingExerciseSuggestion(exercise, match, nextName) {
  if (!match) return normalizeTrainingExercise({ ...exercise, name: nextName });
  const nextExercise = { ...exercise, name: nextName };
  const isDefaultExercise =
    !exercise.focus
    && (Number(exercise.sets) || 3) === 3
    && sanitizeTrainingReps(exercise.reps) === "10-12"
    && (Number(exercise.restSeconds) || 60) === 60
    && !(Number(exercise.suggestedLoadKg) || 0);

  nextExercise.focus = normalizeTrainingMuscleGroup(match.focus) || nextExercise.focus;

  if (match.source === "history" || isDefaultExercise) {
    nextExercise.sets = Number(match.sets) || nextExercise.sets;
    nextExercise.reps = sanitizeTrainingReps(match.reps) || nextExercise.reps;
    nextExercise.restSeconds = Number(match.restSeconds) || nextExercise.restSeconds;
    nextExercise.suggestedLoadKg = Number(match.suggestedLoadKg) || 0;
    nextExercise.loadDelta = match.loadDelta || nextExercise.loadDelta;
  }

  return normalizeTrainingExercise(nextExercise);
}

function getTrainingProgressionSuggestion(exercise, trainingHistory = [], trainingPlans = []) {
  const historyMatch = getTrainingExerciseMatch(exercise.name, trainingPlans, trainingHistory);
  if (!historyMatch || historyMatch.source !== "history") return null;

  const lastLoad = Number(historyMatch.suggestedLoadKg) || 0;
  const loadDelta = parseTrainingLoadDelta(exercise.loadDelta || historyMatch.loadDelta);
  const suggestedLoad = Math.max(lastLoad, Number(exercise.suggestedLoadKg) || 0) + Math.max(0, loadDelta);

  return {
    lastLoad,
    suggestedLoad,
    reps: sanitizeTrainingReps(historyMatch.reps) || sanitizeTrainingReps(exercise.reps),
    sets: Number(historyMatch.sets) || Number(exercise.sets) || 0,
    restSeconds: Number(historyMatch.restSeconds) || Number(exercise.restSeconds) || 0,
    source: historyMatch,
  };
}

function summarizeTrainingPlan(plan = {}) {
  const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];
  const sets = exercises.reduce((acc, exercise) => acc + (Number(exercise.sets) || 0), 0);
  const volumeTotal = exercises.reduce(
    (acc, exercise) => acc + ((Number(exercise.suggestedLoadKg) || 0) * (Number(exercise.sets) || 0) * getAverageReps(exercise.reps)),
    0,
  );
  return {
    exercises: exercises.length,
    sets,
    volumeTotal,
  };
}

function formatMetricDelta(current, previous, suffix = "") {
  const delta = round((Number(current) || 0) - (Number(previous) || 0));
  if (!delta) return "Sem mudança";
  const signal = delta > 0 ? "+" : "";
  return `${signal}${delta}${suffix}`;
}

function buildSparklinePath(values = [], width = 220, height = 64) {
  if (!values.length) return "";
  const numeric = values.map((value) => Number(value) || 0);
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min || 1;
  return numeric
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildSmoothSparklinePath(values = [], width = 220, height = 64) {
  if (!values.length) return "";
  const numeric = values.map((value) => Number(value) || 0);
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min || 1;
  const points = numeric.map((value, index) => ({
    x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: height - ((value - min) / range) * (height - 12) - 6,
  }));

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    path += ` Q ${midX} ${current.y} ${next.x} ${next.y}`;
  }
  return path;
}

function deriveBenefit(name = "") {
  const n = name.toLowerCase();
  if (n.includes("frango") || n.includes("ovo")) return "Ajuda a aumentar proteína com eficiência.";
  if (n.includes("arroz") || n.includes("pão")) return "Contribui com energia para o restante do dia.";
  if (n.includes("salada") || n.includes("brócol")) return "Favorece digestão e equilíbrio da refeição.";
  return "Mantém a refeição mais organizada dentro do plano.";
}

function normalizeFood(food = {}) {
  return {
    id: food.id || uid("food"),
    name: food.name || "Alimento",
    quantity: food.quantity || "1 porção",
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,
    benefit: food.benefit || deriveBenefit(food.name),
  };
}

function getSectionBackground() {
  return "mos-screen";
}

function getFoodAccent(name = "") {
  const n = name.toLowerCase();
  if (n.includes("frango") || n.includes("ovo")) return { icon: "egg_alt", dot: "#4558C8", soft: "rgba(69, 88, 200, 0.12)" };
  if (n.includes("arroz") || n.includes("cuscuz") || n.includes("pão")) return { icon: "grain", dot: "#EF5F37", soft: "rgba(239, 95, 55, 0.12)" };
  if (n.includes("salada") || n.includes("brócol") || n.includes("maçã") || n.includes("abacate")) return { icon: "nutrition", dot: "#D9B8F3", soft: "rgba(217, 184, 243, 0.2)" };
  return { icon: "restaurant", dot: "#DFF37D", soft: "rgba(223, 243, 125, 0.28)" };
}

function getEquivalentFoods(food = {}) {
  const n = String(food.name || "").toLowerCase();
  if (n.includes("frango")) return ["Peixe grelhado", "Patinho moído magro", "Tofu grelhado"];
  if (n.includes("ovo")) return ["Claras mexidas", "Queijo cottage", "Iogurte natural proteico"];
  if (n.includes("arroz")) return ["Batata-doce cozida", "Quinoa", "Cuscuz marroquino"];
  if (n.includes("cuscuz")) return ["Arroz integral", "Batata inglesa cozida", "Tapioca simples"];
  if (n.includes("pão")) return ["Tapioca", "Wrap integral", "Aveia em mingau"];
  if (n.includes("abacate")) return ["Pasta de amendoim", "Castanhas", "Azeite de oliva"];
  if (n.includes("salada") || n.includes("brócol")) return ["Abobrinha refogada", "Couve-flor", "Legumes no vapor"];
  if (n.includes("maçã")) return ["Pera", "Banana prata", "Mamão"];
  return ["Iogurte natural", "Fruta da estação", "Proteína equivalente"];
}

function normalizeMeal(meal = {}, index = 0) {
  return {
    id: meal.id || `meal-${index + 1}`,
    name: meal.name || `Refeição ${index + 1}`,
    title: meal.title || meal.name || `Refeição ${index + 1}`,
    description: meal.description || "",
    time: meal.time || "12:00",
    icon: meal.icon || "restaurant",
    accent: meal.accent || "#4558C8",
    color: meal.color || "border-[#4558C8]",
    image: meal.image || planImages.breakfast,
    foods: Array.isArray(meal.foods) ? meal.foods.map((food) => normalizeFood(food)) : [],
  };
}

function parseMealTimeValue(value = "") {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Math.max(0, Math.min(23, Number(match[1]) || 0));
  const minutes = Math.max(0, Math.min(59, Number(match[2]) || 0));
  return hours * 60 + minutes;
}

function formatMealTimeLabel(value = "") {
  const parsed = parseMealTimeValue(value);
  if (parsed == null) return "";
  const hours = Math.floor(parsed / 60);
  const minutes = parsed % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getSupplementMomentStatus(value = "", currentMinutes = getCurrentMinutes()) {
  const parsed = parseMealTimeValue(value);
  if (parsed == null) return { label: "Sem horário", tone: "idle" };
  const delta = parsed - currentMinutes;
  if (Math.abs(delta) <= 45) return { label: "Agora • recomendado", tone: "now" };
  if (delta < -45) return { label: "Não registrado", tone: "late" };
  return { label: "Mais tarde", tone: "later" };
}

function sortPlanMealsByTime(planMeals = []) {
  return [...planMeals].sort((left, right) => {
    const leftTime = parseMealTimeValue(left.time);
    const rightTime = parseMealTimeValue(right.time);
    if (leftTime == null && rightTime == null) return left.name.localeCompare(right.name);
    if (leftTime == null) return 1;
    if (rightTime == null) return -1;
    return leftTime - rightTime;
  });
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentPlanMeal(planMeals = [], currentMinutes = getCurrentMinutes()) {
  const sortedMeals = sortPlanMealsByTime(planMeals);
  if (!sortedMeals.length) return null;
  const mealsWithTime = sortedMeals.filter((meal) => parseMealTimeValue(meal.time) != null);
  if (!mealsWithTime.length) return sortedMeals[0];

  let currentMeal = mealsWithTime[0];
  mealsWithTime.forEach((meal) => {
    const mealTime = parseMealTimeValue(meal.time);
    if (mealTime != null && mealTime <= currentMinutes) {
      currentMeal = meal;
    }
  });
  return currentMeal;
}

function normalizeSupplement(item = {}, index = 0) {
  return {
    id: item.id || `supplement-${index + 1}`,
    period: item.period || "Livre",
    category: item.category || item.period || "Geral",
    time: item.time || "",
    name: item.name || "Suplemento",
    dosage: item.dosage || "",
    instruction: item.instruction || "",
    card: item.card || "bg-old-flax text-custom-jet",
  };
}

function migrate(raw) {
  return {
    auth: {
      registered: raw.auth?.registered ?? Boolean(raw.profile?.email),
      signedIn: raw.auth?.signedIn ?? true,
      email: raw.auth?.email || raw.profile?.email || "",
      password: raw.auth?.password || "",
    },
    profile: {
      calorieTarget: Number(raw.profile?.calorieTarget) || 2400,
      waterTargetMl: Number(raw.profile?.waterTargetMl) || 3000,
      activeGoal: raw.profile?.activeGoal || "Plano atual: Perder 5kg",
      planFocus: raw.profile?.planFocus || defaultState.profile.planFocus,
      planNotes: raw.profile?.planNotes || defaultState.profile.planNotes,
      name: raw.profile?.name || defaultState.profile.name,
      email: raw.profile?.email || defaultState.profile.email,
      city: raw.profile?.city || defaultState.profile.city,
      birthday: raw.profile?.birthday || defaultState.profile.birthday,
      weight: Number(raw.profile?.weight) || 0,
      height: Number(raw.profile?.height) || 0,
      age: Number(raw.profile?.age) || 0,
      targetWeight: Number(raw.profile?.targetWeight || raw.profile?.target_weight) || 0,
    },
    feedbackEntries: Array.isArray(raw.feedbackEntries) ? raw.feedbackEntries : [],
    appNotifications: Array.isArray(raw.appNotifications) ? raw.appNotifications : [],
    measureEntries: Array.isArray(raw.measureEntries)
      ? raw.measureEntries.map((entry, index) => normalizeMeasureEntry(entry, index))
      : defaultState.measureEntries,
    consumedMeals: (() => {
      const nextConsumedMeals = raw.consumedMeals || raw.foodLog || {};
      if (!LOCAL_DEMO_MODE) return nextConsumedMeals;
      return {
        ...defaultState.consumedMeals,
        ...nextConsumedMeals,
      };
    })(),
    planMeals: Array.isArray(raw.planMeals || raw.mealPlan) ? (raw.planMeals || raw.mealPlan).map((meal, index) => normalizeMeal(meal, index)) : defaultState.planMeals,
    supplements: Array.isArray(raw.supplements) ? raw.supplements.map((item, index) => normalizeSupplement(item, index)) : defaultState.supplements,
    trainingPlans: Array.isArray(raw.trainingPlans) ? raw.trainingPlans.map((plan, index) => normalizeTrainingPlan(plan, index)) : defaultState.trainingPlans,
    trainingHistory: Array.isArray(raw.trainingHistory) ? raw.trainingHistory : [],
    water: (() => {
      const nextWater = raw.water || {};
      if (!LOCAL_DEMO_MODE) return nextWater;
      return {
        ...defaultState.water,
        ...nextWater,
      };
    })(),
    waterHistory: (() => {
      const nextWaterHistory = raw.waterHistory || {};
      if (!LOCAL_DEMO_MODE) return nextWaterHistory;
      return {
        ...defaultState.waterHistory,
        ...nextWaterHistory,
      };
    })(),
  };
}

function loadState() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return migrate(JSON.parse(current));
  } catch (error) {
    console.error(error);
  }
  return structuredClone(defaultState);
}

function shouldOpenLoginAfterReload() {
  try {
    if (sessionStorage.getItem(FORCE_LOGIN_KEY) === "1") {
      sessionStorage.removeItem(FORCE_LOGIN_KEY);
      return true;
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}

function summarizeFoods(foods = []) {
  return foods.reduce(
    (acc, food) => {
      acc.calories += Number(food.calories) || 0;
      acc.protein += Number(food.protein) || 0;
      acc.carbs += Number(food.carbs) || 0;
      acc.fat += Number(food.fat) || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function Icon({ name, className = "", filled = false }) {
  return html`<span className=${`material-symbols-outlined ${className}`} style=${filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : {}}>${name}</span>`;
}

const MOS_LOGO_SRC = new URL("../logo-mos.svg", import.meta.url).href;

function MosWordmark({ className = "" }) {
  return html`
    <span className=${`mos-wordmark ${className}`} aria-label="MOS!" role="img">
      <img src=${MOS_LOGO_SRC} alt="MOS!" />
    </span>
  `;
}

function NotificationBadge({ count = 0 }) {
  const value = Number(count) || 0;
  if (value <= 0) return null;
  return html`<span className="mos-notification-badge">${value > 9 ? "9+" : value}</span>`;
}

function TopBar({ title = "MOS!", leftIcon = "menu", onLeft, onSearch, onRight, centerBold = true, rightSlot = null, notificationCount }) {
  const activeNotificationCount = Number(notificationCount ?? globalThis.MOS_NOTIFICATION_COUNT ?? 0) || 0;

  return html`
    <header className="top-bar headroom headroom--pinned fixed top-0 w-full z-50 bg-transparent">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-screen-xl mx-auto backdrop-blur-sm bg-white/0">
        <button type="button" className="hover:opacity-80 transition-opacity active:scale-95" onClick=${onLeft}>
          <${Icon} name=${leftIcon} className="text-[#292B2D]" />
        </button>
        <h1 className=${centerBold ? "text-xl font-black text-[#292B2D]" : "font-bold text-base text-[#292B2D]"}>
          ${title === "MOS!" ? html`<${MosWordmark} className="mos-wordmark--topbar" />` : title}
        </h1>
        ${
          rightSlot ||
          html`<div className="flex items-center gap-4">
            <button type="button" className="hover:opacity-80 transition-opacity active:scale-95" onClick=${onSearch}>
              <${Icon} name="search" className="text-[#292B2D]" />
            </button>
            <button type="button" className="mos-notification-button hover:opacity-80 transition-opacity active:scale-95" onClick=${onRight} aria-label=${activeNotificationCount > 0 ? `${activeNotificationCount} notificações` : "Notificações"}>
              <${Icon} name="notifications" className="text-[#292B2D]" />
              <${NotificationBadge} count=${activeNotificationCount} />
            </button>
          </div>`
        }
      </div>
    </header>
  `;
}

function NotificationsPanel({ items, onClose, onOpen, onClear }) {
  return html`
    <div className="fixed inset-0 z-[80] bg-black/30" onClick=${onClose}>
      <div className="absolute right-4 top-20 w-[min(92vw,28rem)] bg-white rounded-xl p-5 flex flex-col gap-4" onClick=${(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[0.6875rem] font-medium text-royal-blue">Central</span>
            <div className="flex items-center gap-2">
              <h2 className="text-[1.5rem] font-bold text-jet-black">Notificações</h2>
              ${items.length ? html`<span className="mos-notification-count-pill">${items.length > 9 ? "9+" : items.length}</span>` : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95" onClick=${onClear} title="Limpar notificações">
              <${Icon} name="cleaning_services" className="text-[#292B2D]" />
            </button>
            <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95" onClick=${onClose}>
              <${Icon} name="close" className="text-[#292B2D]" />
            </button>
          </div>
        </div>

        ${
          items.length
            ? html`
                <div className="flex flex-col gap-3">
                  ${items.map(
                    (item) => html`
                      <button type="button" className="w-full bg-surface-container-low rounded-xl p-4 text-left flex items-start gap-4 active:scale-[0.98] transition-transform" onClick=${() => onOpen(item)}>
                        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                          <${Icon} name=${item.icon} className="text-[#292B2D]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-bold text-jet-black">${item.title}</p>
                            <span className="text-[0.6875rem] text-outline whitespace-nowrap">${item.tag}</span>
                          </div>
                          <p className="text-[0.9rem] text-on-surface-variant mt-1 leading-relaxed">${item.body}</p>
                        </div>
                      </button>
                    `,
                  )}
                </div>
              `
            : html`
                <div className="bg-surface-container-low rounded-xl p-6 text-center space-y-2">
                  <p className="font-bold text-jet-black">Sem notificações</p>
                  <p className="text-sm text-on-surface-variant">Tudo limpo por aqui.</p>
                </div>
              `
        }
      </div>
    </div>
  `;
}

function FoodCalendarPanel({ selectedDate, monthDate, markedDates, todayKey, onClose, onPickDate, onGoToday, onPrevMonth, onNextMonth }) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < startWeekday; i += 1) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push(key);
  }

  return html`
    <div className="fixed inset-0 z-[85] bg-black/30" onClick=${onClose}>
      <div className="absolute inset-x-4 top-20 bg-white rounded-xl p-5 flex flex-col gap-4 max-w-md mx-auto" onClick=${(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[0.6875rem] font-medium text-royal-blue">Comida</span>
            <h2 className="text-[1.35rem] font-bold text-jet-black">Escolher data</h2>
          </div>
          <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95" onClick=${onClose}>
            <${Icon} name="close" className="text-[#292B2D]" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95" onClick=${onPrevMonth}>
            <${Icon} name="chevron_left" className="text-[#292B2D]" />
          </button>
          <span className="font-bold text-jet-black capitalize">${formatMonthLabel(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-01`)}</span>
          <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95" onClick=${onNextMonth}>
            <${Icon} name="chevron_right" className="text-[#292B2D]" />
          </button>
        </div>

        ${selectedDate !== todayKey
          ? html`
              <button type="button" className="w-full min-h-11 rounded-[10px] bg-[#fff4ef] border border-[#ffd8ce] text-[#EF5F37] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform" onClick=${onGoToday}>
                <${Icon} name="today" className="text-[#EF5F37]" />
                <span>Ver hoje</span>
              </button>
            `
          : null}

        <div className="grid grid-cols-7 gap-2 text-center">
          ${["S", "T", "Q", "Q", "S", "S", "D"].map(
            (day) => html`<span className="text-[0.6875rem] font-bold text-outline">${day}</span>`,
          )}
          ${days.map((key) => {
            if (!key) return html`<div className="h-12"></div>`;
            const isSelected = key === selectedDate;
            const isMarked = markedDates.has(key);
            return html`
              <button type="button" className=${`h-12 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${isSelected ? "bg-[#DFF37D] text-jet-black" : "bg-surface-container-low text-jet-black"}`} onClick=${() => onPickDate(key)}>
                <span className="font-bold">${Number(key.slice(-2))}</span>
                <span className=${`w-1.5 h-1.5 rounded-full ${isMarked ? "bg-[#EF5F37]" : "bg-transparent"}`}></span>
              </button>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}

function WaterHistoryPanel({
  selectedDate,
  monthDate,
  markedDates,
  todayKey,
  onClose,
  onPickDate,
  onGoToday,
  onPrevMonth,
  onNextMonth,
}) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < startWeekday; i += 1) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push(key);
  }

  return html`
    <div className="fixed inset-0 z-[85] bg-black/30" onClick=${onClose}>
      <div className="absolute inset-x-4 top-20 bg-white rounded-xl p-5 flex flex-col gap-4 max-w-md mx-auto" onClick=${(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-sm text-[#4558C8]">Água</span>
            <h2 className="text-[1.35rem] font-bold text-jet-black">Histórico de hidratação</h2>
          </div>
          <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95" onClick=${onClose}>
            <${Icon} name="close" className="text-[#292B2D]" />
          </button>
        </div>

        <div className="flex items-center justify-between shrink-0">
          <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95" onClick=${onPrevMonth}>
            <${Icon} name="chevron_left" className="text-[#292B2D]" />
          </button>
          <span className="font-bold text-jet-black capitalize">${formatMonthLabel(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-01`)}</span>
          <button type="button" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95" onClick=${onNextMonth}>
            <${Icon} name="chevron_right" className="text-[#292B2D]" />
          </button>
        </div>

        ${selectedDate !== todayKey
          ? html`
              <button type="button" className="w-full min-h-11 rounded-[10px] bg-[#fff4ef] border border-[#ffd8ce] text-[#EF5F37] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shrink-0" onClick=${onGoToday}>
                <${Icon} name="today" className="text-[#EF5F37]" />
                <span>Ver hoje</span>
              </button>
            `
          : null}

        <div className="grid grid-cols-7 gap-2 text-center shrink-0">
          ${["S", "T", "Q", "Q", "S", "S", "D"].map(
            (day) => html`<span className="text-[0.75rem] font-bold text-outline">${day}</span>`,
          )}
          ${days.map((key) => {
            if (!key) return html`<div className="h-12"></div>`;
            const isSelected = key === selectedDate;
            const isMarked = markedDates.has(key);
            return html`
              <button type="button" className=${`h-12 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${isSelected ? "bg-[#4558C8] text-white" : "bg-surface-container-low text-jet-black"}`} onClick=${() => onPickDate(key)}>
                <span className="font-bold">${Number(key.slice(-2))}</span>
                <span className=${`w-1.5 h-1.5 rounded-full ${isMarked ? "bg-[#EF5F37]" : isSelected ? "bg-white/70" : "bg-transparent"}`}></span>
              </button>
            `;
          })}
        </div>

        <div className="bg-[#f7f9ff] border border-[#dde5ff] rounded-xl p-4 text-center space-y-2">
          <p className="font-bold text-jet-black">${selectedDate === todayKey ? "Escolha um dia para revisar ou editar a hidratação." : `Selecionado: ${formatDateLabel(selectedDate)}`}</p>
          <p className="text-sm text-on-surface-variant">Ao tocar em uma data, o calendário fecha e os registros aparecem na tela principal.</p>
        </div>
      </div>
    </div>
  `;
}

function ContextNav({ items }) {
  return html`
    <nav className="flex flex-wrap gap-2">
      ${items.map(
        (item) => html`
          <button type="button" className=${`px-4 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95 ${item.primary ? "bg-[#EF5F37] text-white" : "bg-surface-container-low text-jet-black"}`} onClick=${item.onClick}>
            ${item.label}
          </button>
        `,
      )}
    </nav>
  `;
}

function MenuDrawer({ onClose, onSelect, isAdmin = false }) {
  const items = [
    { label: "Início", icon: "home" },
    { label: "Configurar plano", icon: "settings" },
    { label: "Meu perfil", icon: "person" },
    { label: "Minhas Medidas", icon: "straighten" },
    { label: "Sobre o App", icon: "info" },
    ...(isAdmin ? [{ label: "Admin de notificações", icon: "notifications_active" }] : []),
    { label: "Sair", icon: "logout" },
  ];
  return html`
    <div className="fixed inset-0 z-[70] bg-black/30" onClick=${onClose}>
      <aside className="w-[82%] max-w-sm h-full bg-white p-6 flex flex-col gap-6 border-r border-slate-200/80" onClick=${(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
          <div>
            <${MosWordmark} className="mos-wordmark--drawer-kicker" />
            <h2 className="text-[1.6rem] font-bold text-jet-black">Menu</h2>
          </div>
          <button type="button" className="hover:opacity-80 transition-opacity active:scale-95" onClick=${onClose}>
            <${Icon} name="close" className="text-[#292B2D]" />
          </button>
        </div>
        <div className="flex flex-col gap-1 pt-2">
          ${items.map(
            (item) => html`
              <button type="button" className="w-full rounded-lg px-4 py-3 text-left font-semibold text-jet-black active:scale-[0.98] transition-transform flex items-center gap-4 hover:bg-slate-100" onClick=${() => onSelect(item.label)}>
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <${Icon} name=${item.icon} className="text-[#1f2937]" />
                </div>
                <span>${item.label}</span>
              </button>
            `,
          )}
        </div>
      </aside>
    </div>
  `;
}

function BottomNav({ active, onChange }) {
  const items = [
    { key: "home", label: "Início", icon: "home" },
    { key: "food", label: "Comida", icon: "restaurant" },
    { key: "water", label: "Água", icon: "water_drop" },
    { key: "training", label: "Treino", icon: "fitness_center" },
    { key: "plan", label: "Plano", icon: "description" },
  ];

  return html`
    <nav className="mos-mobile-bottom-nav fixed bottom-0 left-0 w-full px-4 pb-4 bg-transparent z-50">
      <div className="mos-bottom-nav max-w-[26rem] mx-auto w-full flex justify-around items-center gap-1 bg-[#0f0f12] rounded-2xl border border-white/5 px-2">
        ${items.map((item) => {
          const isActive = active === item.key;
          return html`
            <button
              className=${`flex flex-col items-center justify-center ${isActive ? "bottom-nav-active bg-[#DFF37D] text-[#0F172A] rounded-full px-3 py-2 shadow-[0_8px_18px_rgba(223,243,125,0.35)]" : "text-[#101846] px-3 py-2 hover:bg-slate-100 rounded-full"} transition-all active:scale-98`}
              onClick=${() => onChange(item.key)}
            >
              <${Icon} name=${item.icon} filled=${isActive} />
              <span className="font-['Sora'] text-[0.6875rem] font-medium mt-1">${item.label}</span>
            </button>
          `;
        })}
      </div>
    </nav>
  `;
}

function PlanConfigNav({ onOpenConfig, onOpenMeal, onOpenHistory, onGoHome }) {
  const items = [
    { label: "Novo plano", icon: "edit_note", onClick: onOpenConfig, active: true },
    { label: "Nova refeição", icon: "add_circle", onClick: onOpenMeal },
    { label: "Histórico", icon: "history", onClick: onOpenHistory },
    { label: "Home", icon: "home", onClick: onGoHome },
  ];

  return html`
    <nav className="mos-mobile-bottom-nav fixed bottom-0 left-0 w-full px-4 pb-4 bg-transparent z-50">
      <div className="mos-bottom-nav max-w-[26rem] mx-auto w-full flex justify-around items-center gap-1 bg-[#0f0f12] rounded-2xl border border-white/5 px-2">
        ${items.map((item) => html`
          <button
            className=${`flex flex-col items-center justify-center ${item.active ? "bottom-nav-active bg-[#DFF37D] text-[#0F172A] rounded-full px-3 py-2 shadow-[0_8px_18px_rgba(223,243,125,0.35)]" : "text-[#101846] px-3 py-2 hover:bg-slate-100 rounded-full"} transition-all active:scale-98`}
            onClick=${item.onClick}
          >
            <${Icon} name=${item.icon} filled=${item.active} />
            <span className="font-['Sora'] text-[0.6875rem] font-medium mt-1">${item.label}</span>
          </button>
        `)}
      </div>
    </nav>
  `;
}

function DesktopSidebar({ active, onChange, onOpenProfile, onOpenMeasures, onOpenSettings, onOpenAbout, onOpenAdminNotifications, onSignOut, isAdmin = false }) {
  const items = [
    { key: "home", label: "Início", icon: "home" },
    { key: "food", label: "Comida", icon: "restaurant" },
    { key: "water", label: "Água", icon: "water_drop" },
    { key: "training", label: "Treino", icon: "fitness_center" },
    { key: "plan", label: "Plano", icon: "description" },
  ];
  const secondaryItems = [
    { label: "Configurar plano", icon: "settings", onClick: onOpenSettings },
    { label: "Meu perfil", icon: "person", onClick: onOpenProfile },
    { label: "Minhas medidas", icon: "straighten", onClick: onOpenMeasures },
    { label: "Sobre o app", icon: "info", onClick: onOpenAbout },
    ...(isAdmin ? [{ label: "Admin de notificações", icon: "notifications_active", onClick: onOpenAdminNotifications }] : []),
    { label: "Sair", icon: "logout", onClick: onSignOut, danger: true },
  ];

  return html`
    <aside className="mos-desktop-sidebar">
      <div className="space-y-8">
        <div className="space-y-3">
          <button type="button" className="mos-desktop-brand" onClick=${() => onChange("home")}><${MosWordmark} /></button>
          <p className="mos-desktop-copy">Organize sua rotina em um só lugar.</p>
        </div>
        <nav className="space-y-2">
          ${items.map((item) => {
            const isActive = active === item.key || (item.key === "plan" && active === "supplements");
            return html`
              <button type="button" className=${`mos-desktop-nav-item ${isActive ? "mos-desktop-nav-item--active" : ""}`} onClick=${() => onChange(item.key)}>
                <${Icon} name=${item.icon} className="text-[1.15rem]" filled=${isActive} />
                <span>${item.label}</span>
              </button>
            `;
          })}
        </nav>
        <div className="mos-desktop-sidebar-divider"></div>
        <nav className="space-y-1.5">
          ${secondaryItems.map((item) => html`
            <button type="button" className=${`mos-desktop-subnav-item ${item.danger ? "mos-desktop-subnav-item--danger" : ""}`} onClick=${item.onClick}>
              <${Icon} name=${item.icon} className="text-[1rem]" />
              <span>${item.label}</span>
            </button>
          `)}
        </nav>
      </div>
    </aside>
  `;
}

function DesktopSearchPanel({ query, results, onQueryChange, onClose, onPick }) {
  return html`
    <div className="mos-desktop-search-panel">
      <div className="mos-desktop-search-panel-head">
        <div className="mos-desktop-search-panel-input">
          <${Icon} name="search" className="text-[1rem] text-[#64748B]" />
          <input
            type="search"
            value=${query}
            placeholder="Buscar..."
            onInput=${(e) => onQueryChange(e.currentTarget.value)}
            autoFocus
          />
        </div>
        <button type="button" className="mos-desktop-search-close" onClick=${onClose}>Fechar</button>
      </div>
      <div className="mos-desktop-search-results">
        ${results.length
          ? results.slice(0, 10).map((item) => html`
              <button type="button" className="mos-desktop-search-result" onClick=${() => onPick(item)}>
                <div className="mos-desktop-search-result-icon">
                  <${Icon} name=${item.icon} className="text-[1rem] text-[#0F172A]" />
                </div>
                <div className="min-w-0">
                  <p className="mos-desktop-search-result-title">${item.title}</p>
                  <p className="mos-desktop-search-result-subtitle">${item.subtitle}</p>
                </div>
                <span className="mos-desktop-search-result-meta">${item.meta}</span>
              </button>
            `)
          : html`
              <div className="mos-desktop-search-empty">
                ${query ? "Nada encontrado para essa busca." : "Busque alimentos, refeições, suplementos ou treinos sem sair da tela atual."}
              </div>
            `}
      </div>
    </div>
  `;
}

function DesktopRightRail({
  onSearch,
  onOpenNotifications,
  notificationCount = 0,
  avatarLabel,
  accountMenuOpen,
  onToggleAccountMenu,
  onCloseAccountMenu,
  onOpenProfile,
  onOpenMeasures,
  onOpenSettings,
  onSignOut,
  caloriesConsumed,
  calorieTarget,
  waterConsumedMl,
  waterTargetMl,
  trainingDone,
  onOpenFood,
  onOpenWater,
  onOpenTraining,
}) {
  const caloriesRemaining = Math.max(0, (Number(calorieTarget) || 0) - (Number(caloriesConsumed) || 0));
  const waterPercent = waterTargetMl > 0 ? Math.round(((Number(waterConsumedMl) || 0) / waterTargetMl) * 100) : 0;

  return html`
    <aside className="mos-desktop-right-rail">
      <div className="space-y-5">
        <div className="mos-desktop-right-head">
          <button type="button" className="mos-desktop-search mos-desktop-search--rail" onClick=${onSearch}>
            <${Icon} name="search" className="text-[1rem] text-[#64748B]" />
            <span>Buscar...</span>
          </button>
          <button type="button" className="mos-desktop-utility" onClick=${onOpenNotifications}>
            <${Icon} name="notifications" className="text-[1.1rem] text-[#334155]" />
            <${NotificationBadge} count=${notificationCount} />
          </button>
          <div className="relative">
            <button type="button" className="mos-desktop-avatar" onClick=${onToggleAccountMenu}>
              <span>${avatarLabel}</span>
            </button>
            ${accountMenuOpen
              ? html`
                  <div className="mos-desktop-account-menu">
                    <button type="button" className="mos-desktop-account-item" onClick=${() => { onCloseAccountMenu(); onOpenProfile(); }}>Meu perfil</button>
                    <button type="button" className="mos-desktop-account-item" onClick=${() => { onCloseAccountMenu(); onOpenMeasures(); }}>Minhas medidas</button>
                    <button type="button" className="mos-desktop-account-item" onClick=${() => { onCloseAccountMenu(); onOpenSettings(); }}>Configurações</button>
                    <button type="button" className="mos-desktop-account-item mos-desktop-account-item--danger" onClick=${() => { onCloseAccountMenu(); onSignOut(); }}>Sair</button>
                  </div>
                `
              : null}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="mos-desktop-rail-title">Atividade do dia</h2>
          <p className="mos-desktop-rail-copy">Leitura rápida para agir no momento certo.</p>
        </div>

        <button type="button" className="mos-desktop-status-row" onClick=${onOpenFood}>
          <div className="mos-desktop-status-top">
            <span className="mos-desktop-status-label">Calorias</span>
            <span className="mos-desktop-status-chip">${caloriesRemaining} kcal livres</span>
          </div>
          <strong className="mos-desktop-status-value">${caloriesConsumed}</strong>
          <p className="mos-desktop-status-copy">Consumidas de ${calorieTarget} kcal hoje</p>
        </button>

        <button type="button" className="mos-desktop-status-row" onClick=${onOpenWater}>
          <div className="mos-desktop-status-top">
            <span className="mos-desktop-status-label">Água</span>
            <span className="mos-desktop-status-chip">${Math.max(0, waterPercent)}%</span>
          </div>
          <strong className="mos-desktop-status-value">${waterConsumedMl}</strong>
          <p className="mos-desktop-status-copy">de ${waterTargetMl} ml da sua meta</p>
        </button>

        <button type="button" className="mos-desktop-status-row" onClick=${onOpenTraining}>
          <div className="mos-desktop-status-top">
            <span className="mos-desktop-status-label">Treino</span>
            <span className="mos-desktop-status-chip">${trainingDone ? "feito" : "pendente"}</span>
          </div>
          <strong className="mos-desktop-status-value">${trainingDone ? "OK" : "--"}</strong>
          <p className="mos-desktop-status-copy">${trainingDone ? "Treino registrado hoje" : "Nenhum treino registrado hoje"}</p>
        </button>
      </div>
    </aside>
  `;
}

function MacroBarDark({ proteinWidth = "45%", carbWidth = "65%", fatWidth = "30%" }) {
  return html`
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[0.6875rem] font-bold opacity-80">Carbo</span>
          <span className="text-sm font-bold">${carbWidth.replace("%", "")}g</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#4558C8]" style=${{ width: carbWidth }}></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[0.6875rem] font-bold opacity-80">Proteínas</span>
          <span className="text-sm font-bold">${proteinWidth.replace("%", "")}g</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#EF5F37]" style=${{ width: proteinWidth }}></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[0.6875rem] font-bold opacity-80">Gorduras</span>
          <span className="text-sm font-bold text-[#D9B8F3]">${fatWidth.replace("%", "")}g</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#D9B8F3]" style=${{ width: fatWidth }}></div>
        </div>
      </div>
    </div>
  `;
}

function FoodItem({ food, onEdit, onDelete, onOpen, dark = false }) {
  return html`
    <button className=${`${dark ? "bg-surface-container-low" : "bg-surface-container-low"} w-full p-5 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-transform cursor-pointer text-left`} onClick=${onOpen}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center">
          <${Icon} name="restaurant" className="text-[#292B2D]" />
        </div>
        <div>
          <p className="font-bold text-[#292B2D]">${food.name}</p>
          <p className="text-[0.6875rem] font-medium text-primary">${food.quantity} • ${food.calories} kcal</p>
          <p className="text-[0.75rem] text-on-surface-variant mt-1">${food.benefit}</p>
          <div className="flex gap-3 mt-2">
            <button type="button" className="text-[0.6875rem] font-bold text-[#4558C8]" onClick=${(e) => { e.stopPropagation(); onEdit(); }}>Editar</button>
            <button type="button" className="text-[0.6875rem] font-bold text-error" onClick=${(e) => { e.stopPropagation(); onDelete(); }}>Excluir</button>
          </div>
        </div>
      </div>
      <${Icon} name="chevron_right" className="text-outline" />
    </button>
  `;
}

function Modal({ title, children, onClose }) {
  return html`
    <div className="fixed inset-0 bg-jet-black/15 z-[60] flex items-center justify-center px-4 pt-16 pb-24" onClick=${onClose}>
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl overflow-hidden flex flex-col gap-8 p-8 border-0 shadow-none" onClick=${(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <span className="text-[0.6875rem] font-medium text-royal-blue">Nutrição</span>
          <h2 className="text-[1.75rem] font-bold text-jet-black leading-tight">${title}</h2>
        </div>
        ${children}
        <button type="button" className="w-full h-14 bg-surface-container-low text-jet-black rounded-lg font-bold text-base hover:bg-surface-container-highest active:scale-[0.98] transition-all" onClick=${onClose}>Cancelar</button>
      </div>
    </div>
  `;
}

function AuthWordmark() {
  return html`<div><${MosWordmark} className="mos-wordmark--auth" /></div>`;
}

function App() {
  const [state, setState] = useState(loadState);
  const [appRoute, setAppRoute] = useState(getMosRoute());
  const [screen, setScreen] = useState(() => (shouldOpenLoginAfterReload() ? "login" : loadState().auth?.signedIn ? "home" : "welcome"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [notificationsCleared, setNotificationsCleared] = useState(false);
  const [searchOpenFrom, setSearchOpenFrom] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [foodDate, setFoodDate] = useState(getTodayKey());
  const [foodCalendarOpen, setFoodCalendarOpen] = useState(false);
  const [foodCalendarMonth, setFoodCalendarMonth] = useState(parseDateKey(getTodayKey()));
  const [waterHistoryOpen, setWaterHistoryOpen] = useState(false);
  const [waterHistoryDate, setWaterHistoryDate] = useState(getTodayKey());
  const [waterHistoryMonth, setWaterHistoryMonth] = useState(parseDateKey(getTodayKey()));
  const [modal, setModal] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedConsumedId, setSelectedConsumedId] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedSupplementId, setSelectedSupplementId] = useState(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);
  const [activeTraining, setActiveTraining] = useState(null);
  const [completedTraining, setCompletedTraining] = useState(null);
  const [trainingDraft, setTrainingDraft] = useState(null);
  const [trainingClock, setTrainingClock] = useState(Date.now());
  const [newTrainingExerciseId, setNewTrainingExerciseId] = useState(null);
  const [appNewsEntries] = useState([
    {
      id: "news-2026-03-30",
      date: "2026-03-30",
      title: "Melhorias de edição e navegação",
      description: "Os botões de salvar agora começam desativados e só ativam quando existe alguma alteração real. Também adicionamos alertas antes de sair de páginas com edição não salva.",
    },
    {
      id: "news-2026-03-29",
      date: "2026-03-29",
      title: "Nova página de água e ajustes visuais",
      description: "A tela de água ganhou um visual mais forte de consumo diário, registro rápido por ml e uma leitura mais clara do histórico.",
    },
    {
      id: "news-2026-03-28",
      title: "Configurar plano ficou mais completo",
      date: "2026-03-28",
      description: "A área de configuração do plano passou a ter mais cara de painel administrativo, com resumo das refeições e fluxo melhor para criação e edição.",
    },
  ]);
  const [editor, setEditor] = useState(null);
  const [substituteFood, setSubstituteFood] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [draftGuard, setDraftGuard] = useState({ key: null, dirty: false });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", confirmPassword: "", age: "", weight: "", height: "", goal: "lose", acceptedTerms: false });
  const [recoverEmail, setRecoverEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authNoticeTitle, setAuthNoticeTitle] = useState("");
  const [authNoticeTone, setAuthNoticeTone] = useState("error");
  const [authBusy, setAuthBusy] = useState(false);
  const planTimelineRef = useRef(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const authConfigured = isSupabaseConfigured();
  const recoveryFlowRef = useRef(isRecoveryRedirect());
  const [passwordRecoveryReady, setPasswordRecoveryReady] = useState(recoveryFlowRef.current);
  const passwordStrengthScore = useMemo(() => {
    const value = signupForm.password || "";
    let score = 0;
    if (value.length >= 6) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }, [signupForm.password]);
  const passwordStrengthLabel =
    passwordStrengthScore >= 4 ? "Senha forte" : passwordStrengthScore >= 2 ? "Senha média" : signupForm.password ? "Senha fraca" : "Use 6+ caracteres, número e letra";
  const signupDisabledReason =
    !signupForm.name.trim() ? "Preencha seu nome para continuar." :
      !signupForm.email.trim() ? "Preencha seu e-mail para continuar." :
        !signupForm.age ? "Informe sua idade." :
          !signupForm.height ? "Informe sua altura." :
            !signupForm.weight ? "Informe seu peso." :
              !signupForm.password ? "Crie uma senha para continuar." :
                !signupForm.confirmPassword ? "Confirme a senha para continuar." :
                  signupForm.password !== signupForm.confirmPassword ? "As senhas precisam ser iguais." :
                    !signupForm.acceptedTerms ? "Aceite os termos para continuar." :
                      "";

  function markDraftDirty(key) {
    setDraftGuard({ key, dirty: true });
  }

  function clearDraft(key = null) {
    setDraftGuard((current) => {
      if (!key || current.key === key) return { key: null, dirty: false };
      return current;
    });
  }

  function isDraftDirty(key) {
    return draftGuard.key === key && draftGuard.dirty;
  }

  function clearAuthNotice() {
    setAuthNotice("");
    setAuthNoticeTitle("");
    setAuthNoticeTone("error");
  }

  function showAuthNotice(message, { tone = "error", title = "" } = {}) {
    setAuthNotice(normalizeAppMessage(message));
    setAuthNoticeTitle(title);
    setAuthNoticeTone(tone);
  }

  function renderAuthNoticeCard() {
    if (!authNotice) return null;

    const palette =
      authNoticeTone === "info"
        ? "bg-[#eef6ff] border border-[#dbe7ff] text-[#123a72]"
        : authNoticeTone === "success"
          ? "bg-[#eefaf2] border border-[#d4eddc] text-[#184f2d]"
          : "bg-[#fff6f2] border border-[#f5ddd5] text-[#7a2d1b]";

    return html`
      <div className=${`rounded-[10px] p-4 space-y-2 ${palette}`}>
        ${authNoticeTitle ? html`<p className="text-sm font-bold">${authNoticeTitle}</p>` : null}
        <p className="text-sm leading-relaxed">${authNotice}</p>
      </div>
    `;
  }

  function confirmDiscard(action, message = "Deseja sair da página? As alterações não salvas serão perdidas.") {
    if (!draftGuard.dirty) {
      action();
      return;
    }
    setConfirmAction({
      title: "Descartar alterações?",
      message,
      confirmLabel: "Sair sem salvar",
      onConfirm: () => {
        setDraftGuard({ key: null, dirty: false });
        action();
      },
    });
  }

  function getPrimaryActionClass(disabled) {
    return `w-full h-14 bg-[#EF5F37] text-white rounded-[10px] font-bold text-base transition-all ${
      disabled ? "opacity-45 cursor-not-allowed" : "active:scale-[0.98]"
    }`;
  }

  function getSecondaryActionClass(disabled) {
    return `w-full h-14 bg-surface-container-low text-jet-black rounded-[10px] font-bold text-base transition-all ${
      disabled ? "opacity-45 cursor-not-allowed" : "active:scale-[0.98]"
    }`;
  }

  useEffect(() => {
    const hasOverlayOpen = drawerOpen || notificationsOpen || foodCalendarOpen || waterHistoryOpen || desktopSearchOpen || Boolean(modal) || Boolean(editor) || Boolean(substituteFood) || Boolean(confirmAction);
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    if (hasOverlayOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overscrollBehavior = "none";
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overscrollBehavior = "";
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      body.style.overscrollBehavior = previousBodyOverscroll;

      if (hasOverlayOpen) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [drawerOpen, notificationsOpen, foodCalendarOpen, waterHistoryOpen, modal, editor, substituteFood, confirmAction]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!draftGuard.dirty) return undefined;
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [draftGuard.dirty]);

  useEffect(() => {
    const header = document.querySelector(".top-bar");
    if (!header) return undefined;

    const headroomScreens = new Set([
      "home",
      "food",
      "plan",
      "water",
      "training",
      "supplements",
      "measures",
      "profile",
      "about-app",
      "app-news",
      "history",
    ]);
    const offset = 80;
    const tolerance = 10;
    let lastY = window.scrollY;
    let ticking = false;
    let enabled = false;

    const setPinned = () => {
      header.classList.add("headroom--pinned");
      header.classList.remove("headroom--unpinned");
    };

    const setUnpinned = () => {
      header.classList.add("headroom--unpinned");
      header.classList.remove("headroom--pinned");
    };

    const canEnable = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight > 160;
      return headroomScreens.has(screen) && scrollable;
    };

    const updateEnabled = () => {
      enabled = canEnable();
      if (!enabled) {
        setPinned();
      }
      return enabled;
    };

    const update = () => {
      if (!enabled) {
        ticking = false;
        return;
      }
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      const beyondOffset = currentY > offset;

      if (Math.abs(delta) > tolerance) {
        if (delta > 0 && beyondOffset) {
          setUnpinned();
        } else if (delta < 0) {
          setPinned();
        }
        lastY = currentY;
      }
      if (currentY <= 8) setPinned();
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    const onResize = () => {
      updateEnabled();
      lastY = window.scrollY;
    };

    const init = () => {
      updateEnabled();
      lastY = window.scrollY;
    };

    const initId = window.requestAnimationFrame(init);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.cancelAnimationFrame(initId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [screen]);

  const todayKey = getTodayKey();
  const date = todayKey;
  const consumedMeals = state.consumedMeals[todayKey] || [];


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let active = true;
    if (!authConfigured) {
      if (LOCAL_DEMO_MODE) {
        setState((current) => ({
          ...current,
          auth: {
            ...current.auth,
            registered: true,
            signedIn: true,
          },
        }));
        setScreen("home");
      }
      setAuthReady(true);
      return () => {
        active = false;
      };
    }

    (async () => {
      const result = await getCurrentAuthState();
      if (!active) return;

      if (result.error) {
        showAuthNotice("Não foi possível validar sua sessão agora. Tente novamente ou faça login outra vez.");
        setAuthReady(true);
        return;
      }

      if (result.session && result.user) {
        applyHydratedAuthState(result);
        setScreen(recoveryFlowRef.current ? "reset-password" : "home");
        if (recoveryFlowRef.current) setPasswordRecoveryReady(true);
      } else {
        setState((current) => ({
          ...structuredClone(defaultState),
          auth: {
            ...structuredClone(defaultState).auth,
            registered: current.auth?.registered ?? false,
            signedIn: false,
            email: current.auth?.email || current.profile?.email || "",
            password: "",
          },
        }));
        setScreen(recoveryFlowRef.current ? "reset-password" : "welcome");
        if (recoveryFlowRef.current) setPasswordRecoveryReady(true);
      }

      setAuthReady(true);
    })();

    return () => {
      active = false;
    };
  }, [authConfigured]);

  useEffect(() => {
    if (!authConfigured) return undefined;

    const unsubscribe = subscribeToAuthChanges((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryFlowRef.current = true;
        if (globalThis.history?.replaceState) {
          globalThis.history.replaceState(null, "", `${globalThis.location?.pathname || "/"}${globalThis.location?.hash || ""}`);
        }
        clearAuthNotice();
        setResetPasswordForm({ password: "", confirmPassword: "" });
        setShowResetPassword(false);
        setShowResetPasswordConfirm(false);
        setPasswordRecoveryReady(true);
        setScreen("reset-password");
        showAuthNotice(
          "Seu link de recuperação foi validado. Agora defina uma nova senha para voltar a entrar no MOS!",
          { tone: "info", title: "Criar nova senha" },
        );
      }
    });

    return unsubscribe;
  }, [authConfigured]);

  useEffect(() => {
    const syncRoute = () => setAppRoute(getMosRoute());
    globalThis.addEventListener?.("popstate", syncRoute);
    return () => globalThis.removeEventListener?.("popstate", syncRoute);
  }, []);

  useEffect(() => {
    setDesktopAccountMenuOpen(false);
  }, [screen]);

  useEffect(() => {
    if (!desktopSearchOpen) return;
    setDesktopAccountMenuOpen(false);
    setNotificationsOpen(false);
  }, [desktopSearchOpen]);

  const foodMeals = state.consumedMeals[foodDate] || [];

  const allConsumedFoods = (state.consumedMeals[date] || []).flatMap((meal) => meal.foods);
  const summary = summarizeFoods(allConsumedFoods);
  const water = state.water[waterHistoryDate] ?? 0;
  const waterGoal = Number(state.profile.waterTargetMl) || 3000;
  const measureEntries = [...(state.measureEntries || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestMeasure = measureEntries[measureEntries.length - 1] || defaultState.measureEntries[defaultState.measureEntries.length - 1];
  const previousMeasure = measureEntries[measureEntries.length - 2] || latestMeasure;
  const latestBmi = computeBmi(latestMeasure.weight, latestMeasure.height);
  const previousBmi = computeBmi(previousMeasure.weight, previousMeasure.height);
  const waterEntries = state.waterHistory?.[waterHistoryDate] || [];
  const remaining = state.profile.calorieTarget - summary.calories;
  const progress = Math.min(100, Math.max(0, (summary.calories / Math.max(1, state.profile.calorieTarget)) * 100));
  const planTotals = summarizeFoods(state.planMeals.flatMap((meal) => meal.foods));
  const sortedPlanMeals = sortPlanMealsByTime(state.planMeals);
  const selectedPlan = state.planMeals.find((meal) => meal.id === selectedPlanId);
  const selectedConsumed = foodMeals.find((meal) => meal.id === selectedConsumedId);
  const trainingPlans = Array.isArray(state.trainingPlans) ? state.trainingPlans : [];
  const selectedTraining = trainingPlans.find((plan) => plan.id === selectedTrainingId) || trainingPlans[0] || null;
  const activeTrainingPlan = activeTraining ? trainingPlans.find((plan) => plan.id === activeTraining.planId) || null : null;
  const trainingHistory = Array.isArray(state.trainingHistory) ? state.trainingHistory : [];
  const latestTrainingEntry = trainingHistory[0] || null;
  const currentTrainingExerciseIndex = Math.max(0, activeTraining?.currentExerciseIndex ?? 0);
  const currentTrainingExercise = activeTrainingPlan?.exercises?.[Math.min(currentTrainingExerciseIndex, Math.max(0, (activeTrainingPlan?.exercises?.length || 1) - 1))] || null;
  const completedTrainingExerciseIds = activeTraining?.completedExerciseIds || [];
  const completedTrainingExercises = activeTrainingPlan
    ? activeTrainingPlan.exercises.filter((exercise) => completedTrainingExerciseIds.includes(exercise.id)).length
    : 0;
  const activeTrainingElapsedSeconds = activeTraining?.startedAt
    ? Math.max(
        0,
        Math.floor(
          (
            ((activeTraining?.pausedAt || trainingClock) ?? trainingClock) -
            activeTraining.startedAt -
            (activeTraining.pausedTotalMs || 0)
          ) / 1000,
        ),
      )
    : 0;
  const pausedTrainingSeconds = activeTraining?.pausedAt ? Math.max(0, Math.floor((trainingClock - activeTraining.pausedAt) / 1000)) : 0;
  const foodDateLabel = foodDate === todayKey ? "Hoje" : formatDateLabel(foodDate);
  const markedFoodDates = new Set(Object.entries(state.consumedMeals).filter(([, meals]) => Array.isArray(meals) && meals.length).map(([key]) => key));
  const markedWaterDates = new Set(Object.entries(state.waterHistory || {}).filter(([, entries]) => Array.isArray(entries) && entries.length).map(([key]) => key));
  const waterViewDateLabel = waterHistoryDate === todayKey ? "Hoje" : formatDateLabel(waterHistoryDate);
  const isSignedIn = !["welcome", "signup", "login", "recover-password", "reset-password", "legal"].includes(screen);
  const adminEmail = String(state.profile.email || state.auth.email || "").toLowerCase();
  const isAdminUser = LOCAL_DEMO_MODE || MOS_ADMIN_EMAILS.has(adminEmail) || adminEmail.includes("nirlandy") || globalThis.localStorage?.getItem("mos-admin") === "1";
  const adminNotifications = (state.appNotifications || []).map((item) => ({
    id: `admin-${item.id}`,
    icon: "campaign",
    title: item.title || "Aviso do MOS!",
    body: item.body || "",
    tag: item.tag || "MOS!",
    action: () => setScreen("home"),
  }));
  const systemNotifications = [
    state.supplements[0] && {
      id: "supplement-alert",
      icon: "notifications_active",
      title: "Lembrete de suplemento",
      body: `Hora de revisar o lembrete de ${state.supplements[0].name.toLowerCase()} e manter a rotina em dia.`,
      tag: "Suplementos",
      action: () => setScreen("supplements"),
    },
    {
      id: "measures-update",
      icon: "monitor_weight",
      title: "Dados pessoais desatualizados",
      body: "Atualize peso e medidas para o MOS! calcular seu progresso com mais precisão.",
      tag: "Perfil",
      action: () => setScreen("measures"),
    },
    {
      id: "app-news",
      icon: "tips_and_updates",
      title: "Melhorias no app",
      body: "A Home e a central de notificações receberam ajustes para o uso diário ficar mais claro.",
      tag: "Novidades",
      action: () => setScreen("app-news"),
    },
    ].filter(Boolean);
  const notifications = notificationsCleared ? [] : [...adminNotifications, ...systemNotifications];
  globalThis.MOS_NOTIFICATION_COUNT = notifications.length;
  const currentDayMeals = state.consumedMeals[date] || [];
  const profileInitial = (state.profile.name?.trim()?.[0] || state.profile.email?.trim()?.[0] || "M").toUpperCase();
  const trainingDoneToday = trainingHistory.some((entry) => entry.date === todayKey);

  useEffect(() => {
    if (screen !== "plan") return;
    if (!state.planMeals.length) return;
    const automaticPlanMeal = getCurrentPlanMeal(state.planMeals);
    if (!automaticPlanMeal) return;
    setSelectedPlanId(automaticPlanMeal.id);
  }, [screen, state.planMeals]);

  useEffect(() => {
    if (screen !== "plan") return;
    if (!selectedPlanId) return;
    const container = planTimelineRef.current;
    const activeTimelineItem = document.getElementById(`plan-timeline-item-${selectedPlanId}`);
    if (!container || !activeTimelineItem) return;
    const targetLeft =
      activeTimelineItem.offsetLeft - (container.clientWidth / 2) + (activeTimelineItem.clientWidth / 2);
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [screen, selectedPlanId]);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location?.search || "");
    if (params.get("admin") === "1" && isAdminUser && isSignedIn) {
      setScreen("admin-notifications");
    }
  }, [isAdminUser, isSignedIn]);

  const recentActivities = [
    ...currentDayMeals.slice(0, 3).map((meal) => ({
      id: `recent-meal-${meal.id}`,
      icon: "restaurant",
      title: meal.title || meal.name,
      body: meal.description || "Refeição registrada hoje.",
      meta: "Comida",
      action: () => {
        setSelectedConsumedId(meal.id);
        setScreen("food-detail");
      },
    })),
    ...waterEntries.slice(0, 2).map((entry) => ({
      id: `recent-water-${entry.id}`,
      icon: "water_drop",
      title: entry.label,
      body: `${entry.amount}ml registrados às ${entry.time}.`,
      meta: "Água",
      action: () => setScreen("water"),
    })),
    ...(latestTrainingEntry
      ? [
          {
            id: `recent-training-${latestTrainingEntry.id}`,
            icon: "fitness_center",
            title: latestTrainingEntry.planName,
            body: `${latestTrainingEntry.seriesCompleted} séries concluídas em ${Math.max(1, Math.round(latestTrainingEntry.durationSeconds / 60))} min.`,
            meta: "Treino",
            action: () => {
              setSelectedTrainingId(latestTrainingEntry.planId);
              setScreen("training-summary");
            },
          },
        ]
      : []),
    ...state.supplements.slice(0, 2).map((supplement) => ({
      id: `recent-supplement-${supplement.id}`,
      icon: "nutrition",
      title: supplement.name,
      body: supplement.instruction,
      meta: "Suplementos",
      action: () => {
        setSelectedSupplementId(supplement.id);
        setScreen("supplement-detail");
      },
    })),
  ].slice(0, 6);
  const searchableItems = [
    ...currentDayMeals.map((meal) => ({
      id: `consumed-${meal.id}`,
      icon: "restaurant",
      title: meal.title || meal.name,
      subtitle: meal.description || "Refeição consumida hoje.",
      meta: "Comida",
      keywords: `${meal.title} ${meal.name} ${meal.description} ${meal.foods.map((food) => food.name).join(" ")}`.toLowerCase(),
      action: () => {
        setSelectedConsumedId(meal.id);
        setScreen("food-detail");
      },
    })),
    ...state.planMeals.map((meal) => ({
      id: `plan-${meal.id}`,
      icon: "description",
      title: meal.name,
      subtitle: meal.description || meal.title,
      meta: "Plano alimentar",
      keywords: `${meal.name} ${meal.title} ${meal.description} ${meal.foods.map((food) => food.name).join(" ")}`.toLowerCase(),
      action: () => {
        setSelectedPlanId(meal.id);
        setScreen("plan-detail");
      },
    })),
    ...trainingPlans.map((plan) => ({
      id: `training-${plan.id}`,
      icon: "fitness_center",
      title: plan.name,
      subtitle: `${plan.exercises.length} exercícios • ${plan.estimatedMinutes} min`,
      meta: "Treino",
      keywords: `${plan.name} ${plan.exercises.map((exercise) => exercise.name).join(" ")}`.toLowerCase(),
      action: () => {
        setSelectedTrainingId(plan.id);
        setScreen("training-detail");
      },
    })),
    ...allConsumedFoods.map((food) => ({
      id: `food-${food.id}`,
      icon: "lunch_dining",
      title: food.name,
      subtitle: `${food.calories} kcal • ${food.quantity}`,
      meta: "Alimento",
      keywords: `${food.name} ${food.quantity} ${food.benefit}`.toLowerCase(),
      action: () => openFoodDetailItem(food, "search"),
    })),
    ...state.supplements.map((supplement) => ({
      id: `supplement-${supplement.id}`,
      icon: "nutrition",
      title: supplement.name,
      subtitle: `${supplement.dosage} • ${supplement.instruction}`,
      meta: "Suplementos",
      keywords: `${supplement.name} ${supplement.dosage} ${supplement.instruction} ${supplement.period}`.toLowerCase(),
      action: () => {
        setSelectedSupplementId(supplement.id);
        setScreen("supplement-detail");
      },
    })),
    ...(isAdminUser
      ? [
          {
            id: "admin-notifications",
            icon: "campaign",
            title: "Admin de notificações",
            subtitle: "Enviar aviso para usuários do MOS!",
            meta: "Admin",
            keywords: "admin notificações notificacao avisos mensagens usuários usuarios mos",
            action: () => setScreen("admin-notifications"),
          },
        ]
      : []),
  ];
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearch
    ? searchableItems.filter((item) => item.keywords.includes(normalizedSearch) || item.title.toLowerCase().includes(normalizedSearch))
    : [];
  const history = useMemo(
    () =>
      Object.entries(state.consumedMeals)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([day, meals]) => ({ day, meals: meals.length, calories: summarizeFoods(meals.flatMap((meal) => meal.foods)).calories })),
    [state.consumedMeals],
  );

  function mutate(mutator) {
    setState((current) => {
      const draft = structuredClone(current);
      mutator(draft);
      return draft;
    });
  }

  function applyHydratedAuthState(result, fallbackEmail = "") {
    setState((current) => ({
      ...current,
      auth: {
        ...current.auth,
        registered: true,
        signedIn: true,
        email: result.user?.email || fallbackEmail || current.auth?.email || "",
        password: "",
      },
      profile: {
        ...current.profile,
        name: result.profile?.name || result.user?.user_metadata?.name || current.profile.name,
        email: result.profile?.email || result.user?.email || fallbackEmail || current.profile.email,
        city: result.profile?.city || current.profile.city,
        birthday: result.profile?.birth_date || current.profile.birthday,
        waterTargetMl: Number(result.profile?.water_target_ml) || current.profile.waterTargetMl,
        activeGoal: result.profile?.goal || current.profile.activeGoal,
        planFocus: result.profile?.plan_focus || current.profile.planFocus,
        planNotes: result.profile?.plan_notes || current.profile.planNotes,
        weight: Number(result.profile?.weight) || current.profile.weight,
        height: Number(result.profile?.height) || current.profile.height,
        age: Number(result.profile?.age) || current.profile.age,
        targetWeight: Number(result.profile?.target_weight) || current.profile.targetWeight,
      },
      measureEntries: Array.isArray(result.measureEntries) ? result.measureEntries : current.measureEntries,
      supplements: Array.isArray(result.supplements) ? result.supplements : current.supplements,
      waterHistory: result.waterHistory || current.waterHistory,
      water: result.waterTotals || current.water,
      planMeals: Array.isArray(result.planMeals) ? result.planMeals : current.planMeals,
      consumedMeals: result.consumedMeals || current.consumedMeals,
      feedbackEntries: Array.isArray(result.feedbackEntries) ? result.feedbackEntries : current.feedbackEntries,
      appNotifications: Array.isArray(result.appNotifications) ? result.appNotifications : current.appNotifications,
    }));
  }

  function openNotifications() {
    confirmDiscard(() => {
      setDrawerOpen(false);
      setNotificationsOpen(true);
    }, "Deseja sair da edição atual? As alterações não salvas serão perdidas.");
  }

  function clearNotifications() {
    setNotificationsCleared(true);
  }

  function askDeleteConfirm(config) {
    setConfirmAction({
      title: config.title || "Confirmar ação",
      message: config.message || "Tem certeza que deseja apagar este item?",
      confirmLabel: config.confirmLabel || "Confirmar",
      onConfirm: config.onConfirm,
    });
  }

  function handleConfirmAction() {
    const action = confirmAction?.onConfirm;
    setConfirmAction(null);
    action?.();
  }

  function openSearch(back = screen) {
    confirmDiscard(() => {
      setDrawerOpen(false);
      setNotificationsOpen(false);
      setSearchOpenFrom(back);
      setSearchQuery("");
      setScreen("search");
    }, "Deseja sair da edição atual? As alterações não salvas serão perdidas.");
  }

  function openDesktopSearch() {
    setSearchOpenFrom(screen);
    setDesktopSearchOpen(true);
  }

  function closeDesktopSearch() {
    setDesktopSearchOpen(false);
    setSearchQuery("");
  }

  function handleDesktopSearchPick(item) {
    setDesktopSearchOpen(false);
    setSearchQuery("");
    item.action?.();
  }

  function openDesktopSettings() {
    setScreen("plan-config");
  }

  function renderSignedInScreen() {
    switch (screen) {
      case "home":
        return renderHome();
      case "food":
        return renderFood();
      case "food-detail":
        return renderFoodDetail();
      case "ingredient-detail":
        return renderIngredientDetail();
      case "plan":
        return renderPlan();
      case "plan-config":
        return renderPlanConfig();
      case "plan-detail":
        return renderPlanDetail();
      case "supplements":
        return renderSupplements();
      case "register-supplement":
        return renderRegisterSupplement();
      case "supplement-detail":
        return renderSupplementDetail();
      case "water":
        return renderWater();
      case "training":
        return renderTraining();
      case "training-detail":
        return renderTrainingDetail();
      case "training-execution":
        return renderTrainingExecution();
      case "training-summary":
        return renderTrainingSummary();
      case "training-edit":
        return renderTrainingEdit();
      case "profile":
        return renderProfile();
      case "measures":
        return renderMeasures();
      case "about-app":
        return renderAboutApp();
      case "app-news":
        return renderAppNews();
      case "admin-notifications":
        return isAdminUser ? renderAdminNotifications() : renderHome();
      case "history":
        return renderHistory();
      case "search":
        return renderSearch();
      default:
        return renderHome();
    }
  }

  function openNotificationItem(item) {
    setNotificationsOpen(false);
    item.action?.();
  }

  function openFoodCalendar() {
    setFoodCalendarMonth(parseDateKey(foodDate));
    setFoodCalendarOpen(true);
  }

  function openWaterHistory() {
    setWaterHistoryMonth(parseDateKey(waterHistoryDate));
    setWaterHistoryOpen(true);
  }

  function pickFoodDate(nextDate) {
    setFoodDate(nextDate);
    setSelectedConsumedId(null);
    setFoodCalendarOpen(false);
  }

  function goToTodayFood() {
    setFoodDate(todayKey);
    setFoodCalendarMonth(parseDateKey(todayKey));
    setSelectedConsumedId(null);
    setFoodCalendarOpen(false);
  }

  function pickWaterHistoryDate(nextDate) {
    setWaterHistoryDate(nextDate);
    setWaterHistoryOpen(false);
  }

  function goToTodayWaterHistory() {
    setWaterHistoryDate(todayKey);
    setWaterHistoryMonth(parseDateKey(todayKey));
    setWaterHistoryOpen(false);
  }

  function openMenuItem(title) {
    confirmDiscard(() => {
      setDrawerOpen(false);
      if (title === "Início") {
        setScreen("home");
        return;
      }
      if (title === "Meu perfil") {
        setScreen("profile");
        return;
      }
      if (title === "Minhas Medidas") {
        setScreen("measures");
        return;
      }
      if (title === "Configurar plano") {
        setScreen("plan-config");
        return;
      }
      if (title === "Sobre o App") {
        setScreen("about-app");
        return;
      }
      if (title === "Admin de notificações") {
        setScreen("admin-notifications");
        return;
      }
      if (title === "Sair") {
        askDeleteConfirm({
          title: "Ir para o login",
          message: "Deseja sair desta área e voltar para a tela de login?",
          confirmLabel: "Confirmar",
          onConfirm: async () => {
            setDrawerOpen(false);
            setNotificationsOpen(false);
            setConfirmAction(null);
            setModal(null);
            clearAuthNotice();
            recoveryFlowRef.current = false;
            setPasswordRecoveryReady(false);
            setShowLoginPassword(false);
            setShowSignupPassword(false);
            setShowSignupConfirmPassword(false);
            setShowResetPassword(false);
            setShowResetPasswordConfirm(false);
            setRecoverEmail("");
            setResetPasswordForm({ password: "", confirmPassword: "" });
            setSignupForm({ name: "", email: "", password: "", confirmPassword: "", age: "", weight: "", height: "", goal: "lose", acceptedTerms: false });

            const nextEmail = state.auth?.email || state.profile?.email || "";
            if (authConfigured) {
              setAuthBusy(true);
              const result = await signOutUser();
              setAuthBusy(false);
              if (!result.ok) {
                showAuthNotice(result.error?.message || "Não foi possível sair da conta agora.");
                return;
              }
            }

            const nextState = {
              ...structuredClone(defaultState),
              auth: {
                ...structuredClone(defaultState).auth,
                registered: true,
                signedIn: false,
                email: nextEmail,
                password: "",
              },
            };

            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
              sessionStorage.setItem(FORCE_LOGIN_KEY, "1");
            } catch (error) {
              console.error(error);
            }

            setState(nextState);
            setLoginForm({ email: nextEmail, password: "" });
            window.location.assign(`${window.location.origin}${window.location.pathname}`);
          },
        });
        return;
      }
      setScreen("home");
    }, "Deseja sair da edição atual? As alterações não salvas serão perdidas.");
  }

  function openAuthScreen(nextScreen) {
    clearAuthNotice();
    navigateMosRoute("app");
    setAppRoute("app");
    setScreen(nextScreen);
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    const name = signupForm.name.trim();
    const email = signupForm.email.trim().toLowerCase();
    const password = signupForm.password;
    const confirmPassword = signupForm.confirmPassword;
    const age = Number(signupForm.age) || 0;
    const weight = Number(signupForm.weight) || 0;
    const height = Number(signupForm.height) || 0;
    const goal = signupForm.goal || "lose";
    const calorieTarget = calculateSuggestedCalories({ weight, height, age, goal });
    const goalMeta = getGoalMeta(goal);

    if (!name || !email || !password || !confirmPassword || !signupForm.acceptedTerms || !age || !weight || !height) {
      showAuthNotice("Preencha todos os campos obrigatórios para concluir o cadastro.");
      return;
    }
    if (password.length < 6) {
      showAuthNotice("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      showAuthNotice("As senhas precisam ser iguais para concluir o cadastro.");
      return;
    }

    if (authConfigured) {
      setAuthBusy(true);
      const result = await signUpWithEmail({ name, email, password, age, weight, height, calorieTarget, goal: goalMeta.label, planFocus: goalMeta.focus });
      setAuthBusy(false);

      if (!result.ok) {
        if (result.duplicateAccount) {
          setLoginForm({ email, password: "" });
          showAuthNotice(
            "Já existe uma conta cadastrada com este e-mail. Se você já criou a conta antes, tente entrar ou redefinir sua senha.",
            { tone: "info", title: "Conta já cadastrada" },
          );
          return;
        }
        showAuthNotice(result.error?.message || "Não foi possível criar sua conta agora.");
        return;
      }

      mutate((draft) => {
        draft.auth = {
          registered: true,
          signedIn: Boolean(result.session),
          email,
          password: "",
        };
        draft.profile.name = name;
        draft.profile.email = email;
        draft.profile.age = age;
        draft.profile.weight = weight;
        draft.profile.height = height;
        draft.profile.targetWeight = goal === "lose" ? Math.max(0, weight - 5) : goal === "gain" ? weight + 3 : weight;
        draft.profile.calorieTarget = calorieTarget || draft.profile.calorieTarget;
        draft.profile.activeGoal = goalMeta.label;
        draft.profile.planFocus = goalMeta.focus;
      });

      setLoginForm({ email, password: "" });
      setSignupForm({ name: "", email: "", password: "", confirmPassword: "", age: "", weight: "", height: "", goal: "lose", acceptedTerms: false });

      if (result.needsEmailConfirmation) {
        showAuthNotice(
          `Enviamos um link de confirmação para ${email}. Abra seu e-mail e confirme a conta antes de entrar no MOS! Se não encontrar a mensagem, verifique a pasta de spam ou promoções.`,
          { tone: "info", title: "Confirme seu e-mail" }
        );
        setScreen("login");
      } else {
        const hydrated = await getCurrentAuthState();
        if (hydrated.session && hydrated.user) {
          applyHydratedAuthState(hydrated, email);
        }
        clearAuthNotice();
        navigateMosRoute("app", { replace: true });
        setAppRoute("app");
        setScreen("home");
      }
      return;
    }

    showAuthNotice(getSupabaseSetupMessage(), {
      tone: "error",
      title: "Autenticação indisponível",
    });
    return;
  }

  async function handleLoginSubmit() {
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!email || !password) return;

    if (authConfigured) {
      setAuthBusy(true);
      const result = await signInWithEmail({ email, password });
      setAuthBusy(false);

      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível entrar agora.");
        return;
      }

      const hydrated = await getCurrentAuthState();
      if (hydrated.session && hydrated.user) {
        applyHydratedAuthState(hydrated, email);
      } else {
        mutate((draft) => {
          draft.auth = {
            ...draft.auth,
            registered: true,
            email,
            password: "",
            signedIn: true,
          };
          draft.profile.name = result.profile?.name || draft.profile.name;
          draft.profile.email = result.profile?.email || email;
          draft.profile.city = result.profile?.city || draft.profile.city;
          draft.profile.birthday = result.profile?.birth_date || draft.profile.birthday;
        });
      }
      clearAuthNotice();
      navigateMosRoute("app", { replace: true });
      setAppRoute("app");
      setScreen("home");
      return;
    }

    showAuthNotice(getSupabaseSetupMessage(), {
      tone: "error",
      title: "Autenticação indisponível",
    });
    return;
  }

  async function handleRecoverSubmit(event) {
    event.preventDefault();
    if (!recoverEmail.trim()) return;

    const email = recoverEmail.trim().toLowerCase();
    if (authConfigured) {
      setAuthBusy(true);
      const result = await sendRecoverEmail(email);
      setAuthBusy(false);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível enviar o link agora.");
        return;
      }
      showAuthNotice(
        "Se existir uma conta com esse e-mail, enviaremos um link para redefinir a senha. Verifique sua caixa de entrada, spam e promoções.",
        {
          tone: "info",
          title: "Verifique seu e-mail",
        },
      );
    } else {
      showAuthNotice(getSupabaseSetupMessage(), {
        tone: "error",
        title: "Autenticação indisponível",
      });
    }

    setScreen("login");
    setLoginForm((current) => ({ ...current, email }));
    setRecoverEmail("");
  }

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();

    const password = resetPasswordForm.password;
    const confirmPassword = resetPasswordForm.confirmPassword;

    if (!password || !confirmPassword) return;
    if (password.length < 6) {
      showAuthNotice("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      showAuthNotice("As senhas precisam ser iguais para continuar.");
      return;
    }

    if (!authConfigured) {
      showAuthNotice(getSupabaseSetupMessage(), {
        tone: "error",
        title: "Autenticação indisponível",
      });
      return;
    }

    setAuthBusy(true);
    const result = await updatePassword(password);
    setAuthBusy(false);

    if (!result.ok) {
      showAuthNotice(result.error?.message || "Não foi possível redefinir a senha agora.");
      return;
    }

    recoveryFlowRef.current = false;
    setPasswordRecoveryReady(false);
    if (globalThis.history?.replaceState) {
      globalThis.history.replaceState(null, "", globalThis.location?.pathname || "/");
    }
    setResetPasswordForm({ password: "", confirmPassword: "" });
    setLoginForm((current) => ({ ...current, password: "" }));
    showAuthNotice("Sua senha foi atualizada com sucesso. Agora você já pode entrar com a nova senha.", {
      tone: "success",
      title: "Senha redefinida",
    });
    setScreen("login");
  }

  function openFoodDetailItem(food, back) {
    setSelectedFood({ ...food, back });
    setScreen("ingredient-detail");
  }

  async function registerMeal(formData) {
    const meal = {
      id: uid("meal"),
      name: formData.get("mealName"),
      title: formData.get("mealName"),
      description: formData.get("description"),
      time: "Agora",
      icon: "restaurant",
      cardClass: "bg-[#EF5F37] text-white",
      foods: [],
    };

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para registrar a refeição.");
        return;
      }
      const result = await createConsumedMealEntry(user.id, foodDate, meal);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível registrar a refeição agora.");
        return;
      }
      Object.assign(meal, result.meal);
    }

    mutate((draft) => {
      draft.consumedMeals[foodDate] = [...(draft.consumedMeals[foodDate] || (foodDate === todayKey ? consumedMeals : [])), meal];
    });
    clearDraft("modal-food");
    setScreen("food");
  }

  async function registerWater(formData) {
    const amount = Number(formData.get("amount")) || 0;
    if (amount <= 0) return;
    await appendWaterAmount(amount);
    clearDraft("modal-water");
    setModal(null);
  }

  async function saveMeasures(formData) {
    const entry = normalizeMeasureEntry({
      id: `measure-${formData.get("date") || getTodayKey()}`,
      date: formData.get("date") || getTodayKey(),
      weight: formData.get("weight"),
      height: formData.get("height"),
      bodyFat: formData.get("bodyFat"),
      muscleMass: formData.get("muscleMass"),
      bodyWater: formData.get("bodyWater"),
      metabolicAge: formData.get("metabolicAge"),
    });

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para salvar suas medidas.");
        return;
      }

      const result = await saveMeasureEntry(user.id, entry);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível salvar suas medidas agora.");
        return;
      }
    }

    mutate((draft) => {
      const entries = Array.isArray(draft.measureEntries) ? draft.measureEntries : [];
      const existingIndex = entries.findIndex((item) => item.date === entry.date);
      if (existingIndex >= 0) {
        entries[existingIndex] = { ...entries[existingIndex], ...entry };
      } else {
        entries.push(entry);
      }
      draft.measureEntries = entries.sort((a, b) => a.date.localeCompare(b.date));
    });
    clearDraft("modal-measures");
    setModal(null);
    setScreen("measures");
  }

  async function saveFeedback(formData) {
    const section = String(formData.get("section") || "Geral");
    const message = String(formData.get("message") || "").trim();
    if (!message) return;

    let nextFeedback = {
      id: uid("feedback"),
      section,
      message,
      createdAt: new Date().toISOString(),
    };

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      const result = await createFeedbackEntry(user?.id || null, { section, message });
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível enviar o feedback agora.");
        return;
      }
      nextFeedback = result.feedback;
    }

    mutate((draft) => {
      draft.feedbackEntries = [
        nextFeedback,
        ...(draft.feedbackEntries || []),
      ].slice(0, 10);
    });
    clearDraft("modal-feedback");
    setModal(null);
    setScreen("about-app");
    showAuthNotice("Feedback salvo. Seu app de e-mail vai abrir com a mensagem pronta; confirme o envio por lá.", {
      tone: "success",
      title: "Feedback registrado",
    });
    if (typeof window !== "undefined" && MOS_FEEDBACK_EMAIL) {
      const feedbackEmailUrl = buildFeedbackEmailUrl({
        section,
        message,
        profile: state.profile,
        auth: state.auth,
      });
      window.setTimeout(() => {
        window.location.href = feedbackEmailUrl;
      }, 120);
    }
  }

  async function sendAdminNotification(formData) {
    if (!isAdminUser) {
      showAuthNotice("Apenas o admin do MOS! pode enviar notificações.");
      return false;
    }

    const title = String(formData.get("title") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const type = String(formData.get("type") || "Aviso").trim() || "Aviso";
    const audience = String(formData.get("audience") || "all");
    const targetEmail = audience === "email" ? String(formData.get("targetEmail") || "").trim().toLowerCase() : "";

    if (!title || !message) {
      showAuthNotice("Preencha título e mensagem antes de enviar.");
      return false;
    }

    if (audience === "email" && !targetEmail) {
      showAuthNotice("Informe o e-mail do usuário que vai receber a mensagem.");
      return false;
    }

    let nextNotification = {
      id: uid("notification"),
      title,
      body: message,
      tag: type,
      createdAt: new Date().toISOString(),
      audience,
      targetEmail,
    };

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      const result = await createAppNotification(user?.id || null, {
        title,
        message,
        type,
        audience,
        targetEmail,
      });

      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível enviar a notificação. Verifique a tabela app_notifications no Supabase.");
        return false;
      }

      nextNotification = result.notification;
      const refreshed = await fetchAppNotifications(user?.id || null, state.profile.email || state.auth.email);
      mutate((draft) => {
        draft.appNotifications = refreshed.length ? refreshed : [nextNotification, ...(draft.appNotifications || [])].slice(0, 20);
      });
    } else {
      mutate((draft) => {
        draft.appNotifications = [nextNotification, ...(draft.appNotifications || [])].slice(0, 20);
      });
    }

    setNotificationsCleared(false);
    clearDraft("admin-notification");
    showAuthNotice("Notificação criada. Ela já aparece na central do MOS! para testes.");
    return true;
  }

  async function saveProfile(formData) {
    const nextProfile = {
      ...state.profile,
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      birthday: String(formData.get("birthday") || "").trim(),
      weight: Number(formData.get("weight")) || state.profile.weight,
      height: Number(formData.get("height")) || state.profile.height,
      age: Number(formData.get("age")) || state.profile.age,
      targetWeight: Number(formData.get("targetWeight")) || state.profile.targetWeight,
      calorieTarget: Number(formData.get("calorieTarget")) || state.profile.calorieTarget,
      waterTargetMl: Number(formData.get("waterTargetMl")) || state.profile.waterTargetMl,
    };

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para salvar seu perfil.");
        return;
      }

      const result = await saveProfileData(user.id, nextProfile);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível salvar seu perfil agora.");
        return;
      }
    }

    mutate((draft) => {
      draft.profile.name = nextProfile.name;
      draft.profile.email = nextProfile.email;
      draft.profile.city = nextProfile.city;
      draft.profile.birthday = nextProfile.birthday;
      draft.profile.weight = nextProfile.weight;
      draft.profile.height = nextProfile.height;
      draft.profile.age = nextProfile.age;
      draft.profile.targetWeight = nextProfile.targetWeight;
      draft.profile.calorieTarget = nextProfile.calorieTarget;
      draft.profile.waterTargetMl = nextProfile.waterTargetMl;
      draft.auth.email = nextProfile.email || draft.auth.email;
    });
    clearDraft("modal-profile");
    setModal(null);
    setScreen("profile");
  }

  async function appendWaterAmount(amount) {
    if (amount <= 0) return;
    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dateKey = waterHistoryDate;
    const nextEntry = { id: uid("water"), label: "Água registrada", time, amount };

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para registrar água.");
        return;
      }

      const result = await createWaterEntry(user.id, {
        date: dateKey,
        amount,
        time,
        label: "Água registrada",
      });

      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível registrar água agora.");
        return;
      }

      nextEntry.id = result.entry.id;
      nextEntry.time = result.entry.time;
    }

    mutate((draft) => {
      draft.water[dateKey] = (draft.water[dateKey] || 0) + amount;
      draft.waterHistory[dateKey] = [nextEntry, ...(draft.waterHistory[dateKey] || waterEntries)];
    });
  }

  async function createPlanMeal(formData) {
    const meal = normalizeMeal({
      id: uid("plan"),
      name: formData.get("mealName"),
      title: formData.get("mealName"),
      description: "",
      time: String(formData.get("time") || "12:30"),
      icon: "restaurant",
      foods: [],
      image: planImages.breakfast,
    });

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para criar a refeição do plano.");
        return;
      }
      const result = await createPlanMealEntry(user.id, meal, state.planMeals.length);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível criar a refeição do plano agora.");
        return;
      }
      Object.assign(meal, result.meal);
    }

    mutate((draft) => {
      draft.planMeals.push(meal);
    });
    clearDraft("modal-plan");
    setModal(null);
  }

  async function savePlanConfig(formData) {
    const planName = String(formData.get("planName") || "").trim();
    const planFocus = String(formData.get("planFocus") || "").trim();
    const planNotes = String(formData.get("planNotes") || "").trim();
    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (user) {
        const result = await saveProfileData(user.id, {
          ...state.profile,
          activeGoal: planName || state.profile.activeGoal,
          planFocus,
          planNotes,
        });
        if (!result?.ok) {
          showAuthNotice("Não foi possível salvar o plano agora.");
          return;
        }
      }
    }

    mutate((draft) => {
      draft.profile.activeGoal = planName || draft.profile.activeGoal;
      draft.profile.planFocus = planFocus;
      draft.profile.planNotes = planNotes;
    });
    clearDraft("plan-config");
    setScreen("plan");
  }

  async function createSupplement(formData) {
    const nextSupplement = {
      id: uid("supplement"),
      period: String(formData.get("time") || "").trim() || "Livre",
      category: String(formData.get("category") || "").trim() || "Geral",
      time: String(formData.get("time") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      dosage: String(formData.get("dosage") || "").trim(),
      instruction: String(formData.get("instruction") || "").trim(),
      card: "bg-old-flax text-custom-jet",
    };

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para registrar o suplemento.");
        return;
      }

      const result = await createSupplementEntry(user.id, nextSupplement);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível registrar o suplemento agora.");
        return;
      }
      Object.assign(nextSupplement, result.supplement);
    }

    mutate((draft) => {
      draft.supplements.push(nextSupplement);
    });
    clearDraft("register-supplement");
    setModal(null);
    setScreen("supplements");
  }

  async function saveSupplement(formData) {
    const supplementId = String(formData.get("id") || selectedSupplementId || "");
    const updatedSupplement = {
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      dosage: String(formData.get("dosage") || "").trim(),
      time: String(formData.get("time") || "").trim(),
      period: String(formData.get("time") || "").trim() || "Livre",
      instruction: String(formData.get("instruction") || "").trim(),
    };

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para editar o suplemento.");
        return;
      }

      const result = await updateSupplementEntry(user.id, supplementId, updatedSupplement);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível salvar o suplemento agora.");
        return;
      }
      Object.assign(updatedSupplement, result.supplement);
    }

    mutate((draft) => {
      draft.supplements = draft.supplements.map((item) =>
        item.id === supplementId
          ? {
              ...item,
              ...updatedSupplement,
            }
          : item,
      );
    });
    clearDraft("modal-edit-supplement");
    setModal(null);
  }

  async function saveFood(formData) {
    const food = normalizeFood({
      id: editor?.food?.id,
      name: formData.get("name"),
      quantity: formData.get("quantity"),
      calories: formData.get("calories"),
      protein: formData.get("protein"),
      carbs: formData.get("carbs"),
      fat: formData.get("fat"),
      benefit: formData.get("benefit"),
    });

    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para salvar o alimento.");
        return;
      }

      const result =
        editor.target === "plan"
          ? await savePlanFoodItem(user.id, editor.mealId, food)
          : await saveConsumedFoodItem(user.id, editor.mealId, food);

      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível salvar o alimento agora.");
        return;
      }

      Object.assign(food, result.food);
    }

    mutate((draft) => {
      const collection = editor.target === "plan" ? draft.planMeals : draft.consumedMeals[foodDate];
      const meal = collection.find((item) => item.id === editor.mealId);
      if (!meal) return;
      if (editor.food) meal.foods = meal.foods.map((item) => (item.id === editor.food.id ? food : item));
      else meal.foods.push(food);
    });
    clearDraft("editor-food");
    setEditor(null);
  }

  async function removeFood(target, mealId, foodId) {
    if (authConfigured) {
      const user = await getAuthenticatedUser();
      if (!user) {
        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para apagar o alimento.");
        return;
      }
      const result = target === "plan" ? await deletePlanFoodItem(user.id, foodId) : await deleteConsumedFoodItem(user.id, foodId);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível apagar o alimento agora.");
        return;
      }
    }

    mutate((draft) => {
      const collection = target === "plan" ? draft.planMeals : draft.consumedMeals[foodDate];
      const meal = collection.find((item) => item.id === mealId);
      if (meal) meal.foods = meal.foods.filter((item) => item.id !== foodId);
    });
  }

  function buildBlankTrainingPlan() {
    return normalizeTrainingPlan({
      id: uid("training-plan"),
      name: "Novo treino",
      estimatedMinutes: 45,
      exercises: [],
    }, 0, { allowEmptyExercises: true });
  }

  function openTrainingDetail(planId) {
    setSelectedTrainingId(planId);
    setScreen("training-detail");
  }

  function openTrainingEdit(planId) {
    const plan = trainingPlans.find((item) => item.id === planId);
    setSelectedTrainingId(planId);
    setTrainingDraft(normalizeTrainingPlan(plan || buildBlankTrainingPlan(), 0, { allowEmptyExercises: true }));
    setScreen("training-edit");
  }

  function openTrainingCreate() {
    const nextPlan = buildBlankTrainingPlan();
    setSelectedTrainingId(nextPlan.id);
    setTrainingDraft(nextPlan);
    setScreen("training-edit");
  }

  function startTraining(planId) {
    const plan = trainingPlans.find((item) => item.id === planId);
    if (!plan) return;
    const now = Date.now();
    setSelectedTrainingId(plan.id);
    setCompletedTraining(null);
    setActiveTraining({
      planId: plan.id,
      startedAt: now,
      pausedAt: null,
      pausedTotalMs: 0,
      currentExerciseIndex: 0,
      completedExerciseIds: [],
    });
    setScreen("training-execution");
  }

  function openTrainingPause() {
    setActiveTraining((current) => {
      if (!current || current.pausedAt) return current;
      return { ...current, pausedAt: Date.now() };
    });
    setModal("training-pause");
  }

  function resumeTraining() {
    setActiveTraining((current) => {
      if (!current?.pausedAt) return current;
      const now = Date.now();
      const pauseDuration = now - current.pausedAt;
      return {
        ...current,
        pausedAt: null,
        pausedTotalMs: current.pausedTotalMs + pauseDuration,
      };
    });
    setModal(null);
  }

  function completeTrainingSession(session = activeTraining) {
    const plan = trainingPlans.find((item) => item.id === session?.planId);
    if (!plan || !session) return;
    const finishedAt = Date.now();
    const totalDurationSeconds = Math.max(0, Math.round((finishedAt - session.startedAt - session.pausedTotalMs - (session.pausedAt ? finishedAt - session.pausedAt : 0)) / 1000));
    const summary = summarizeTrainingPlan(plan);
    const completedIds = new Set(session.completedExerciseIds || []);
    const completedExercisesList = plan.exercises.filter((exercise) => completedIds.has(exercise.id));
    const seriesCompleted = completedExercisesList.reduce((acc, exercise) => acc + (Number(exercise.sets) || 0), 0);
    const historyEntry = {
      id: uid("training-history"),
      date: todayKey,
      completedAt: new Date(finishedAt).toISOString(),
      planId: plan.id,
      planName: plan.name,
      durationSeconds: totalDurationSeconds,
      exercisesCompleted: completedExercisesList.length,
      seriesCompleted,
      volumeTotal: summary.volumeTotal,
      exercises: plan.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        focus: exercise.focus,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds,
        volume: (Number(exercise.suggestedLoadKg) || 0) * (Number(exercise.sets) || 0) * getAverageReps(exercise.reps),
        suggestedLoadKg: exercise.suggestedLoadKg,
        loadDelta: exercise.loadDelta,
      })),
    };

    mutate((draft) => {
      draft.trainingHistory = [historyEntry, ...(draft.trainingHistory || [])].slice(0, 20);
    });
    setCompletedTraining(historyEntry);
    setActiveTraining(null);
    setModal(null);
    setScreen("training-summary");
  }

  function abandonTraining() {
    setActiveTraining(null);
    setModal(null);
    setScreen("training-detail");
  }

  function markTrainingExerciseDone(exerciseId) {
    if (!activeTrainingPlan) return;
    setActiveTraining((current) => {
      if (!current) return current;
      const completedExerciseIds = Array.from(new Set([...(current.completedExerciseIds || []), exerciseId]));
      const nextIndex = activeTrainingPlan.exercises.findIndex(
        (exercise, index) => index > current.currentExerciseIndex && !completedExerciseIds.includes(exercise.id),
      );
      return {
        ...current,
        completedExerciseIds,
        currentExerciseIndex: nextIndex >= 0 ? nextIndex : current.currentExerciseIndex,
      };
    });
  }

  function undoTrainingExerciseDone(exerciseId) {
    if (!activeTrainingPlan) return;
    setActiveTraining((current) => {
      if (!current) return current;
      const completedExerciseIds = (current.completedExerciseIds || []).filter((id) => id !== exerciseId);
      const resetIndex = activeTrainingPlan.exercises.findIndex((exercise) => exercise.id === exerciseId);
      return {
        ...current,
        completedExerciseIds,
        currentExerciseIndex: resetIndex >= 0 ? resetIndex : current.currentExerciseIndex,
      };
    });
  }

  function requestTrainingFinish() {
    setModal("training-finish-confirm");
  }

  function updateTrainingDraftField(field, value) {
    setTrainingDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateTrainingExerciseField(exerciseId, field, value) {
    setTrainingDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? (() => {
              if (field === "name") {
                const nextName = String(value || "");
                const match = getTrainingExerciseMatch(nextName, trainingPlans, trainingHistory);
                return applyTrainingExerciseSuggestion(exercise, match, nextName);
              }

              if (field === "reps") {
                return normalizeTrainingExercise({ ...exercise, reps: sanitizeTrainingReps(value) || "" });
              }

              if (field === "sets") {
                return normalizeTrainingExercise({ ...exercise, sets: Math.min(12, Math.max(1, Number(value) || 1)) });
              }

              if (field === "restSeconds") {
                return normalizeTrainingExercise({ ...exercise, restSeconds: Math.min(600, Math.max(15, Number(value) || 15)) });
              }

              if (field === "suggestedLoadKg") {
                return normalizeTrainingExercise({ ...exercise, suggestedLoadKg: Math.min(500, Math.max(0, Number(value) || 0)) });
              }

              return normalizeTrainingExercise({ ...exercise, [field]: value });
            })()
            : exercise,
        ),
      };
    });
  }

  function updateTrainingExerciseFocus(exerciseId, rawValue) {
    const value = normalizeTrainingMuscleGroup(rawValue);
    updateTrainingExerciseField(exerciseId, "focus", value);
  }

  function handleTrainingExerciseFocusChange(exerciseId, event) {
    updateTrainingExerciseFocus(exerciseId, event?.target?.value || "");
  }

  function addTrainingExercise() {
    markDraftDirty("training-edit");
    setTrainingDraft((current) => {
      if (!current) return current;
      const nextExercise = normalizeTrainingExercise(
        {
          id: uid("training-exercise"),
          name: "Novo exercício",
          focus: "",
          sets: 3,
          reps: "10-12",
          targetReps: 12,
          restSeconds: 60,
          suggestedLoadKg: 0,
          loadDelta: "",
        },
        current.exercises.length,
      );
      setNewTrainingExerciseId(nextExercise.id);
      return {
        ...current,
        exercises: [
          nextExercise,
          ...current.exercises,
        ],
      };
    });
  }

  function removeTrainingExercise(exerciseId) {
    askDeleteConfirm({
      title: "Remover exercício?",
      message: "Tem certeza que deseja remover este exercício do treino? Essa ação não poderá ser desfeita.",
      confirmLabel: "Remover exercício",
      onConfirm: () => {
        markDraftDirty("training-edit");
        setTrainingDraft((current) => {
          if (!current) return current;
          return {
            ...current,
            exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId),
          };
        });
        setNewTrainingExerciseId((current) => (current === exerciseId ? null : current));
      },
    });
  }

  function removeAllTrainingExercises() {
    askDeleteConfirm({
      title: "Remover todos os exercícios?",
      message: "Tem certeza que deseja remover todos os exercícios deste treino? Essa ação não poderá ser desfeita.",
      confirmLabel: "Remover todos",
      onConfirm: () => {
        markDraftDirty("training-edit");
        setTrainingDraft((current) => (current ? { ...current, exercises: [] } : current));
        setNewTrainingExerciseId(null);
      },
    });
  }

  function duplicateTrainingExercise(exerciseId) {
    markDraftDirty("training-edit");
    setTrainingDraft((current) => {
      if (!current) return current;
      const exerciseIndex = current.exercises.findIndex((exercise) => exercise.id === exerciseId);
      if (exerciseIndex < 0) return current;
      const sourceExercise = current.exercises[exerciseIndex];
      const duplicatedExercise = normalizeTrainingExercise(
        {
          ...sourceExercise,
          id: uid("training-exercise"),
        },
        exerciseIndex + 1,
      );
      duplicatedExercise.loadDelta = sourceExercise.loadDelta || duplicatedExercise.loadDelta;
      setNewTrainingExerciseId(duplicatedExercise.id);
      const nextExercises = [...current.exercises];
      nextExercises.splice(exerciseIndex + 1, 0, duplicatedExercise);
      return {
        ...current,
        exercises: nextExercises,
      };
    });
  }

  function adjustTrainingExerciseSets(exerciseId, delta) {
    markDraftDirty("training-edit");
    setTrainingDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? normalizeTrainingExercise({
              ...exercise,
              sets: Math.min(12, Math.max(1, (Number(exercise.sets) || 1) + delta)),
            })
            : exercise,
        ),
      };
    });
  }

  function saveTrainingDraft(event) {
    event.preventDefault();
    if (!trainingDraft) return;
    const normalizedPlan = normalizeTrainingPlan({
      ...trainingDraft,
      exercises: trainingDraft.exercises.map((exercise) => normalizeTrainingExercise(exercise)),
    }, trainingPlans.length, { allowEmptyExercises: true });
    mutate((draft) => {
      const existingIndex = draft.trainingPlans.findIndex((item) => item.id === normalizedPlan.id);
      if (existingIndex >= 0) draft.trainingPlans[existingIndex] = normalizedPlan;
      else draft.trainingPlans.push(normalizedPlan);
    });
    clearDraft("training-edit");
    setSelectedTrainingId(normalizedPlan.id);
    setTrainingDraft(null);
    setScreen("training-detail");
  }

  useEffect(() => {
    if (!newTrainingExerciseId) return undefined;
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`training-exercise-${newTrainingExerciseId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
    const focusTimer = window.setTimeout(() => {
      document.getElementById(`training-exercise-name-${newTrainingExerciseId}`)?.focus();
    }, 260);
    const clearTimer = window.setTimeout(() => setNewTrainingExerciseId(null), 2200);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(focusTimer);
      window.clearTimeout(clearTimer);
    };
  }, [newTrainingExerciseId, trainingDraft]);

  function renderHome() {
    const currentMeals = state.consumedMeals[date] || [];
    const formattedConsumed = Math.round(summary.calories).toLocaleString("pt-BR");
    const formattedRemaining = Math.max(0, Math.round(remaining)).toLocaleString("pt-BR");
    const formattedTarget = Math.round(state.profile.calorieTarget).toLocaleString("pt-BR");
    const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
    const nowHour = new Date().getHours();
    const greeting = nowHour < 12 ? "Bom dia" : nowHour < 18 ? "Boa tarde" : "Boa noite";
    const trainingDoneToday = trainingHistory.some((entry) => entry.date === todayKey);
    const waterRemaining = Math.max(0, waterGoal - water);
    const executionSignals = calculateMosExecutionSignals({
      caloriesConsumed: summary.calories,
      calorieTarget: state.profile.calorieTarget,
      waterConsumedMl: water,
      waterTargetMl: waterGoal,
      trainingDone: trainingDoneToday,
    });
    const mosState = calculateMosState({
      caloriesConsumed: summary.calories,
      calorieTarget: state.profile.calorieTarget,
      waterConsumedMl: water,
      waterTargetMl: waterGoal,
      trainingDone: trainingDoneToday,
    });
    const insight = generateMosOperationalInsight(executionSignals);
    const profileInsight = generateMosShortRecommendation(mosState);
    const latestWeight = Number(latestMeasure?.weight) || Number(state.profile.weight) || 0;
    const targetWeight = Number(state.profile.targetWeight) || 0;
    const profileGoal = String(state.profile.activeGoal || "Plano em acompanhamento").replace(/^Plano atual:\s*/i, "");
    const profileStats = [
      {
        label: "Peso",
        value: latestWeight ? `${latestWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg` : "--",
      },
      {
        label: "Meta",
        value: targetWeight ? `${targetWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg` : `${formattedTarget} kcal`,
      },
      {
        label: "IMC",
        value: latestBmi ? latestBmi.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "--",
      },
    ];
    const nextAction = (() => {
      if (!currentMeals.length) {
        return {
          label: "Registrar comida",
          title: "Registrar primeira refeição",
          detail: "Abra comida e marque o que já foi consumido.",
          icon: "restaurant",
          action: () => setModal("food"),
        };
      }
      if (waterRemaining > 0 && executionSignals.waterPercent < 0.75) {
        return {
          label: "Registrar água",
          title: `Beber ${Math.ceil(waterRemaining / 50) * 50} ml`,
          detail: "Some água para aproximar sua meta do dia.",
          icon: "water_drop",
          action: () => setModal("water"),
        };
      }
      if (!trainingDoneToday) {
        return {
          label: "Ver treino",
          title: "Fazer treino de hoje",
          detail: "Abra o treino definido e registre a sessão.",
          icon: "fitness_center",
          action: () => setScreen("training"),
        };
      }
      if (!state.planMeals.length) {
        return {
          label: "Ajustar plano",
          title: "Configurar roteiro",
          detail: "Organize as refeições que já foram definidas.",
          icon: "description",
          action: () => setScreen("plan-config"),
        };
      }
      return {
        label: "Ver plano",
        title: "Seguir o roteiro",
        detail: "Abra o plano e veja a próxima refeição.",
        icon: "description",
        action: () => setScreen("plan"),
      };
    })();
    const signalIcons = {
      food: "restaurant",
      water: "water_drop",
      training: "fitness_center",
      plan: "description",
    };
    const daySignals = [
      {
        key: "food",
        label: "Comida",
        status:
          summary.calories <= 0 ? "Sem registro" : remaining <= 0 ? "Ajustar hoje" : "Dentro da meta",
        detail: `${formattedConsumed} de ${formattedTarget} kcal`,
      },
      {
        key: "water",
        label: "Água",
        status: waterRemaining > 0 ? `Faltam ${waterRemaining} ml` : "Meta batida",
        detail: `${Math.round(water)} de ${Math.round(waterGoal)} ml`,
      },
      {
        key: "training",
        label: "Treino",
        status: trainingDoneToday ? "Feito" : "Pendente",
        detail: trainingDoneToday ? "Treino registrado hoje" : "Nenhum treino hoje",
      },
      {
        key: "plan",
        label: "Plano",
        status: state.planMeals.length ? "Ativo" : "Sem plano",
        detail: state.planMeals.length ? `${state.planMeals.length} refeições no roteiro` : "Defina um roteiro do dia",
      },
    ];
    return html`
      <div className="min-h-screen pb-32 ${getSectionBackground()}">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("home")} onRight=${openNotifications} />
        <main className="home-main pt-24 px-6 max-w-md mx-auto space-y-5">
          <section className="home-greeting-line">
            <p>${greeting}, ${profileName}.</p>
          </section>

          <section className="home-signature">
            <div className="home-signature-orb home-signature-orb--warm"></div>
            <div className="home-signature-orb home-signature-orb--cool"></div>
            <div className="home-signature-content">
              <div className="space-y-3">
                <span className="home-panel-eyebrow">Painel do dia</span>
                <h1 className="home-hero-number">${formattedRemaining}</h1>
                <div>
                  <p className="home-hero-unit">kcal livres hoje</p>
                  <p className="home-hero-insight">${insight}</p>
                </div>
              </div>
              <button className="home-next-action" onClick=${nextAction.action}>
                <div className="home-next-action-icon">
                  <${Icon} name=${nextAction.icon} className="text-[1.35rem] text-[#0F172A]" filled=${nextAction.icon === "water_drop"} />
                </div>
                <div className="min-w-0">
                  <span className="home-panel-eyebrow">Agora</span>
                  <strong>${nextAction.title}</strong>
                  <p>${nextAction.detail}</p>
                </div>
                <${Icon} name="arrow_forward" className="text-[1.2rem] text-white/70" />
              </button>
            </div>
          </section>

          <section className="home-signal-strip">
            ${daySignals.map(
              (signal) => html`
                <button className="home-signal-pill" key=${signal.key} onClick=${() => setScreen(signal.key)}>
                  <span className="home-signal-pill-icon">
                    <${Icon} name=${signalIcons[signal.key]} className="text-[1.05rem]" filled=${signal.key === "water"} />
                  </span>
                  <div>
                    <span>${signal.label}</span>
                    <strong>${signal.status}</strong>
                    <small>${signal.detail}</small>
                  </div>
                </button>
              `
            )}
          </section>

          <section className="home-panel">
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="home-panel-eyebrow">Base do dia</span>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[1.9rem] font-black leading-tight text-[#0F172A]">${profileGoal}</div>
                    <p className="text-sm text-[#64748b]">parâmetros que guiam o MOS! hoje</p>
                  </div>
                  <div className="home-inline-insight">${profileInsight}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                ${profileStats.map(
                  (item) => html`
                    <div className="home-summary-stat" key=${item.label}>
                      <span className="home-summary-label">${item.label}</span>
                      <span className="home-summary-value">${item.value}</span>
                    </div>
                  `
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="home-quick-action" onClick=${() => setModal("food")}>
                  <${Icon} name="add_circle" className="text-[1.25rem] text-[#EF5F37]" filled=${true} />
                  <span>Registrar comida</span>
                </button>
                <button className="home-quick-action" onClick=${() => setModal("water")}>
                  <${Icon} name="water_drop" className="text-[1.25rem] text-[#4558C8]" filled=${true} />
                  <span>Registrar água</span>
                </button>
              </div>
            </div>
          </section>
        </main>
        <${BottomNav} active="home" onChange=${setScreen} />
      </div>
    `;
  }

  function renderLanding() {
    return html`
      <div className="min-h-screen bg-background text-on-surface">
        <main className="min-h-screen px-6 max-w-md mx-auto flex flex-col items-start justify-center gap-8">
          <div className="space-y-4">
            <${MosWordmark} className="mos-wordmark--landing" />
            <h1 className="text-[2.8rem] leading-[0.94] font-black text-[#0F172A]">Tudo que você precisa para seguir sua rotina, em um só lugar.</h1>
          </div>
          <button
            className="w-full h-14 rounded-[10px] bg-[#111] text-white font-bold text-base active:scale-95 transition-transform"
            onClick=${() => {
              navigateMosRoute("app");
              setAppRoute("app");
              setScreen(state.auth?.signedIn ? "home" : "welcome");
            }}
          >
            Acessar o MOS!
          </button>
        </main>
      </div>
    `;
  }

  function renderWelcome() {
    return html`
      <div className="mos-auth-screen min-h-screen" data-auth-screen="true">
        <main className="min-h-screen px-7 py-8 max-w-md mx-auto flex flex-col">
          <div className="pt-2">
            <${AuthWordmark} />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-5">
              <h1 className="leading-[0.92] mos-auth-title"><${MosWordmark} className="mos-wordmark--hero" /></h1>
              <p className="text-[1.35rem] leading-snug mos-auth-subtitle max-w-[16rem]">Seu app para organizar alimentação, plano, água e evolução diária.</p>
              <div className="w-24 h-1 bg-[#111] rounded-full"></div>
            </div>
          </div>

          <div className="space-y-4 pb-5">
            <div className="mos-auth-card rounded-[10px] p-4 text-sm text-[#111]">Bem-vinda ao MOS! Entre ou crie sua conta para começar sua rotina com mais clareza, consistência e controle do seu dia.</div>
            <button className="w-full h-16 bg-[#111] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform flex items-center justify-center gap-2" onClick=${() => openAuthScreen("signup")}>
              <span>Começar</span>
              <${Icon} name="arrow_forward" className="text-white" />
            </button>
            <button className="w-full h-16 bg-white border border-[#111]/20 text-[#111] rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => openAuthScreen("login")}>
              Entrar
            </button>
            <button className="text-sm text-[#111]/72 underline underline-offset-4" onClick=${() => openAuthScreen("legal")}>
              Termos e condições
            </button>
          </div>
        </main>
      </div>
    `;
  }

  function renderSignup() {
    const suggestedCalories = calculateSuggestedCalories({
      weight: signupForm.weight,
      height: signupForm.height,
      age: signupForm.age,
      goal: signupForm.goal,
    });
    const isReady =
      signupForm.name.trim() &&
      signupForm.email.trim() &&
      signupForm.password &&
      signupForm.confirmPassword &&
      signupForm.age &&
      signupForm.weight &&
      signupForm.height &&
      signupForm.acceptedTerms;

    return html`
      <div className="mos-auth-screen min-h-screen" data-auth-screen="true">
        <header className="border-b border-black/10">
          <div className="h-16 px-6 max-w-md mx-auto flex items-center justify-between">
            <${AuthWordmark} />
            <button onClick=${() => openAuthScreen("welcome")}><${Icon} name="menu" className="text-[#111]" /></button>
          </div>
        </header>

        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <section className="space-y-4">
            <h1 className="text-[3.1rem] leading-[0.92] font-black mos-auth-title">Criar conta</h1>
            <p className="text-[1.2rem] leading-snug mos-auth-subtitle">Junte-se à plataforma MOS! para acessar sua rotina de forma organizada e visual.</p>
          </section>

          ${renderAuthNoticeCard()}

          <form className="space-y-5" onSubmit=${handleSignupSubmit}>
            <div className="space-y-2">
              <label className="text-[0.8rem] font-bold text-[#111]">Nome completo</label>
              <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" value=${signupForm.name} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, name: value }));
              }} placeholder="Ex.: Nirlandy" />
            </div>
            <div className="space-y-2">
              <label className="text-[0.8rem] font-bold text-[#111]">E-mail</label>
              <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" type="email" value=${signupForm.email} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, email: value }));
              }} placeholder="voce@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Idade</label>
                <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" type="number" min="10" step="1" value=${signupForm.age} onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, age: value }));
                }} placeholder="Ex.: 29" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Altura (cm)</label>
                <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" type="number" min="100" step="1" value=${signupForm.height} onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, height: value }));
                }} placeholder="Ex.: 165" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Peso atual (kg)</label>
                <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" type="number" min="20" step="0.1" value=${signupForm.weight} onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, weight: value }));
                }} placeholder="Ex.: 80.5" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Objetivo</label>
                <select className="w-full h-14 px-4 rounded-[10px] mos-auth-input bg-white" value=${signupForm.goal} onChange=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, goal: value }));
                }}>
                  <option value="lose">Perder peso</option>
                  <option value="maintain">Manter peso</option>
                  <option value="gain">Ganhar massa</option>
                </select>
              </div>
            </div>
            <div className="mos-auth-card rounded-[10px] p-4 space-y-1">
              <p className="text-[0.78rem] font-bold mos-auth-subtitle">Meta calórica sugerida</p>
              <p className="text-[1.8rem] font-black mos-auth-title">${suggestedCalories ? `${suggestedCalories.toLocaleString("pt-BR")} kcal` : "Preencha seus dados"}</p>
              <p className="text-sm leading-snug mos-auth-subtitle">Você poderá editar essa meta depois em Meu perfil.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[0.8rem] font-bold text-[#111]">Senha</label>
                <button type="button" className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#8a8a8a]" onClick=${() => setShowSignupPassword((current) => !current)}>
                  <${Icon} name=${showSignupPassword ? "visibility_off" : "visibility"} className="text-[1rem]" />
                  <span>${showSignupPassword ? "Ocultar senha" : "Ver senha"}</span>
                </button>
              </div>
              <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" type=${showSignupPassword ? "text" : "password"} value=${signupForm.password} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, password: value }));
              }} placeholder="Crie uma senha" />
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                  <div
                    className=${`h-full transition-all ${passwordStrengthScore >= 4 ? "bg-emerald-500" : passwordStrengthScore >= 2 ? "bg-amber-400" : "bg-rose-400"}`}
                    style=${{ width: `${Math.max(8, passwordStrengthScore * 25)}%` }}
                  ></div>
                </div>
                <p className="text-[0.78rem] font-medium text-[#6e7178]">${passwordStrengthLabel}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[0.8rem] font-bold text-[#111]">Confirmar senha</label>
                <button type="button" className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#8a8a8a]" onClick=${() => setShowSignupConfirmPassword((current) => !current)}>
                  <${Icon} name=${showSignupConfirmPassword ? "visibility_off" : "visibility"} className="text-[1rem]" />
                  <span>${showSignupConfirmPassword ? "Ocultar senha" : "Ver senha"}</span>
                </button>
              </div>
              <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" type=${showSignupConfirmPassword ? "text" : "password"} value=${signupForm.confirmPassword} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, confirmPassword: value }));
              }} placeholder="Repita a senha" />
            </div>
            <label className="flex items-start gap-3 text-sm text-[#555]">
              <input type="checkbox" className="mt-1" checked=${signupForm.acceptedTerms} onChange=${(e) => {
                const checked = e.currentTarget.checked;
                setSignupForm((current) => ({ ...current, acceptedTerms: checked }));
              }} />
              <span>Eu aceito os Termos de Serviço e a Política de Privacidade.</span>
            </label>
            <button className=${`w-full h-14 rounded-[10px] font-bold text-base transition-transform ${isReady && !authBusy ? "bg-[#111] text-white active:scale-95" : "bg-[#111]/15 text-[#111]/45 cursor-not-allowed"}`} disabled=${!isReady || authBusy}>
              ${authBusy ? "Cadastrando..." : "Cadastrar"}
            </button>
            ${!isReady && !authBusy ? html`<p className="text-[0.82rem] text-[#6e7178]">${signupDisabledReason}</p>` : null}
          </form>

          <button className="w-full text-sm font-bold text-[#111] underline underline-offset-4" onClick=${() => openAuthScreen("login")}>
            Já tem conta? Entrar
          </button>

          <footer className="pt-8 border-t border-black/10 space-y-4">
            <h2 className="text-xl font-black text-[#111]">MOS! system</h2>
            <p className="text-sm leading-relaxed text-[#6e7178]">Organização editorial do seu dia com foco em alimentação, hidratação, medidas e consistência.</p>
          </footer>
        </main>
      </div>
    `;
  }

  function renderLogin() {
    const isReady = loginForm.email.trim() && loginForm.password;

    return html`
      <div className="mos-auth-screen min-h-screen" data-auth-screen="true">
        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <${AuthWordmark} />

          <section className="space-y-4 pt-2">
            <h1 className="text-[3.2rem] leading-[0.93] font-black mos-auth-title">Acesse sua conta</h1>
          </section>

          ${renderAuthNoticeCard()}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[0.8rem] font-bold text-[#111]">E-mail</label>
              <input className="w-full h-14 px-0 border-0 border-b border-[#111]/35 rounded-none text-[#111] bg-transparent" type="email" value=${loginForm.email} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setLoginForm((current) => ({ ...current, email: value }));
              }} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-[0.8rem] font-bold text-[#111]">Senha</label>
                <div className="flex items-center gap-4">
                  <button type="button" className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#8a8a8a]" onClick=${() => setShowLoginPassword((current) => !current)}>
                    <${Icon} name=${showLoginPassword ? "visibility_off" : "visibility"} className="text-[1rem]" />
                    <span>${showLoginPassword ? "Ocultar senha" : "Ver senha"}</span>
                  </button>
                  <button type="button" className="text-[0.8rem] font-bold text-[#8a8a8a]" onClick=${() => openAuthScreen("recover-password")}>Esqueceu a senha?</button>
                </div>
              </div>
              <input className="w-full h-14 px-0 border-0 border-b border-[#111]/35 rounded-none text-[#111] bg-transparent" type=${showLoginPassword ? "text" : "password"} value=${loginForm.password} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setLoginForm((current) => ({ ...current, password: value }));
              }} placeholder="••••••••" />
            </div>
            <button
              type="button"
              className=${`w-full h-14 rounded-[10px] font-bold text-base transition-transform ${isReady && !authBusy ? "bg-[#111] text-white active:scale-95" : "bg-[#111]/15 text-[#111]/45 cursor-not-allowed"}`}
              disabled=${!isReady || authBusy}
              onClick=${handleLoginSubmit}
            >
              ${authBusy ? "Entrando..." : "Entrar"}
            </button>
          </div>

          <div className="pt-8 border-t border-black/10 text-center">
            <button className="text-sm text-[#111] font-bold underline underline-offset-4" onClick=${() => openAuthScreen("signup")}>
              Não possui uma conta? Cadastre-se
            </button>
          </div>
        </main>
      </div>
    `;
  }

  function renderRecoverPassword() {
    const isReady = recoverEmail.trim();

    return html`
      <div className="mos-auth-screen min-h-screen" data-auth-screen="true">
        <header className="border-b border-black/10">
          <div className="h-16 px-6 max-w-md mx-auto flex items-center justify-between">
            <${AuthWordmark} />
            <button onClick=${() => openAuthScreen("login")}><${Icon} name="menu" className="text-[#111]" /></button>
          </div>
        </header>

        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <section className="space-y-4 pt-10">
            <h1 className="text-[3rem] leading-[0.94] font-black mos-auth-title">Recuperar senha</h1>
            <p className="text-[1.2rem] leading-snug mos-auth-subtitle">Digite seu e-mail para enviarmos o link de recuperação.</p>
          </section>

          ${renderAuthNoticeCard()}

          <form className="space-y-6" onSubmit=${handleRecoverSubmit}>
            <div className="space-y-2">
              <label className="text-[0.8rem] font-bold text-[#111]">E-mail</label>
              <input className="w-full h-14 px-4 rounded-[10px] mos-auth-input" type="email" value=${recoverEmail} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setRecoverEmail(value);
              }} placeholder="seu@email.com" />
            </div>
            <button className=${`w-full h-14 rounded-[10px] font-bold text-base transition-transform ${isReady && !authBusy ? "bg-[#111] text-white active:scale-95" : "bg-[#111]/15 text-[#111]/45 cursor-not-allowed"}`} disabled=${!isReady || authBusy}>
              ${authBusy ? "Enviando..." : "Enviar link"}
            </button>
          </form>

          <button className="text-sm font-bold text-[#111] flex items-center gap-2" onClick=${() => openAuthScreen("login")}>
            <${Icon} name="arrow_back" className="text-[1rem]" />
            <span>Voltar para o login</span>
          </button>
        </main>
      </div>
    `;
  }

  function renderResetPassword() {
    const isReady = resetPasswordForm.password && resetPasswordForm.confirmPassword;

    return html`
      <div className="mos-auth-screen min-h-screen" data-auth-screen="true">
        <header className="border-b border-black/10">
          <div className="h-16 px-6 max-w-md mx-auto flex items-center justify-between">
            <${AuthWordmark} />
            <button onClick=${() => {
              recoveryFlowRef.current = false;
              setPasswordRecoveryReady(false);
              openAuthScreen("login");
            }}>
              <${Icon} name="close" className="text-[#111]" />
            </button>
          </div>
        </header>

        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <section className="space-y-4 pt-10">
            <h1 className="text-[3rem] leading-[0.94] font-black mos-auth-title">Criar nova senha</h1>
            <p className="text-[1.2rem] leading-snug mos-auth-subtitle">
              Defina sua nova senha para voltar a entrar no MOS! com segurança.
            </p>
          </section>

          ${renderAuthNoticeCard()}

          <form className="space-y-6" onSubmit=${handleResetPasswordSubmit}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-[0.8rem] font-bold text-[#111]">Nova senha</label>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#8a8a8a]"
                  onClick=${() => setShowResetPassword((current) => !current)}
                >
                  <${Icon}
                    name=${showResetPassword ? "visibility_off" : "visibility"}
                    className="text-[1rem]"
                  />
                  <span>${showResetPassword ? "Ocultar senha" : "Ver senha"}</span>
                </button>
              </div>
              <input
                className="w-full h-14 px-4 rounded-[10px] mos-auth-input"
                type=${showResetPassword ? "text" : "password"}
                value=${resetPasswordForm.password}
                onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setResetPasswordForm((current) => ({ ...current, password: value }));
                }}
                placeholder="Mínimo de 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-[0.8rem] font-bold text-[#111]">Confirmar nova senha</label>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#8a8a8a]"
                  onClick=${() => setShowResetPasswordConfirm((current) => !current)}
                >
                  <${Icon}
                    name=${showResetPasswordConfirm ? "visibility_off" : "visibility"}
                    className="text-[1rem]"
                  />
                  <span>${showResetPasswordConfirm ? "Ocultar senha" : "Ver senha"}</span>
                </button>
              </div>
              <input
                className="w-full h-14 px-4 rounded-[10px] mos-auth-input"
                type=${showResetPasswordConfirm ? "text" : "password"}
                value=${resetPasswordForm.confirmPassword}
                onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setResetPasswordForm((current) => ({ ...current, confirmPassword: value }));
                }}
                placeholder="Repita sua nova senha"
              />
            </div>

            <button
              className=${`w-full h-14 rounded-[10px] font-bold text-base transition-transform ${
                isReady && !authBusy
                  ? "bg-[#111] text-white active:scale-95"
                  : "bg-[#111]/15 text-[#111]/45 cursor-not-allowed"
              }`}
              disabled=${!isReady || authBusy}
            >
              ${authBusy ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>

          <button
            className="text-sm font-bold text-[#111] flex items-center gap-2"
            onClick=${() => openAuthScreen("login")}
          >
            <${Icon} name="arrow_back" className="text-[1rem]" />
            <span>Voltar para o login</span>
          </button>
        </main>
      </div>
    `;
  }

  function renderLegal() {
    return html`
      <div className="mos-auth-screen min-h-screen">
        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <${AuthWordmark} />
            <button onClick=${() => openAuthScreen("welcome")}><${Icon} name="close" className="text-[#111]" /></button>
          </div>
          <section className="space-y-4 pt-4">
            <h1 className="text-[2.6rem] leading-[0.94] font-black mos-auth-title">Termos e condições</h1>
            <p className="text-[1.05rem] leading-relaxed mos-auth-subtitle">O MOS! funciona como um organizador pessoal de alimentação, água, plano e medidas. Os dados ficam salvos localmente neste dispositivo.</p>
            <p className="text-[1.05rem] leading-relaxed mos-auth-subtitle">Você pode editar suas informações quando quiser. Ao sair da conta, seus dados continuam guardados localmente até que você escolha apagar manualmente.</p>
            <p className="text-[1.05rem] leading-relaxed mos-auth-subtitle">Seus dados ficam vinculados à sua conta e podem ser acessados com segurança sempre que você entrar no MOS!</p>
          </section>
          <button className="w-full h-14 bg-[#111] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => openAuthScreen("welcome")}>
            Voltar
          </button>
        </main>
      </div>
    `;
  }

  function renderFood() {
    const nowHour = new Date().getHours();
    const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
    const consumedCalories = Math.round(summary.calories);
    const calorieTarget = Math.round(state.profile.calorieTarget);
    const remainingCalories = Math.max(0, Math.round(remaining));
    const rawRemainingCalories = Math.round(remaining);
    const percentRemaining = calorieTarget > 0 ? rawRemainingCalories / calorieTarget : 0;
    const foodHeadline =
      rawRemainingCalories <= 0
        ? "Atenção ao excesso"
        : percentRemaining > 0.3
          ? "Ainda há margem hoje"
          : percentRemaining >= 0.1
            ? "Meta próxima"
            : "Meta quase atingida";
    const nextMealRecommendation =
      rawRemainingCalories <= 0
        ? "Evite consumir mais calorias hoje"
        : percentRemaining > 0.3
          ? "Você pode reforçar a próxima refeição"
          : percentRemaining >= 0.1
            ? "Mantenha refeições equilibradas"
            : "Prefira algo leve na próxima refeição";
    return html`
      <div className="${getSectionBackground()} text-on-surface min-h-screen pb-40">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("food")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-8">
          <section className="space-y-3">
            <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
            <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)", lineHeight: "1.08" }}>
              ${foodHeadline}
            </h1>
            <p className="text-[0.95rem] text-[#334155]">Veja rápido o que já entrou, o que falta e onde ajustar hoje. <span className="emoji-badge emoji-badge--food" aria-hidden="true">🍽️</span></p>
          </section>
          <section className="food-summary-card rounded-[28px] p-6 space-y-5">
            <div className="space-y-2">
              <span className="text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-[#475569]">Resumo do dia</span>
              <p className="text-[0.95rem] text-[#334155]">Uma leitura simples para seguir o dia com clareza.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="food-summary-metric">
                <span className="food-summary-label">Comidas</span>
                <strong className="food-summary-value">${consumedCalories.toLocaleString("pt-BR")}</strong>
                <span className="food-summary-unit">kcal</span>
              </div>
              <div className="food-summary-metric">
                <span className="food-summary-label">Meta</span>
                <strong className="food-summary-value">${calorieTarget.toLocaleString("pt-BR")}</strong>
                <span className="food-summary-unit">kcal</span>
              </div>
              <div className="food-summary-metric">
                <span className="food-summary-label">Restante</span>
                <strong className="food-summary-value">${remainingCalories.toLocaleString("pt-BR")}</strong>
                <span className="food-summary-unit">kcal</span>
              </div>
            </div>
            <p className="text-[0.92rem] text-[#334155] leading-[1.45]">${nextMealRecommendation}</p>
          </section>
          <section className="w-full">
            <button className="w-full food-hero-card food-calendar-card rounded-2xl p-6 flex justify-between items-center active:scale-98 transition-transform text-left" onClick=${openFoodCalendar}>
              <div className="space-y-1">
                <span className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#475569]">Calendário</span>
                <h2 className="font-headline text-[1.8rem] font-bold text-[#0F172A]">${foodDateLabel}</h2>
                <p className="text-[0.9rem] text-[#334155]">Abra outra data ou volte para hoje quando quiser comparar.</p>
              </div>
              <div className="food-calendar-badge">
                <${Icon} name="calendar_today" className="text-[#0F172A]" />
              </div>
            </button>
            ${foodDate !== todayKey
              ? html`
                  <div className="flex justify-end pt-3">
                    <button
                      className="min-h-9 px-3 rounded-[10px] bg-[#EF5F37] text-white text-[0.85rem] font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                      onClick=${goToTodayFood}
                    >
                      <${Icon} name="today" className="text-[1rem] text-white" />
                      <span>Ver hoje</span>
                    </button>
                  </div>
                `
              : null}
          </section>
          <section className="grid grid-cols-1 gap-5">
            ${foodMeals.length
              ? foodMeals.map(
              (meal) => {
                const mealTotal = summarizeFoods(meal.foods);
                const mealCalories = Math.round(mealTotal.calories);
                const hasMealCalories = mealCalories > 0;
                const mealDescription = Array.isArray(meal.foods) && meal.foods.length
                  ? meal.foods
                      .map((food) => `${food.name}${food.quantity ? ` (${food.quantity})` : ""}`)
                      .join(", ")
                  : meal.description || "Sem registro";
                const mealCalorieLabel =
                  mealCalories <= 300
                    ? "Baixo"
                    : mealCalories <= 600
                      ? "OK"
                      : "Alto";
                return html`
                  <button className="mos-card food-meal-card rounded-[26px] p-7 min-h-[176px] active:scale-98 transition-transform cursor-pointer text-left flex flex-col justify-between gap-8" onClick=${() => { setSelectedConsumedId(meal.id); setScreen("food-detail"); }}>
                    <div className="food-meal-top">
                      <div className="food-meal-icon">
                        <${Icon} name=${meal.icon || "restaurant"} className="text-[#0F172A] text-[1.55rem]" />
                      </div>
                      <${Icon} name="arrow_forward" className="food-meal-arrow" />
                    </div>
                    <div className="food-meal-copy">
                      <h3 className="font-headline text-[1.82rem] font-[320] leading-none text-[#0F172A]">${meal.name}</h3>
                      <p className="food-meal-description">${mealDescription}</p>
                    </div>
                    <div className="food-meal-footer">
                      ${hasMealCalories
                        ? html`
                            <div className="food-meal-calories">
                              <span className="food-meal-calories-value">${mealCalories}</span>
                              <span className="food-meal-calories-unit">kcal</span>
                            </div>
                            <span className="food-meal-chip">${mealCalorieLabel}</span>
                          `
                        : html`
                            <span className="food-meal-empty">Sem registro</span>
                          `}
                    </div>
                  </button>
                `;
              },
            )
              : html`
                  <div className="mos-card rounded-[26px] p-6 text-center space-y-3">
                    <p className="font-bold text-[#0F172A]">Nenhuma refeição registrada</p>
                    <p className="text-[0.96rem] text-[#334155]">Escolha outra data ou registre uma refeição para este dia.</p>
                  </div>
                `}
          </section>
          <div className="fixed left-0 w-full px-4 z-40 pointer-events-none mos-fixed-cta">
            <button className="mos-fixed-cta-button font-headline shadow-[0_18px_34px_rgba(239,95,55,0.24)]" onClick=${() => setModal("food")}>
              <${Icon} name="add_circle" />
              Registrar comida
            </button>
          </div>
        </main>
        <${BottomNav} active="food" onChange=${setScreen} />
      </div>
    `;
  }

  function renderFoodDetail() {
    if (!selectedConsumed) return renderFood();
    const totals = summarizeFoods(selectedConsumed.foods);
    return html`
      <div className="${getSectionBackground("food")} text-on-surface min-h-screen pb-32">
        <${TopBar}
          title=${selectedConsumed.name}
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("food")}
          rightSlot=${html`<div className="flex items-center gap-4">
            <button className="hover:opacity-80 transition-opacity active:scale-95" onClick=${() => setEditor({ target: "food", mealId: selectedConsumed.id, food: null })}>
              <${Icon} name="edit" className="text-[#292B2D]" />
            </button>
            <button className="hover:opacity-80 transition-opacity active:scale-95" onClick=${() => askDeleteConfirm({
              title: "Apagar refeição",
              message: "Tem certeza que deseja apagar este item?",
              onConfirm: async () => {
                if (authConfigured) {
                  const user = await getAuthenticatedUser();
                  if (!user) {
                    showAuthNotice("Sua sessão não foi encontrada. Entre novamente para apagar a refeição.");
                    return;
                  }
                  const result = await deleteConsumedMealEntry(user.id, selectedConsumed.id);
                  if (!result.ok) {
                    showAuthNotice(result.error?.message || "Não foi possível apagar a refeição agora.");
                    return;
                  }
                }
                mutate((draft) => {
                  draft.consumedMeals[foodDate] = (draft.consumedMeals[foodDate] || (foodDate === todayKey ? consumedMeals : [])).filter((meal) => meal.id !== selectedConsumed.id);
                });
                setScreen("food");
              },
            })}>
              <${Icon} name="delete" className="text-[#292B2D]" />
            </button>
          </div>`}
        />
        <main className="pt-24 pb-32 px-4 max-w-md mx-auto space-y-8">
          <section className="space-y-2">
            <h1 className="text-[2rem] font-bold text-jet-black">${selectedConsumed.name}</h1>
          </section>
          <section className="mos-card rounded-2xl px-4 divide-y divide-surface-container-high">
            ${selectedConsumed.foods.map(
              (food) => {
                const accent = getFoodAccent(food.name);
                return html`
                  <div className="py-5 flex items-center justify-between gap-4">
                    <button className="flex items-start gap-3 min-w-0 text-left flex-1 active:scale-[0.99] transition-transform" onClick=${() => openFoodDetailItem(food, "food-detail")}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style=${{ backgroundColor: accent.soft }}>
                        <${Icon} name=${accent.icon} className="text-jet-black text-[1.35rem]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[1rem] leading-relaxed text-jet-black">
                          <strong className="font-bold">${food.name}</strong>
                        </p>
                        <p className="text-[0.9rem] text-on-surface-variant mt-1">${food.quantity}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      <button className="text-[#4558C8] font-bold text-[0.9rem] active:scale-95 transition-transform" onClick=${() => setEditor({ target: "food", mealId: selectedConsumed.id, food })}>
                        Editar
                      </button>
                      <button
                        className="text-error font-bold text-[0.9rem] active:scale-95 transition-transform"
                        onClick=${() => askDeleteConfirm({
                          title: "Apagar alimento",
                          message: "Tem certeza que deseja apagar este item?",
                          onConfirm: () => removeFood("food", selectedConsumed.id, food.id),
                        })}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                `;
              },
            )}
          </section>
          <section className="space-y-3">
            <h3 className="text-[0.875rem] font-bold text-[#292B2D]">Informação nutricional</h3>
            <div className="mos-card rounded-2xl px-4 divide-y divide-surface-container-high">
              ${selectedConsumed.foods.map(
                (food) => {
                  const accent = getFoodAccent(food.name);
                  return html`
                    <div className="py-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style=${{ backgroundColor: accent.dot }}></span>
                        <h4 className="text-[1.15rem] font-bold text-jet-black">${food.name} <span className="font-medium text-[#292B2D]/75">(${food.quantity})</span></h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[10px] p-3" style=${{ backgroundColor: accent.soft }}>
                          <span className="text-[0.75rem] font-bold text-[#292B2D]/70 block mb-1">Calorias</span>
                          <p className="text-[1rem] font-bold text-jet-black">${food.calories} kcal</p>
                        </div>
                        <div className="rounded-[10px] p-3 bg-surface-container-low">
                          <span className="text-[0.75rem] font-bold text-[#292B2D]/70 block mb-1">Carbo</span>
                          <p className="text-[1rem] font-bold text-jet-black">${food.carbs} g</p>
                        </div>
                        <div className="rounded-[10px] p-3 bg-surface-container-low">
                          <span className="text-[0.75rem] font-bold text-[#292B2D]/70 block mb-1">Proteína</span>
                          <p className="text-[1rem] font-bold text-jet-black">${food.protein} g</p>
                        </div>
                        <div className="rounded-[10px] p-3 bg-surface-container-low">
                          <span className="text-[0.75rem] font-bold text-[#292B2D]/70 block mb-1">Gordura</span>
                          <p className="text-[1rem] font-bold text-jet-black">${food.fat} g</p>
                        </div>
                      </div>
                    </div>
                  `;
                },
              )}
            </div>
          </section>
          <section className="bg-[#292B2D] text-white p-6 rounded-xl space-y-6">
            <h3 className="font-bold text-lg">Distribuição de Macros</h3>
            <${MacroBarDark} proteinWidth=${`${Math.min(100, totals.protein)}%`} carbWidth=${`${Math.min(100, totals.carbs)}%`} fatWidth=${`${Math.min(100, totals.fat * 2)}%`} />
          </section>
          <section className="flex flex-col gap-3">
            <button className="w-full bg-[#292B2D] text-white font-bold py-4 rounded-lg active:scale-95 transition-all text-sm" onClick=${() => setEditor({ target: "food", mealId: selectedConsumed.id, food: null })}>
              Adicionar alimento
            </button>
          </section>
        </main>
        <${BottomNav} active="food" onChange=${setScreen} />
      </div>
    `;
  }

  function renderPlanModeTabs({ activeMode }) {
    const isPlan = activeMode === "plan";
    return html`
      <div className="plan-mode-tabs" role="tablist" aria-label="Navegação do plano">
        <button
          className=${`plan-subnav-tab ${isPlan ? "plan-subnav-tab--active" : ""}`}
          type="button"
          role="tab"
          aria-selected=${isPlan}
          onClick=${() => !isPlan && setScreen("plan")}
        >
          Plano alimentar
        </button>
        <button
          className=${`plan-subnav-tab ${!isPlan ? "plan-subnav-tab--active" : ""}`}
          type="button"
          role="tab"
          aria-selected=${!isPlan}
          onClick=${() => isPlan && setScreen("supplements")}
        >
          Suplementação
        </button>
      </div>
    `;
  }

  function renderPlanModeHeader({ activeMode, headline, support, nowHour, profileName }) {
    return html`
      <section className="plan-mode-header">
        <${renderPlanModeTabs} activeMode=${activeMode} />
        <div className="plan-mode-copy">
          <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
          <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)", lineHeight: "1.08" }}>
            ${headline}
          </h1>
          ${support ? html`<p className="text-[0.95rem] text-[#334155]">${support}</p>` : null}
        </div>
      </section>
    `;
  }

  function renderPlan() {
    const nowHour = new Date().getHours();
    const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
    const planBrainState = calculateMosState({
      caloriesConsumed: summary.calories,
      calorieTarget: state.profile.calorieTarget,
      waterConsumedMl: water,
      waterTargetMl: waterGoal,
      trainingDone: trainingHistory.some((entry) => entry.date === todayKey),
    });
    const planHeadline = "Seu plano, organizado pra você";
    const currentPlanMeal = getCurrentPlanMeal(sortedPlanMeals);
    const activePlanMeal = sortedPlanMeals.find((meal) => meal.id === selectedPlanId) || currentPlanMeal || sortedPlanMeals[0] || null;
    const activePlanMealFoods = activePlanMeal?.foods || [];
    const activePlanMealTotals = summarizeFoods(activePlanMealFoods);
    const scrollPlanTimeline = (direction = 1) => {
      planTimelineRef.current?.scrollBy({
        left: direction * 220,
        behavior: "smooth",
      });
    };
    return html`
      <div className="${getSectionBackground()} text-on-surface min-h-screen pb-32">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("plan")} onRight=${openNotifications} />
        <main className="pt-24 pb-64 px-6 max-w-md mx-auto space-y-8">
          <${renderPlanModeHeader}
            activeMode="plan"
            headline=${planHeadline}
            nowHour=${nowHour}
            profileName=${profileName}
          />
          <section className="space-y-5">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#0F172A]">Roteiro do dia</h2>
            </div>
            <div className="plan-timeline-shell">
              <div className="plan-timeline-head">
                <div className="plan-timeline-nav">
                  <button className="plan-timeline-arrow" type="button" onClick=${() => scrollPlanTimeline(-1)} aria-label="Ver refeição anterior">
                    <${Icon} name="arrow_back" />
                  </button>
                  <button className="plan-timeline-arrow" type="button" onClick=${() => scrollPlanTimeline(1)} aria-label="Ver próxima refeição">
                    <${Icon} name="arrow_forward" />
                  </button>
                </div>
              </div>
              <div className="plan-timeline-scroller" ref=${planTimelineRef}>
                <div className="plan-timeline-track">
                ${sortedPlanMeals.map((meal, index) => html`
                    <button
                      id=${`plan-timeline-item-${meal.id}`}
                      className=${`plan-time-pill ${activePlanMeal?.id === meal.id ? "plan-time-pill--active" : ""} ${currentPlanMeal?.id === meal.id ? "plan-time-pill--now" : ""}`}
                      onClick=${() => setSelectedPlanId(meal.id)}
                    >
                      <div className="plan-time-pill-top">
                        <span className="plan-time-pill-step">${String(index + 1).padStart(2, "0")}</span>
                        <span className=${`plan-time-pill-state ${activePlanMeal?.id === meal.id ? "plan-time-pill-state--active" : currentPlanMeal?.id === meal.id ? "plan-time-pill-state--now" : ""}`}>
                          ${activePlanMeal?.id === meal.id ? "Ativa" : currentPlanMeal?.id === meal.id ? "Agora" : "Plano"}
                        </span>
                      </div>
                      <span className="plan-time-pill-label">${meal.name}</span>
                      <span className="plan-time-pill-time">${formatMealTimeLabel(meal.time) || "Sem horário"}</span>
                    </button>
                `)}
                </div>
              </div>
              </div>
          </section>
          ${activePlanMeal
            ? html`
                <section className="plan-active-shell space-y-5">
                  <div className="plan-active-header">
                    <div className="space-y-1.5">
                      <span className="plan-meal-eyebrow">Refeição ativa</span>
                      <div className="flex items-center gap-3">
                        <h2 className="text-[2rem] font-bold leading-none text-[#0F172A]">${activePlanMeal.name}</h2>
                        <span className="plan-active-time">${formatMealTimeLabel(activePlanMeal.time)}</span>
                      </div>
                    </div>
                  </div>

                  <section className="space-y-3">
                    <div className="mos-card plan-active-foods rounded-[24px] px-4 divide-y divide-[rgba(148,163,184,0.1)]">
                      ${activePlanMealFoods.map((food) => {
                        const accent = getFoodAccent(food.name);
                        return html`
                          <div className="py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="plan-detail-food-icon w-10 h-10 rounded-full flex items-center justify-center shrink-0" style=${{ backgroundColor: accent.soft }}>
                                <${Icon} name=${accent.icon} className="text-jet-black text-[1.35rem]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[1rem] leading-relaxed text-jet-black">
                                  <strong className="font-bold">${food.name}</strong>
                                </p>
                                <p className="text-[0.9rem] text-on-surface-variant mt-1">${food.quantity}</p>
                              </div>
                            </div>
                            <button className="plan-swap-button shrink-0 min-h-9 px-3.5 rounded-[10px] text-[0.78rem] font-bold active:scale-95 transition-transform flex items-center gap-2" onClick=${() => setSubstituteFood(food)}>
                              <${Icon} name="swap_horiz" className="text-[1.05rem] text-[#EF5F37]" />
                              <span>Trocar</span>
                            </button>
                          </div>
                        `;
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[0.875rem] font-bold text-[#292B2D]">Resumo nutricional</h3>
                    <div className="plan-inline-totals">
                      <div className="plan-inline-total">
                        <span className="plan-total-label">Calorias</span>
                        <strong className="plan-total-value">${Math.round(activePlanMealTotals.calories)}</strong>
                        <span className="plan-total-unit">kcal</span>
                      </div>
                      <div className="plan-inline-total">
                        <span className="plan-total-label">Proteína</span>
                        <strong className="plan-total-value">${Math.round(activePlanMealTotals.protein)}</strong>
                        <span className="plan-total-unit">g</span>
                      </div>
                      <div className="plan-inline-total">
                        <span className="plan-total-label">Carbos</span>
                        <strong className="plan-total-value">${Math.round(activePlanMealTotals.carbs)}</strong>
                        <span className="plan-total-unit">g</span>
                      </div>
                      <div className="plan-inline-total">
                        <span className="plan-total-label">Gordura</span>
                        <strong className="plan-total-value">${Math.round(activePlanMealTotals.fat)}</strong>
                        <span className="plan-total-unit">g</span>
                      </div>
                    </div>
                  </section>

                  <section className="mos-card plan-macro-card rounded-2xl p-5 space-y-5">
                    <h3 className="font-bold text-lg text-jet-black">Distribuição de Macros</h3>
                    <div className="space-y-3.5">
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[0.6875rem] font-bold text-[#475569]">Carbo</span>
                          <span className="text-sm font-bold text-jet-black">${Math.round(activePlanMealTotals.carbs)}g</span>
                        </div>
                        <div className="h-3 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4558C8]" style=${{ width: `${Math.min(100, activePlanMealTotals.carbs)}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[0.6875rem] font-bold text-[#475569]">Proteínas</span>
                          <span className="text-sm font-bold text-jet-black">${Math.round(activePlanMealTotals.protein)}g</span>
                        </div>
                        <div className="h-3 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#EF5F37]" style=${{ width: `${Math.min(100, activePlanMealTotals.protein)}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[0.6875rem] font-bold text-[#475569]">Gorduras</span>
                          <span className="text-sm font-bold text-jet-black">${Math.round(activePlanMealTotals.fat)}g</span>
                        </div>
                        <div className="h-3 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#D9B8F3]" style=${{ width: `${Math.min(100, activePlanMealTotals.fat * 2)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mos-card plan-guidance-card rounded-[22px] p-5 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#DFF37D] flex items-center justify-center">
                        <${Icon} name="lightbulb" className="text-jet-black" />
                      </div>
                      <h3 className="text-[0.875rem] font-bold text-[#292B2D]">Ajuste com segurança</h3>
                    </div>
                    <p className="text-[0.96rem] leading-relaxed text-on-surface-variant">${planBrainState.calorie === "ACIMA_CALORIA" ? "Troque sem pesar e mantenha a base da refeição." : "Troque quando precisar, sem perder a base do plano."}</p>
                  </section>
                </section>
              `
            : null}
          <button className="w-full py-5 bg-[#EF5F37] text-white rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_18px_34px_rgba(239,95,55,0.24)]" onClick=${() => setScreen("plan-config")}>
            <${Icon} name="settings" />
            Configurar plano
          </button>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  function renderPlanConfig() {
    const planFocus = state.profile.planFocus || "";
    const planNotes = state.profile.planNotes || "";
    const planMealCount = state.planMeals.length;
    const averageCalories = planMealCount ? Math.round(planTotals.calories / planMealCount) : 0;
    const hasPlanConfigured = Boolean(state.profile.activeGoal?.trim()) || planMealCount > 0;
    const planConfigDirty = isDraftDirty("plan-config");
    const guardPlanConfigNavigation = (action) =>
      confirmDiscard(action, "Deseja sair da página? As alterações do plano ainda não foram salvas.");
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-36">
        <${TopBar}
          title="Configurar plano"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => guardPlanConfigNavigation(() => setScreen("plan"))}
          onSearch=${() => openSearch("plan")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="mos-card rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-sm text-[#475569]">Painel do plano</span>
                <h1 className="text-[1.8rem] font-bold leading-tight">${hasPlanConfigured ? state.profile.activeGoal : "Nenhum plano configurado"}</h1>
                <p className="text-sm leading-relaxed text-[#475569]">${hasPlanConfigured ? planFocus : "Crie seu primeiro plano para começar a organizar suas refeições."}</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-white/80 flex items-center justify-center shrink-0">
                <${Icon} name="dashboard" className="text-[#0F172A] text-[1.65rem]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/70 rounded-[10px] p-4 space-y-2">
                <span className="text-[0.75rem] text-[#64748b]">Refeições</span>
                <strong className="text-[1.5rem] font-bold block">${planMealCount}</strong>
              </div>
              <div className="bg-white/70 rounded-[10px] p-4 space-y-2">
                <span className="text-[0.75rem] text-[#64748b]">Calorias</span>
                <strong className="text-[1.5rem] font-bold block">${Math.round(planTotals.calories)}</strong>
              </div>
              <div className="bg-white/70 rounded-[10px] p-4 space-y-2">
                <span className="text-[0.75rem] text-[#64748b]">Média</span>
                <strong className="text-[1.5rem] font-bold block">${averageCalories}</strong>
              </div>
            </div>
          </section>

          <section className="mos-card rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm text-[#4558C8]">Estrutura atual</span>
                <h2 className="text-lg font-bold text-jet-black">Resumo do plano</h2>
                <p className="text-sm text-on-surface-variant">Gerencie as refeições cadastradas como em um painel de controle.</p>
              </div>
              <div className="w-11 h-11 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0">
                <${Icon} name="receipt_long" className="text-[#4558C8]" />
              </div>
            </div>
            <div className="space-y-4">
              ${state.planMeals.length
                ? state.planMeals.map(
                    (meal) => html`
                      <div className="rounded-[10px] bg-white/90 border border-slate-200/70 px-5 py-4">
                        <div className="min-w-0">
                          <span className="text-[1rem] font-medium text-jet-black block">${meal.name}</span>
                          <span className="text-[0.85rem] text-on-surface-variant">${meal.foods.length} item(ns) no plano</span>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            className="h-10 px-4 rounded-[10px] bg-[#eef2ff] text-[#3b4cca] font-bold active:scale-95 transition-transform"
                            onClick=${() =>
                              guardPlanConfigNavigation(() => {
                                setSelectedPlanId(meal.id);
                                setScreen("plan-detail");
                              })}
                          >
                            Editar
                          </button>
                          <button
                            className="h-10 px-4 rounded-[10px] bg-[#fff0ec] text-[#b42318] font-bold active:scale-95 transition-transform"
                            onClick=${() => askDeleteConfirm({
                              title: "Apagar refeição do plano",
                              message: "Tem certeza que deseja apagar este item?",
                              onConfirm: async () => {
                                if (authConfigured) {
                                  const user = await getAuthenticatedUser();
                                  if (!user) {
                                    showAuthNotice("Sua sessão não foi encontrada. Entre novamente para apagar a refeição do plano.");
                                    return;
                                  }
                                  const result = await deletePlanMealEntry(user.id, meal.id);
                                  if (!result.ok) {
                                    showAuthNotice(result.error?.message || "Não foi possível apagar a refeição do plano agora.");
                                    return;
                                  }
                                }
                                mutate((draft) => {
                                  draft.planMeals = draft.planMeals.filter((item) => item.id !== meal.id);
                                });
                              },
                            })}
                          >
                            Apagar
                          </button>
                        </div>
                      </div>
                    `,
                  )
                : html`
                  <div className="rounded-[10px] bg-white/90 border border-slate-200/70 px-5 py-4">
                    <p className="text-sm text-on-surface-variant">Nenhuma refeição cadastrada no plano ainda.</p>
                    <p className="text-[0.78rem] text-on-surface-variant mt-1">Use o botão abaixo para adicionar sua primeira refeição.</p>
                  </div>
                `}
            </div>
          </section>

          <section className="mos-card rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm text-[#4558C8]">Configuração</span>
                <h2 className="text-lg font-bold text-jet-black">Editar dados do plano</h2>
                <p className="text-sm text-on-surface-variant">Atualize o nome, o foco e as notas gerais que orientam a rotina alimentar.</p>
              </div>
              <div className="w-11 h-11 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0">
                <${Icon} name="tune" className="text-[#4558C8]" />
              </div>
            </div>
            <form
              className="flex flex-col gap-5"
              onInput=${() => markDraftDirty("plan-config")}
              onChange=${() => markDraftDirty("plan-config")}
              onSubmit=${(e) => {
                e.preventDefault();
                savePlanConfig(new FormData(e.currentTarget));
              }}
            >
              <div className="grid gap-2">
                <label className="text-sm font-medium text-jet-black">Nome do plano</label>
                <input
                  className="w-full h-14 px-5 bg-surface-container-low border border-outline-variant rounded-[10px] text-jet-black"
                  name="planName"
                  placeholder="Ex: Plano atual: perder 5kg"
                  defaultValue=${state.profile.activeGoal}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-jet-black">Foco do plano</label>
                <input
                  className="w-full h-14 px-5 bg-surface-container-low border border-outline-variant rounded-[10px] text-jet-black"
                  name="planFocus"
                  placeholder="Ex: Déficit calórico com proteína alta"
                  defaultValue=${planFocus}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-jet-black">Observações</label>
                <textarea
                  className="w-full min-h-32 px-5 py-4 bg-surface-container-low border border-outline-variant rounded-[10px] text-jet-black resize-none"
                  name="planNotes"
                  placeholder="Ex: reduzir beliscos, manter água alta, seguir refeições-chave"
                >${planNotes}</textarea>
              </div>
              <button className=${getPrimaryActionClass(!planConfigDirty)} type="submit" disabled=${!planConfigDirty}>Salvar plano</button>
            </form>
          </section>
        </main>
        <${PlanConfigNav}
          onOpenConfig=${() => guardPlanConfigNavigation(() => setScreen("plan-config"))}
          onOpenMeal=${() => guardPlanConfigNavigation(() => setModal("plan"))}
          onOpenHistory=${() => guardPlanConfigNavigation(() => setScreen("history"))}
          onGoHome=${() => guardPlanConfigNavigation(() => setScreen("home"))}
        />
      </div>
    `;
  }

  function renderPlanDetail() {
    if (!selectedPlan) return renderPlan();
    const totals = summarizeFoods(selectedPlan.foods);
    const planBrainState = calculateMosState({
      caloriesConsumed: summary.calories,
      calorieTarget: state.profile.calorieTarget,
      waterConsumedMl: water,
      waterTargetMl: waterGoal,
      trainingDone: trainingHistory.some((entry) => entry.date === todayKey),
    });
    const planDetailGuidance =
      planBrainState.calorie === "ACIMA_CALORIA"
        ? "Troque quando quiser, mas prefira opções mais leves."
        : planBrainState.calorie === "ABAIXO_CALORIA_EXTREMO"
          ? "Troque se precisar, sem perder a base da refeição."
          : planBrainState.hydration === "HIDRATACAO_BAIXA"
            ? "Troque quando precisar e mantenha a refeição leve."
            : "Troque alimentos quando precisar, sem perder a base da refeição.";
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-24">
        <${TopBar}
          title=${selectedPlan.name}
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("plan")}
        />
        <main className="pt-20 px-4 max-w-md mx-auto space-y-6">
          <section className="space-y-2">
            <h1 className="text-[2rem] font-bold text-jet-black">${selectedPlan.name}</h1>
            <p className="text-[0.95rem] text-[#475569]">Veja os alimentos e troque se quiser.</p>
          </section>
          <section className="space-y-3">
            <div className="space-y-1">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Base da refeição</span>
              <p className="text-[0.92rem] text-[#475569]">O que foi pensado pra você, com ajustes possíveis.</p>
            </div>
            <div className="mos-card rounded-[24px] px-4 divide-y divide-[rgba(148,163,184,0.12)]">
            ${selectedPlan.foods.map(
              (food) => {
                const accent = getFoodAccent(food.name);
                return html`
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="plan-detail-food-icon w-10 h-10 rounded-full flex items-center justify-center shrink-0" style=${{ backgroundColor: accent.soft }}>
                        <${Icon} name=${accent.icon} className="text-jet-black text-[1.35rem]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[1rem] leading-relaxed text-jet-black">
                          <strong className="font-bold">${food.name}</strong>
                        </p>
                        <p className="text-[0.9rem] text-on-surface-variant mt-1">${food.quantity}</p>
                      </div>
                    </div>
                    <button className="plan-swap-button shrink-0 min-h-9 px-3.5 rounded-[10px] text-[0.78rem] font-bold active:scale-95 transition-transform flex items-center gap-2" onClick=${() => setSubstituteFood(food)}>
                      <${Icon} name="swap_horiz" className="text-[1.05rem] text-[#EF5F37]" />
                      <span>Trocar</span>
                    </button>
                  </div>
                `;
              },
            )}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-[0.875rem] font-bold text-[#292B2D]">Resumo nutricional</h3>
            <div className="mos-card rounded-[24px] px-4 divide-y divide-[rgba(148,163,184,0.12)]">
              ${selectedPlan.foods.map(
                (food) => {
                  const accent = getFoodAccent(food.name);
                  return html`
                    <div className="py-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style=${{ backgroundColor: accent.dot }}></span>
                        <h4 className="text-[1.15rem] font-bold text-jet-black">${food.name} <span className="font-medium text-[#292B2D]/75">(${food.quantity})</span></h4>
                      </div>
                      <div className="plan-nutrient-list">
                        <div className="plan-nutrient-row" style=${{ backgroundColor: accent.soft }}>
                          <span className="plan-nutrient-label">Calorias</span>
                          <strong className="plan-nutrient-value">${food.calories} kcal</strong>
                        </div>
                        <div className="plan-nutrient-row">
                          <span className="plan-nutrient-label">Proteína</span>
                          <strong className="plan-nutrient-value">${food.protein} g</strong>
                        </div>
                        <div className="plan-nutrient-row">
                          <span className="plan-nutrient-label">Carbo</span>
                          <strong className="plan-nutrient-value">${food.carbs} g</strong>
                        </div>
                        <div className="plan-nutrient-row">
                          <span className="plan-nutrient-label">Gordura</span>
                          <strong className="plan-nutrient-value">${food.fat} g</strong>
                        </div>
                      </div>
                    </div>
                  `;
                },
              )}
            </div>
          </section>
          <section className="mos-card rounded-2xl p-5 space-y-5">
            <h3 className="font-bold text-lg text-jet-black">Distribuição de Macros</h3>
            <div className="space-y-3.5">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[0.6875rem] font-bold text-[#475569]">Carbo</span>
                  <span className="text-sm font-bold text-jet-black">${Math.round(totals.carbs)}g</span>
                </div>
                <div className="h-3 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4558C8]" style=${{ width: `${Math.min(100, totals.carbs)}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[0.6875rem] font-bold text-[#475569]">Proteínas</span>
                  <span className="text-sm font-bold text-jet-black">${Math.round(totals.protein)}g</span>
                </div>
                <div className="h-3 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#EF5F37]" style=${{ width: `${Math.min(100, totals.protein)}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[0.6875rem] font-bold text-[#475569]">Gorduras</span>
                  <span className="text-sm font-bold text-jet-black">${Math.round(totals.fat)}g</span>
                </div>
                <div className="h-3 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D9B8F3]" style=${{ width: `${Math.min(100, totals.fat * 2)}%` }}></div>
                </div>
              </div>
            </div>
          </section>
          <section className="mos-card plan-guidance-card rounded-[22px] p-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DFF37D] flex items-center justify-center">
                <${Icon} name="lightbulb" className="text-jet-black" />
              </div>
              <h3 className="text-[0.875rem] font-bold text-[#292B2D]">Ajuste com segurança</h3>
            </div>
            <p className="text-[0.96rem] leading-relaxed text-on-surface-variant">${planDetailGuidance}</p>
          </section>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  function renderTraining() {
    const nowHour = new Date().getHours();
    const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
    return html`
      <div className="${getSectionBackground("training")} text-on-surface min-h-screen pb-32">
        <${TopBar} title="Treino" leftIcon="menu" centerBold=${false} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("training")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="space-y-3">
            <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
            <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)", lineHeight: "1.08" }}>Meus treinos</h1>
            <p className="text-[0.95rem] text-[#334155]">Abra um treino para ver exercícios e registrar a sessão.</p>
          </section>

          <section className="space-y-3">
            ${trainingPlans.length
              ? trainingPlans.map((plan) => {
                  const completedToday = trainingHistory.some((entry) => entry.planId === plan.id && entry.date === todayKey);
                  return html`
                    <button
                      className="mos-card rounded-2xl p-5 w-full text-left active:scale-[0.98] transition-transform flex flex-col gap-4"
                      onClick=${() => openTrainingDetail(plan.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[0.6875rem] ${TRAINING_THEME.accentText}">Treino</span>
                          <h3 className="text-[1.25rem] font-bold text-jet-black">${plan.name}</h3>
                        </div>
                        ${
                          completedToday
                            ? html`<div className="w-11 h-11 rounded-full ${TRAINING_THEME.accentSurface} flex items-center justify-center shrink-0"><${Icon} name="check" className="text-[#101846]" /></div>`
                            : html`<${Icon} name="arrow_forward" className="${TRAINING_THEME.accentText} text-[1.75rem] shrink-0" />`
                        }
                      </div>
                      <div className="flex items-center gap-4 text-sm ${TRAINING_THEME.mutedText}">
                        <span>${plan.estimatedMinutes} min</span>
                        <span>${plan.exercises.length} exercícios</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[0.75rem] font-semibold ${TRAINING_THEME.accentText}">Exercícios do treino</p>
                        <p className="text-sm ${TRAINING_THEME.mutedText}">${summarizeExerciseNames(plan)}</p>
                      </div>
                      ${completedToday ? html`<p className="text-sm ${TRAINING_THEME.accentText} font-bold">Treino concluído hoje</p>` : null}
                    </button>
                  `;
                })
              : html`
                <div className="mos-card rounded-2xl p-5 text-jet-black">
                  <p className="font-bold text-base">Você ainda não criou um treino.</p>
                  <p className="text-sm text-on-surface-variant mt-1">Crie seu primeiro treino para começar a acompanhar suas sessões e evoluções.</p>
                </div>
              `}
          </section>

          <button className=${getPrimaryActionClass(false)} onClick=${openTrainingCreate}>
            Novo treino
          </button>
        </main>
        <${BottomNav} active="training" onChange=${setScreen} />
      </div>
    `;
  }

  function renderTrainingDetail() {
    if (!selectedTraining) return renderTraining();
    return html`
      <div className="${getSectionBackground("training")} text-on-surface min-h-screen pb-32">
        <${TopBar}
          title=${selectedTraining.name}
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("training")}
          onSearch=${() => openSearch("training")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="grid grid-cols-2 gap-3">
            <div className="mos-card rounded-2xl p-5">
              <span className="text-[0.75rem] text-[#475569]">Minutos estimados</span>
              <strong className="block mt-2 text-[2rem] font-bold text-jet-black">${selectedTraining.estimatedMinutes}</strong>
            </div>
            <div className="mos-card rounded-2xl p-5">
              <span className="text-[0.75rem] text-[#475569]">Exercícios</span>
              <strong className="block mt-2 text-[2rem] font-bold text-jet-black">${selectedTraining.exercises.length}</strong>
            </div>
          </section>

          <section className="space-y-2">
            <div>
              <h2 className="text-lg font-bold text-jet-black">Exercícios do treino</h2>
              <p className="text-sm text-on-surface-variant">A ordem abaixo mostra como esse treino está cadastrado hoje.</p>
            </div>
          </section>

          <section className="mos-card rounded-2xl px-4 divide-y divide-surface-container-high">
            ${selectedTraining.exercises.map((exercise, index) => {
              const accent = getFoodAccent(exercise.name);
              return html`
                <div className="py-5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style=${{ backgroundColor: accent.soft }}>
                    <${Icon} name=${accent.icon} className="text-jet-black text-[1.35rem]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] ${TRAINING_THEME.accentText}">Exercício ${index + 1}</p>
                    <p className="text-[1.05rem] font-bold text-jet-black">${exercise.name}</p>
                    <p className="text-sm ${TRAINING_THEME.mutedText} mt-1">${exercise.sets} séries · ${exercise.reps} reps · ${exercise.restSeconds}s descanso</p>
                  </div>
                </div>
              `;
            })}
          </section>

          <div className="space-y-3">
            <button className=${getPrimaryActionClass(false)} onClick=${() => startTraining(selectedTraining.id)}>
              ${activeTraining?.planId === selectedTraining.id ? "Continuar treino" : "Iniciar treino"}
            </button>
            <button className=${getSecondaryActionClass(false)} onClick=${() => openTrainingEdit(selectedTraining.id)}>
              Editar treino
            </button>
          </div>
        </main>
        <${BottomNav} active="training" onChange=${setScreen} />
      </div>
    `;
  }

  function renderTrainingExecution() {
    if (!activeTraining || !activeTrainingPlan || !currentTrainingExercise) return renderTraining();
    const allDone = completedTrainingExercises >= activeTrainingPlan.exercises.length;
    const remainingExercises = Math.max(activeTrainingPlan.exercises.length - completedTrainingExercises, 0);
    const progressPercent = Math.max(8, Math.min(100, (completedTrainingExercises / Math.max(1, activeTrainingPlan.exercises.length)) * 100));

    return html`
      <div className="${getSectionBackground("training")} text-on-surface min-h-screen pb-12">
      <${TopBar}
        title=${activeTrainingPlan.name}
        leftIcon="arrow_back"
        centerBold=${false}
        onLeft=${openTrainingPause}
        rightSlot=${html`
          <button
            className="hover:opacity-80 transition-opacity active:scale-95"
            onClick=${openTrainingPause}
            aria-label="Pausar treino"
          >
            <${Icon} name="pause" className="text-[1.35rem] text-[#101846]" />
          </button>
        `}
      />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="${TRAINING_THEME.surface} rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm ${TRAINING_THEME.accentText}">Treino em andamento</span>
                <h1 className="text-[1.75rem] font-bold text-white">${activeTrainingPlan.name}</h1>
                <p className="text-sm ${TRAINING_THEME.mutedText}">${completedTrainingExercises} de ${activeTrainingPlan.exercises.length} exercícios concluídos</p>
              </div>
              <div className="${TRAINING_THEME.accentSurface} rounded-[10px] px-4 py-3 text-right shrink-0">
                <span className="block text-[0.75rem] text-[#101846]/72">Tempo</span>
                <strong className="block text-[1.25rem] font-bold text-[#101846]">${formatClock(activeTrainingElapsedSeconds)}</strong>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#DFF37D]"
                  style=${{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm ${TRAINING_THEME.mutedText}">
                <span>${allDone ? "Treino pronto para encerrar" : `Agora: ${currentTrainingExercise.name}`}</span>
                <span>${completedTrainingExercises} concluídos · ${remainingExercises} restantes</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">Progresso do treino</h2>
              <p className="text-sm text-on-surface-variant">Acompanhe o que já foi concluído, o exercício atual e o que ainda falta fazer.</p>
            </div>
            ${activeTrainingPlan.exercises.map((exercise, index) => {
              const accent = getFoodAccent(exercise.name);
              const done = completedTrainingExerciseIds.includes(exercise.id);
              const isCurrent = !done && index === currentTrainingExerciseIndex && !allDone;
              return html`
                <div
                  className=${[
                    "w-full rounded-xl p-4 border space-y-3",
                    done
                      ? "bg-[#f4faef] border-[#d7ef9d]"
                      : isCurrent
                        ? "bg-white border-[#EF5F37] shadow-[0_10px_22px_rgba(41,43,45,0.05)]"
                        : "bg-white border-surface-container-high",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style=${{ backgroundColor: done ? "#e5f5c3" : accent.soft }}>
                        <${Icon} name=${done ? "check" : accent.icon} className="text-jet-black text-[1.1rem]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[0.75rem] text-on-surface-variant">Exercício ${index + 1}</p>
                        <p className="font-bold text-jet-black">${exercise.name}</p>
                        <p className="text-sm text-on-surface-variant">${exercise.sets} séries · ${exercise.reps} reps · ${exercise.restSeconds}s descanso</p>
                      </div>
                    </div>
                    <span className=${["text-sm font-bold shrink-0", done ? "text-[#4b7a10]" : isCurrent ? "text-[#EF5F37]" : "text-on-surface-variant"].join(" ")}>
                      ${done ? "Feito" : isCurrent ? "Agora" : "Depois"}
                    </span>
                  </div>
                    ${
                      isCurrent
                        ? html`
                          <div className="rounded-[10px] bg-[#fff4ef] px-4 py-3 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[0.8125rem] font-bold text-[#EF5F37]">Em andamento</span>
                              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[0.8125rem] font-medium text-jet-black">${exercise.sets} séries</span>
                              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[0.8125rem] font-medium text-jet-black">${exercise.reps} reps</span>
                              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[0.8125rem] font-medium text-jet-black">${exercise.restSeconds}s descanso</span>
                            </div>
                            <p className="text-sm text-on-surface-variant">Quando terminar este exercício, marque como concluído para ele entrar no progresso do treino.</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="min-h-11 rounded-[10px] border border-[#EF5F37] bg-white px-4 text-sm font-bold text-[#EF5F37] active:scale-[0.98] transition-transform"
                                onClick=${() => markTrainingExerciseDone(exercise.id)}
                              >
                                Marcar como concluído
                              </button>
                            </div>
                          </div>
                        `
                      : done
                        ? html`
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm font-bold text-[#4b7a10]">Exercício concluído neste treino</div>
                            <button
                              className="inline-flex items-center gap-2 rounded-[10px] border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-medium text-jet-black active:scale-[0.98] transition-transform"
                              onClick=${() => undoTrainingExerciseDone(exercise.id)}
                            >
                              <${Icon} name="undo" className="text-base" />
                              <span>Desfazer</span>
                            </button>
                          </div>
                        `
                        : html`<p className="text-sm text-on-surface-variant">Este exercício aparece na sequência, depois que o atual for concluído.</p>`
                  }
                </div>
              `;
            })}
          </section>

          <button className=${getPrimaryActionClass(false)} onClick=${requestTrainingFinish}>
            Concluir treino de hoje
          </button>
          <button className=${getSecondaryActionClass(false)} onClick=${openTrainingPause}>
            Pausar treino
          </button>
        </main>
      </div>
    `;
  }

  function renderTrainingSummary() {
    const summaryEntry = completedTraining || latestTrainingEntry;
    if (!summaryEntry) return renderTraining();
    return html`
      <div className="${getSectionBackground("training")} text-on-surface min-h-screen pb-24">
        <${TopBar}
          title="Resumo da sessão"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("training")}
          onSearch=${() => openSearch("training")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="${TRAINING_THEME.surface} rounded-xl p-6 space-y-2">
            <span className="text-sm ${TRAINING_THEME.accentText}">Resumo da sessão</span>
            <h1 className="text-[1.75rem] font-bold text-white">${summaryEntry.planName}</h1>
            <div className="mt-4 ${TRAINING_THEME.surfaceMuted} rounded-xl p-5">
              <span className="text-sm ${TRAINING_THEME.mutedText}">Volume total</span>
              <strong className="block text-[2rem] font-bold ${TRAINING_THEME.accentText}">${summaryEntry.volumeTotal.toLocaleString("pt-BR")} kg</strong>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="${TRAINING_THEME.surface} rounded-xl p-5">
              <span className="text-sm ${TRAINING_THEME.accentText}">Tempo</span>
              <strong className="block mt-3 text-[1.8rem] font-bold text-white">${formatClock(summaryEntry.durationSeconds)}</strong>
            </div>
            <div className="${TRAINING_THEME.accentSurface} rounded-xl p-5">
              <span className="text-sm text-[#101846]/72">Séries</span>
              <strong className="block mt-3 text-[1.8rem] font-bold text-[#101846]">${summaryEntry.seriesCompleted}</strong>
            </div>
          </section>

          <section className="${TRAINING_THEME.surface} rounded-xl p-6 space-y-4">
            <div className="border-l-2 border-[#DFF37D] pl-4 space-y-2">
              <span className="text-sm ${TRAINING_THEME.accentText}">Insight da sessão</span>
              <p className="text-sm leading-relaxed ${TRAINING_THEME.mutedText}">Ótima leitura de volume para ${summaryEntry.planName}. Mantenha a técnica estável e tente subir a carga apenas quando completar as faixas de repetições com controle.</p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-jet-black">Análise por exercício</h2>
              <span className="text-sm text-on-surface-variant">${summaryEntry.exercisesCompleted} concluídos</span>
            </div>
            <div className="space-y-3">
              ${summaryEntry.exercises.map(
                (exercise) => html`
                  <div className="bg-white rounded-xl p-5 shadow-[0_10px_22px_rgba(41,43,45,0.05)] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-jet-black">${exercise.name}</p>
                        <p className="text-sm text-on-surface-variant">${exercise.sets} séries · ${exercise.reps}</p>
                      </div>
                      <span className="text-sm font-bold text-[#EF5F37]">${Math.round(exercise.volume).toLocaleString("pt-BR")} kg</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
                      <div className="h-full rounded-full bg-[#EF5F37]" style=${{ width: `${Math.max(12, Math.min(100, (exercise.volume / Math.max(1, summaryEntry.volumeTotal)) * 100))}%` }}></div>
                    </div>
                  </div>
                `,
              )}
            </div>
          </section>
        </main>
        <${BottomNav} active="training" onChange=${setScreen} />
      </div>
    `;
  }

  function renderTrainingEdit() {
    if (!trainingDraft) return renderTraining();
    const guardTrainingEditNavigation = (action) =>
      confirmDiscard(action, "Deseja sair da edição atual? As alterações do treino ainda não foram salvas.");
    const trainingLabel = trainingDraft.name?.trim() || "Novo treino";
    return html`
      <div className="${getSectionBackground("training")} text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Editar treino"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => guardTrainingEditNavigation(() => {
            setTrainingDraft(null);
            setScreen(selectedTraining ? "training-detail" : "training");
          })}
          onSearch=${() => openSearch("training")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <form className="space-y-6" onSubmit=${saveTrainingDraft} onInput=${() => markDraftDirty("training-edit")} onChange=${() => markDraftDirty("training-edit")}>
          <section className="rounded-xl p-6 space-y-4 ${TRAINING_THEME.surface}">
            <div className="space-y-1">
              <h2 className="text-lg font-bold ${TRAINING_THEME.accentText}">Informações do treino</h2>
              <p className="text-sm ${TRAINING_THEME.mutedText}">Comece ajustando o nome e o tempo estimado. Logo abaixo aparecem os exercícios exatamente como estão cadastrados hoje, só que em modo editável.</p>
            </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-jet-black">Nome do treino</label>
                <input
                  className="w-full h-14 px-4 rounded-[10px] bg-white text-jet-black border border-outline-variant"
                  value=${trainingDraft.name}
                  onInput=${(e) => updateTrainingDraftField("name", e.currentTarget.value)}
                  placeholder="Ex: Treino A"
                />
                <p className="text-[0.8125rem] ${TRAINING_THEME.mutedText}">Esse é o nome que a pessoa vê na lista e também no treino em andamento.</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-jet-black">Duração estimada da sessão (minutos)</label>
                <input
                  className="w-full h-14 px-4 rounded-[10px] bg-white text-jet-black border border-outline-variant"
                  type="number"
                  min="15"
                  max="180"
                  value=${trainingDraft.estimatedMinutes}
                  onInput=${(e) => updateTrainingDraftField("estimatedMinutes", Number(e.currentTarget.value))}
                />
                <p className="text-[0.8125rem] ${TRAINING_THEME.mutedText}">Use um tempo aproximado da sessão inteira.</p>
              </div>
              <div className="rounded-[10px] bg-white/90 p-4 border border-outline-variant text-sm text-jet-black">
                <strong>${trainingLabel}</strong> · ${trainingDraft.estimatedMinutes} min estimados · ${trainingDraft.exercises.length} exercícios cadastrados
              </div>
            </section>

            <section className="bg-white rounded-xl p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-jet-black">Exercícios do treino</h2>
                <p className="text-sm text-on-surface-variant">Cada exercício aparece do jeito que já está cadastrado. Basta tocar nos campos que quiser ajustar.</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button type="button" className="flex-1 min-h-12 rounded-[10px] border border-[#EF5F37] bg-white text-[#EF5F37] text-sm font-bold active:scale-[0.98] transition-transform" onClick=${addTrainingExercise}>
                  Adicionar exercício
                </button>
                <button type="button" className="min-h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black text-sm font-medium active:scale-[0.98] transition-transform" onClick=${removeAllTrainingExercises}>
                  Remover todos
                </button>
              </div>

              ${trainingDraft.exercises.length
                ? html`
                  <div className="space-y-4">
                    ${trainingDraft.exercises.map((exercise, index) => {
                      const suggestion = getTrainingProgressionSuggestion(exercise, trainingHistory, trainingPlans);
                      const summary = `${exercise.focus || "Selecione o grupo muscular"} · ${exercise.sets} séries · ${exercise.reps} reps · ${exercise.restSeconds}s descanso`;
                      return html`
                        <div id=${`training-exercise-${exercise.id}`} className="border border-outline-variant rounded-xl p-4 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center">
                                <${Icon} name="fitness_center" className="text-jet-black" />
                              </div>
                              <div>
                                <p className="text-[0.75rem] text-on-surface-variant">Exercício ${index + 1}</p>
                                <p className="font-bold text-jet-black">${exercise.name}</p>
                                <p className="text-sm text-on-surface-variant">${summary}</p>
                              </div>
                            </div>
                            <button type="button" className="text-[#d64545] font-bold text-sm" onClick=${() => removeTrainingExercise(exercise.id)}>
                              Remover
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid gap-2">
                              <label className="text-sm font-medium text-jet-black">Nome do exercício</label>
                              <input
                                id=${`training-exercise-name-${exercise.id}`}
                                className="w-full h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black border border-outline-variant"
                                value=${exercise.name}
                                onInput=${(e) => updateTrainingExerciseField(exercise.id, "name", e.currentTarget.value)}
                              />
                              <p className="text-[0.8125rem] text-on-surface-variant">Esse é o nome que aparece na lista do treino e também durante a execução.</p>
                            </div>

                            <div className="grid gap-2">
                              <label className="text-sm font-medium text-jet-black">Grupo muscular</label>
                              <select
                                className="w-full h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black border border-outline-variant"
                                value=${exercise.focus || ""}
                                onChange=${(e) => handleTrainingExerciseFocusChange(exercise.id, e)}
                              >
                                <option value="">Selecione o grupo muscular</option>
                                ${TRAINING_MUSCLE_GROUPS.map(
                                  (group) => html`
                                    <optgroup label=${group.label}>
                                      ${group.options.map(
                                        (option) => html`<option value=${option}>${option}</option>`,
                                      )}
                                    </optgroup>
                                  `,
                                )}
                              </select>
                              <p className="text-[0.8125rem] text-on-surface-variant">Selecione o principal grupo muscular trabalhado neste exercício.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-jet-black">Séries</label>
                                <div className="flex items-center gap-2">
                                  <button type="button" className="w-10 h-10 rounded-[10px] bg-surface-container-low text-jet-black font-bold" onClick=${() => adjustTrainingExerciseSets(exercise.id, -1)}>-</button>
                                  <input
                                    className="flex-1 h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black border border-outline-variant"
                                    type="number"
                                    min="1"
                                    max="12"
                                    value=${exercise.sets}
                                    onInput=${(e) => updateTrainingExerciseField(exercise.id, "sets", e.currentTarget.value)}
                                  />
                                  <button type="button" className="w-10 h-10 rounded-[10px] bg-surface-container-low text-jet-black font-bold" onClick=${() => adjustTrainingExerciseSets(exercise.id, 1)}>+</button>
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-jet-black">Repetições por série</label>
                                <input
                                  className="w-full h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black border border-outline-variant"
                                  value=${exercise.reps}
                                  onInput=${(e) => updateTrainingExerciseField(exercise.id, "reps", e.currentTarget.value)}
                                  placeholder="10-12"
                                />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-jet-black">Descanso entre séries (segundos)</label>
                                <input
                                  className="w-full h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black border border-outline-variant"
                                  type="number"
                                  min="15"
                                  max="600"
                                  value=${exercise.restSeconds}
                                  onInput=${(e) => updateTrainingExerciseField(exercise.id, "restSeconds", e.currentTarget.value)}
                                />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-jet-black">Carga de referência (kg)</label>
                                <input
                                  className="w-full h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black border border-outline-variant"
                                  type="number"
                                  min="0"
                                  max="500"
                                  value=${exercise.suggestedLoadKg}
                                  onInput=${(e) => updateTrainingExerciseField(exercise.id, "suggestedLoadKg", e.currentTarget.value)}
                                />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <label className="text-sm font-medium text-jet-black">Sugestão de progressão</label>
                              <input
                                className="w-full h-12 px-4 rounded-[10px] bg-surface-container-low text-jet-black border border-outline-variant"
                                value=${exercise.loadDelta}
                                onInput=${(e) => updateTrainingExerciseField(exercise.id, "loadDelta", e.currentTarget.value)}
                                placeholder="Ex: +2kg"
                              />
                              <p className="text-[0.8125rem] text-on-surface-variant">Use para indicar pequenas evoluções quando estiver confortável com as repetições.</p>
                            </div>

                            ${suggestion
                              ? html`
                                  <div className="rounded-[10px] bg-[#f4f9ff] border border-[#d9e6ff] p-4 text-sm text-[#2e3f66] space-y-1">
                                    <strong>Progressão sugerida</strong>
                                    <p>Última carga: ${formatTrainingLoad(suggestion.lastLoad)} · Próxima meta: ${formatTrainingLoad(suggestion.suggestedLoad)}</p>
                                  </div>
                                `
                              : null}

                            <div className="flex items-center justify-between gap-2">
                              <button type="button" className="min-h-10 rounded-[10px] border border-outline-variant bg-white px-4 text-sm font-medium text-jet-black active:scale-[0.98] transition-transform" onClick=${() => duplicateTrainingExercise(exercise.id)}>
                                Duplicar exercício
                              </button>
                            </div>
                          </div>
                        </div>
                      `;
                    })}
                  </div>
                `
                : html`
                  <div className="rounded-xl border border-dashed border-outline-variant p-6 text-center space-y-2">
                    <p className="text-sm text-on-surface-variant">Nenhum exercício cadastrado ainda. Toque em <strong className="text-jet-black">Adicionar exercício</strong> para montar este treino.</p>
                  </div>
                `}
            </section>

            <button className=${getPrimaryActionClass(!isDraftDirty("training-edit"))} type="submit" disabled=${!isDraftDirty("training-edit")}>
              Salvar treino
            </button>
          </form>
        </main>
      </div>
    `;
  }

  function renderSupplements() {
    const nowHour = new Date().getHours();
    const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
    const groupedSupplements = state.supplements.reduce((groups, supplement) => {
      const category = supplement.category || "Geral";
      if (!groups[category]) groups[category] = [];
      groups[category].push(supplement);
      return groups;
    }, {});
    const sortedCategories = Object.keys(groupedSupplements).sort((left, right) => left.localeCompare(right));
    const currentMinutes = getCurrentMinutes();
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-32">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("supplements")} onRight=${openNotifications} />
        <main className="pt-24 px-6 max-w-md mx-auto space-y-8 pb-64">
          <${renderPlanModeHeader}
            activeMode="supplements"
            headline="Sua rotina de hoje"
            support="Veja horários, uso e ações em um só lugar."
            nowHour=${nowHour}
            profileName=${profileName}
          />
          <div className="space-y-6">
            ${sortedCategories.map((category) => html`
              <section className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#64748B]">${category}</span>
                </div>
                <div className="space-y-3">
                  ${groupedSupplements[category].map((supplement) => {
                    const status = getSupplementMomentStatus(supplement.time, currentMinutes);
                    const timeLabel = formatMealTimeLabel(supplement.time);
                    const instructionLabel = timeLabel
                      ? `Tomar hoje às ${timeLabel}`
                      : supplement.instruction;
                    return html`
                      <div className="supplement-inline-card">
                        <div className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3 min-w-0">
                              <div className="space-y-1">
                                <h3 className="text-[1.15rem] font-bold text-[#0F172A]">${supplement.name}</h3>
                                <p className="text-[0.92rem] text-[#475569]">${instructionLabel}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-[0.82rem] text-[#475569]">
                                <span>${supplement.dosage}</span>
                                <span>${timeLabel || "Sem horário"}</span>
                                <span className=${`supplement-status supplement-status--${status.tone}`}>${status.label}</span>
                              </div>
                            </div>
                          </div>
                          <div className="supplement-inline-details">
                            <p className="text-[0.92rem] leading-relaxed text-[#475569]">${supplement.instruction}</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                className="supplement-action-button"
                                onClick=${() => {
                                  setSelectedSupplementId(supplement.id);
                                  setModal("edit-supplement");
                                }}
                              >
                                Editar
                              </button>
                              <button
                                className="supplement-action-button supplement-action-button--danger"
                                onClick=${() => askDeleteConfirm({
                                  title: "Apagar suplemento",
                                  message: "Tem certeza que deseja apagar este item?",
                                  onConfirm: async () => {
                                    if (authConfigured) {
                                      const user = await getAuthenticatedUser();
                                      if (!user) {
                                        showAuthNotice("Sua sessão não foi encontrada. Entre novamente para apagar o suplemento.");
                                        return;
                                      }
                                      const result = await deleteSupplementEntry(user.id, supplement.id);
                                      if (!result.ok) {
                                        showAuthNotice(result.error?.message || "Não foi possível apagar o suplemento agora.");
                                        return;
                                      }
                                    }
                                    mutate((draft) => {
                                      draft.supplements = draft.supplements.filter((item) => item.id !== supplement.id);
                                    });
                                    setSelectedSupplementId(null);
                                  },
                                })}
                              >
                                Apagar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                  })}
                </div>
              </section>
            `)}
          </div>
          <button className="w-full py-5 bg-[#EF5F37] text-white rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_18px_34px_rgba(239,95,55,0.24)]" onClick=${() => setScreen("register-supplement")}>
            <${Icon} name="add_circle" />
            Novo suplemento
          </button>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  function renderWater() {
    const nowHour = new Date().getHours();
    const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
    const waterProgress = Math.min(100, (water / waterGoal) * 100);
    const remainingWater = Math.max(0, waterGoal - water);
    const quickWaterOptions = [200, 300, 500];
    const selectedEntriesCount = waterEntries.length;
    const waterInsight = generateMosOperationalInsight(
      calculateMosExecutionSignals({
        caloriesConsumed: summary.calories,
        calorieTarget: state.profile.calorieTarget,
        waterConsumedMl: water,
        waterTargetMl: waterGoal,
        trainingDone: trainingHistory.some((entry) => entry.date === todayKey),
      }),
    );
    return html`
      <div className="${getSectionBackground("water")} text-on-surface min-h-screen pb-32">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("water")} onRight=${openNotifications} />
        <main className="pt-24 px-6 max-w-md mx-auto space-y-6">
          <section className="space-y-3">
            <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
            <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)", lineHeight: "1.08" }}>
              Água hoje
            </h1>
            <p className="text-[0.95rem] text-[#334155]">Veja quanto entrou e quanto falta para a meta.</p>
          </section>
          <section className="water-focus-hero">
            <div className="space-y-2">
              <span className="text-[0.78rem] font-bold text-[#64748B]">Status</span>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-[3.6rem] font-black leading-none text-[#0F172A]">${Math.round(water)}</strong>
                    <span className="text-[1rem] font-bold text-[#475569]">ml</span>
                  </div>
                  <p className="text-[0.95rem] font-semibold text-[#475569]">de ${waterGoal} ml</p>
                </div>
                <span className="water-progress-chip">${Math.round(waterProgress)}%</span>
              </div>
              <div className="water-progress-track" aria-hidden="true">
                <div className="water-progress-fill" style=${{ width: `${waterProgress}%` }}></div>
              </div>
            </div>
            <div className="water-remaining-panel">
              <p className="text-[1.25rem] font-black text-[#0F172A]">${remainingWater > 0 ? `Faltam ${remainingWater} ml` : "Meta batida"}</p>
              <p className="text-[0.9rem] text-[#475569]">${waterInsight}</p>
            </div>
            ${waterHistoryDate !== todayKey
              ? html`
                  <div className="flex justify-end">
                    <button
                      className="min-h-11 px-4 rounded-[10px] bg-[#fff4ef] border border-[#ffd8ce] text-[#EF5F37] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      onClick=${goToTodayWaterHistory}
                    >
                      <${Icon} name="today" className="text-[#EF5F37]" />
                      <span>Ver hoje</span>
                    </button>
                  </div>
                `
              : null}
          </section>

          <section className="water-action-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[1.15rem] font-black text-[#0F172A]">Adicionar água</h2>
                <p className="text-sm text-[#475569]">Toque uma vez para somar no dia.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              ${quickWaterOptions.map(
                (amount) => html`
                  <button
                    className="water-quick-button"
                    onClick=${() => appendWaterAmount(amount)}
                  >
                    <${Icon} name="water_drop" className="text-[1.15rem]" filled=${true} />
                    <span>${amount} ml</span>
                  </button>
                `,
              )}
              <button className="water-quick-button water-quick-button--custom" onClick=${() => setModal("water")}>
                <${Icon} name="add_circle" className="text-[1.15rem]" />
                <span>Outro valor</span>
              </button>
            </div>
          </section>

          <section className="water-support-panel">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-[#0F172A]">
                ${waterHistoryDate === todayKey
                  ? `Hoje você já registrou ${selectedEntriesCount} ${selectedEntriesCount === 1 ? "vez" : "vezes"}`
                  : `Registros de ${waterViewDateLabel}`}
              </h3>
              <button className="water-history-link" onClick=${openWaterHistory}>Ver tudo</button>
            </div>
            <div className="space-y-1">
              ${waterEntries.length
                ? waterEntries.slice(0, 4).map(
                    (entry) => html`
                      <div className="water-history-row">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[1.05rem] font-black leading-none text-[#0F172A]">${entry.amount}</span>
                              <span className="text-[0.75rem] font-bold text-[#64748B]">ml</span>
                            </div>
                            <p className="text-[0.82rem] text-[#64748B]">${entry.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[0.9rem] font-bold text-[#475569]">${entry.time}</span>
                          <button
                            className="w-9 h-9 rounded-full text-[#EF5F37] flex items-center justify-center active:scale-95 transition-transform"
                            onClick=${() => askDeleteConfirm({
                              title: "Apagar registro de água",
                              message: "Tem certeza que deseja apagar este item?",
                              onConfirm: async () => {
                                if (authConfigured) {
                                  const user = await getAuthenticatedUser();
                                  if (!user) {
                                    showAuthNotice("Sua sessão não foi encontrada. Entre novamente para apagar o registro.");
                                    return;
                                  }
                                  const result = await deleteWaterEntry(user.id, entry.id);
                                  if (!result.ok) {
                                    showAuthNotice(result.error?.message || "Não foi possível apagar o registro agora.");
                                    return;
                                  }
                                }
                                mutate((draft) => {
                                  draft.waterHistory[waterHistoryDate] = (draft.waterHistory[waterHistoryDate] || waterEntries).filter((item) => item.id !== entry.id);
                                  draft.water[waterHistoryDate] = Math.max(0, (draft.water[waterHistoryDate] || water) - entry.amount);
                                });
                              },
                            })}
                          >
                            <${Icon} name="delete" className="text-[1rem]" />
                          </button>
                        </div>
                      </div>
                    `,
                  )
                : html`
                    <div className="water-empty-state">
                      <p className="font-bold text-[#0F172A]">Nenhum registro nesse dia</p>
                      <p className="text-sm text-[#64748B]">Adicione água para começar o histórico.</p>
                    </div>
                  `}
            </div>
          </section>
        </main>
        <${BottomNav} active="water" onChange=${setScreen} />
      </div>
    `;
  }

  function renderMeasures() {
    const weightPath = buildSmoothSparklinePath(measureEntries.map((entry) => entry.weight));
    const fatPath = buildSmoothSparklinePath(measureEntries.map((entry) => entry.bodyFat));
    const bodyWaterPercent = latestMeasure.weight ? Math.min(100, (latestMeasure.bodyWater / latestMeasure.weight) * 100) : 0;
    const musclePercent = latestMeasure.weight ? Math.min(100, (latestMeasure.muscleMass / latestMeasure.weight) * 100) : 0;
    const bodyFatPercent = Math.min(100, latestMeasure.bodyFat);
    const latestDateLabel = parseDateKey(latestMeasure.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

    return html`
      <div className="mos-screen text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Minhas medidas"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("home")}
          onSearch=${() => openSearch("home")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="bg-white rounded-xl p-6 border border-[#dde8f3] space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm text-[#4558C8]">Dados atuais</span>
                <h1 className="text-[1.9rem] font-bold text-jet-black leading-tight">Seu corpo em foco</h1>
                <p className="text-sm text-on-surface-variant">Atualizado em ${latestDateLabel}</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0">
                <${Icon} name="monitor_weight" className="text-[#4558C8] text-[1.5rem]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#292B2D] text-white rounded-[10px] p-4">
                <span className="text-sm text-white/65 block mb-2">Peso atual</span>
                <strong className="text-[2rem] font-bold leading-none">${latestMeasure.weight}</strong>
                <span className="text-sm text-white/72 ml-1">kg</span>
                <p className="text-sm text-white/65 mt-3">${formatMetricDelta(latestMeasure.weight, previousMeasure.weight, " kg")}</p>
              </div>
              <div className="bg-[#eef2ff] rounded-[10px] p-4">
                <span className="text-sm text-[#4558C8] block mb-2">IMC</span>
                <strong className="text-[2rem] font-bold leading-none text-jet-black">${latestBmi}</strong>
                <p className="text-sm text-on-surface-variant mt-3">${formatMetricDelta(latestBmi, previousBmi)}</p>
              </div>
              <div className="bg-white border border-[#dde8f3] rounded-[10px] p-4">
                <span className="text-sm text-on-surface-variant block mb-2">Gordura corporal</span>
                <strong className="text-[1.75rem] font-bold leading-none text-jet-black">${latestMeasure.bodyFat}</strong>
                <span className="text-sm text-on-surface-variant ml-1">%</span>
                <p className="text-sm text-[#EF5F37] mt-3">${formatMetricDelta(latestMeasure.bodyFat, previousMeasure.bodyFat, "%")}</p>
              </div>
              <div className="bg-white border border-[#dde8f3] rounded-[10px] p-4">
                <span className="text-sm text-on-surface-variant block mb-2">Massa muscular</span>
                <strong className="text-[1.75rem] font-bold leading-none text-jet-black">${latestMeasure.muscleMass}</strong>
                <span className="text-sm text-on-surface-variant ml-1">kg</span>
                <p className="text-sm text-[#4558C8] mt-3">${formatMetricDelta(latestMeasure.muscleMass, previousMeasure.muscleMass, " kg")}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border border-[#dde8f3] space-y-4 shadow-[0_12px_30px_rgba(69,88,200,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-jet-black">Peso</h2>
                <span className="text-sm text-on-surface-variant">${latestMeasure.weight} kg</span>
              </div>
              <svg viewBox="0 0 220 72" className="w-full h-20 overflow-visible">
                <defs>
                  <linearGradient id="measuresWeightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#6d7dfa" />
                    <stop offset="100%" stop-color="#4558C8" />
                  </linearGradient>
                  <linearGradient id="measuresWeightGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="rgba(109,125,250,0.18)" />
                    <stop offset="100%" stop-color="rgba(109,125,250,0)" />
                  </linearGradient>
                </defs>
                <path d="M 0 66 H 220" fill="none" stroke="#eef2ff" strokeWidth="1.5" />
                <path d=${`${weightPath} L 220 72 L 0 72 Z`} fill="url(#measuresWeightGlow)" />
                <path d=${weightPath} fill="none" stroke="url(#measuresWeightGradient)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-on-surface-variant">Evolução entre as últimas atualizações.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#dde8f3] space-y-4 shadow-[0_12px_30px_rgba(239,95,55,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-jet-black">Gordura</h2>
                <span className="text-sm text-on-surface-variant">${latestMeasure.bodyFat}%</span>
              </div>
              <svg viewBox="0 0 220 72" className="w-full h-20 overflow-visible">
                <defs>
                  <linearGradient id="measuresFatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#ff8a62" />
                    <stop offset="100%" stop-color="#EF5F37" />
                  </linearGradient>
                  <linearGradient id="measuresFatGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="rgba(239,95,55,0.16)" />
                    <stop offset="100%" stop-color="rgba(239,95,55,0)" />
                  </linearGradient>
                </defs>
                <path d="M 0 66 H 220" fill="none" stroke="#fff0ea" strokeWidth="1.5" />
                <path d=${`${fatPath} L 220 72 L 0 72 Z`} fill="url(#measuresFatGlow)" />
                <path d=${fatPath} fill="none" stroke="url(#measuresFatGradient)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-on-surface-variant">Visão rápida da composição corporal.</p>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 border border-[#dde8f3] space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">Composição atual</h2>
              <p className="text-sm text-on-surface-variant">Os indicadores abaixo ajudam a acompanhar o que mais importa para o MOS!</p>
            </div>

            ${[
              { label: "Água corporal", value: latestMeasure.bodyWater, unit: "kg", width: bodyWaterPercent, color: "#4558C8" },
              { label: "Massa muscular", value: latestMeasure.muscleMass, unit: "kg", width: musclePercent, color: "#D9B8F3" },
              { label: "Gordura corporal", value: latestMeasure.bodyFat, unit: "%", width: bodyFatPercent, color: "#EF5F37" },
            ].map(
              (item) => html`
                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-medium text-jet-black">${item.label}</span>
                    <strong className="text-[1rem] font-bold text-jet-black">${item.value} ${item.unit}</strong>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container-low overflow-hidden">
                    <div className="h-full rounded-full" style=${{ width: `${Math.min(100, item.width)}%`, backgroundColor: item.color }}></div>
                  </div>
                </div>
              `,
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-surface-container-low rounded-[10px] p-4">
                <span className="text-sm text-on-surface-variant block mb-2">Altura</span>
                <strong className="text-[1.35rem] font-bold text-jet-black">${latestMeasure.height} cm</strong>
              </div>
              <div className="bg-surface-container-low rounded-[10px] p-4">
                <span className="text-sm text-on-surface-variant block mb-2">Idade metabólica</span>
                <strong className="text-[1.35rem] font-bold text-jet-black">${latestMeasure.metabolicAge} anos</strong>
              </div>
            </div>
          </section>

          <button className="w-full h-14 bg-[#EF5F37] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => setModal("measures")}>
            Editar meus dados
          </button>
        </main>
        <${BottomNav} active=${null} onChange=${setScreen} />
      </div>
    `;
  }

  function renderProfile() {
    const profileItems = [
      { label: "Nome", value: state.profile.name || "Ainda não informado", icon: "person" },
      { label: "Email", value: state.profile.email || "Ainda não informado", icon: "mail" },
      { label: "Cidade", value: state.profile.city || "Ainda não informado", icon: "location_on" },
      {
        label: "Aniversário",
        value: state.profile.birthday ? parseDateKey(state.profile.birthday).toLocaleDateString("pt-BR") : "Ainda não informado",
        icon: "cake",
      },
      { label: "Meta calórica", value: `${Math.round(state.profile.calorieTarget || 0).toLocaleString("pt-BR")} kcal`, icon: "local_fire_department" },
      { label: "Meta de água", value: `${Math.round(state.profile.waterTargetMl || 0).toLocaleString("pt-BR")} ml`, icon: "water_drop" },
    ];

    return html`
      <div className="mos-screen text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Meu perfil"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("home")}
          onSearch=${() => openSearch("home")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="mos-info-card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm text-[#4558C8]">Dados pessoais</span>
                <h1 className="text-[1.9rem] font-bold text-jet-black leading-tight">${state.profile.name || "Meu perfil"}</h1>
                <p className="text-sm leading-relaxed text-on-surface-variant">Aqui você concentra as informações principais da sua conta para manter o MOS! mais pessoal e organizado.</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0">
                <${Icon} name="account_circle" className="text-[#4558C8] text-[1.6rem]" />
              </div>
            </div>
          </section>

          <section className="mos-info-grid">
            ${profileItems.map(
              (item) => html`
                <div className="mos-info-tile">
                  <div className="mos-info-icon">
                    <${Icon} name=${item.icon} className="text-[#4558C8]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-on-surface-variant block mb-1">${item.label}</span>
                    <strong className="text-[1rem] font-bold text-jet-black break-words">${item.value}</strong>
                  </div>
                </div>
              `,
            )}
          </section>

          <button className="w-full h-14 bg-[#EF5F37] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => setModal("profile")}>
            Editar
          </button>
        </main>
        <${BottomNav} active=${null} onChange=${setScreen} />
      </div>
    `;
  }

  function renderAboutApp() {
    const latestFeedback = state.feedbackEntries?.[0];
    const areas = [
      { name: "Início", description: "Mostra seu resumo do dia, calorias, macros e os atalhos principais do app." },
      { name: "Comida", description: "Registra refeições, revisa o que foi consumido e permite ver dias anteriores." },
      { name: "Plano", description: "Organiza seu cardápio, refeições planejadas, trocas e a configuração do plano." },
      { name: "Água", description: "Acompanha hidratação, meta diária e histórico de consumo ao longo do dia." },
      { name: "Treino", description: "Cria treinos, guia a execução e registra o resumo da sessão." },
      { name: "Minhas medidas", description: "Concentra peso, IMC, composição corporal e evolução das últimas atualizações." },
      { name: "Notificações", description: "Reúne lembretes de suplemento, avisos importantes e novidades do MOS!" },
      { name: "Busca", description: "Ajuda a encontrar rapidamente refeições, alimentos, suplementos e páginas do app." },
    ];

    return html`
      <div className="mos-screen text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Sobre o app"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("home")}
          onSearch=${() => openSearch("home")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="mos-info-card space-y-4">
            <span className="text-sm text-[#4558C8]">Bem-vinda ao MOS!</span>
            <h1 className="text-[1.85rem] font-bold text-jet-black leading-tight">Um guia rápido para usar o app com clareza e leveza</h1>
            <p className="text-sm leading-relaxed text-on-surface-variant">O MOS! foi pensado para acompanhar rotina, alimentação, treino, água e evolução corporal sem complicar sua vida. Aqui você entende o que cada parte faz e como aproveitar melhor o app no dia a dia.</p>
          </section>

          <section className="mos-info-card space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">Mini manual de uso</h2>
              <p className="text-sm text-on-surface-variant">Um caminho simples para usar o MOS! sem se perder.</p>
            </div>
            <div className="space-y-3">
              ${[
                "Comece pela página Início para ver como está seu dia.",
                "Use Comida para registrar refeições e revisar o que já foi consumido.",
                "Entre em Plano para organizar o cardápio e ajustar as refeições planejadas.",
                "Atualize Água sempre que beber algo para manter a meta visível.",
                "Use Treino para criar sessões e acompanhar cada série com foco.",
                "Revise Minhas medidas de tempos em tempos para acompanhar sua evolução real.",
              ].map(
                (item, index) => html`
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#eef2ff] text-[#4558C8] font-bold flex items-center justify-center shrink-0">${index + 1}</div>
                    <p className="text-sm leading-relaxed text-jet-black">${item}</p>
                  </div>
                `,
              )}
            </div>
          </section>

          <section className="mos-info-card space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">O que cada área faz</h2>
              <p className="text-sm text-on-surface-variant">Assim fica mais fácil entender a linguagem do app.</p>
            </div>
            <div className="space-y-3">
              ${areas.map(
                (area) => html`
                  <div className="mos-info-tile block space-y-1">
                    <h3 className="text-[1rem] font-bold text-jet-black">${area.name}</h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">${area.description}</p>
                  </div>
                `,
              )}
            </div>
          </section>

          <section className="mos-info-card space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">Nos ajude a melhorar</h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">Se algo ficou confuso ou faltou no MOS!, mande por aqui. O feedback fica salvo no app e abre um e-mail pronto para o admin.</p>
            </div>
            ${latestFeedback
              ? html`
                  <div className="rounded-[18px] bg-[#fff6f2] border border-[#f5ddd5] p-4 space-y-3">
                    <div>
                      <p className="text-sm font-bold text-jet-black">Último feedback salvo</p>
                      <p className="text-sm text-on-surface-variant mt-1">${latestFeedback.section} · ${new Date(latestFeedback.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <a
                      className="inline-flex h-10 px-4 items-center justify-center rounded-full bg-white border border-[#f5ddd5] text-sm font-bold text-jet-black"
                      href=${buildFeedbackEmailUrl({
                        section: latestFeedback.section,
                        message: latestFeedback.message,
                        profile: state.profile,
                        auth: state.auth,
                      })}
                    >
                      Abrir e-mail novamente
                    </a>
                  </div>
                `
              : null}
            <button className="w-full h-14 bg-[#EF5F37] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => setModal("feedback")}>
              Enviar feedback
            </button>
          </section>

          <footer className="text-center text-[0.8rem] text-on-surface-variant pt-2">
            © ${new Date().getFullYear()} Projeto pessoal de Nirlandy Pinheiro. <a className="underline underline-offset-4" href="https://nirla.squarespace.com/" target="_blank" rel="noreferrer">nirla.squarespace.com</a>
          </footer>
        </main>
        <${BottomNav} active=${null} onChange=${setScreen} />
      </div>
    `;
  }

  function renderHistory() {
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-32">
        <${TopBar} title="Histórico" leftIcon="arrow_back" centerBold=${false} onLeft=${() => setScreen("plan-config")} onSearch=${() => openSearch("history")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-md mx-auto">
          <section className="mb-5">
            <${ContextNav}
              items=${[
                { label: "Início", onClick: () => setScreen("home") },
                { label: "Plano", onClick: () => setScreen("plan") },
                { label: "Configurar plano", onClick: () => setScreen("plan-config"), primary: true },
              ]}
            />
          </section>
          <div className="grid grid-cols-1 gap-3">
            ${history.map(
              (item) => html`
                <div className="bg-white rounded-xl p-6 flex justify-between items-center">
                  <div>
                    <strong className="block text-[#292B2D]">${item.day}</strong>
                    <p className="text-[0.875rem] text-slate-500 mt-1">${item.meals} refeições</p>
                  </div>
                  <span className="text-lg font-bold text-[#292B2D]">${Math.round(item.calories)} kcal</span>
                </div>
              `,
            )}
          </div>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  function renderAdminNotifications() {
    const recentAdminNotifications = state.appNotifications || [];

    return html`
      <div className="mos-screen text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Notificações"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("home")}
          onSearch=${() => openSearch("home")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="mos-info-card space-y-3">
            <span className="text-sm font-bold text-[#0F172A]/60">Admin MOS!</span>
            <h1 className="text-[1.9rem] font-black text-[#0F172A] leading-tight">Enviar aviso aos usuários</h1>
            <p className="text-sm leading-relaxed text-[#526070]">Página secreta para criar mensagens simples na central de notificações. Para funcionar online, rode o arquivo supabase/app_notifications.sql no Supabase uma vez.</p>
          </section>

          <form
            className="mos-info-card space-y-4"
            onInput=${() => markDraftDirty("admin-notification")}
            onChange=${() => markDraftDirty("admin-notification")}
            onSubmit=${(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              sendAdminNotification(new FormData(form)).then((ok) => {
                if (ok) form.reset();
              });
            }}
          >
            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-2">
                <span className="text-[0.78rem] font-bold text-[#526070]">Título</span>
                <input className="w-full h-14 px-4 rounded-[14px] border border-[rgba(11,16,32,0.08)] bg-white/70 text-[#0F172A]" name="title" placeholder="Ex: Novo ajuste no plano" required />
              </label>
              <label className="space-y-2">
                <span className="text-[0.78rem] font-bold text-[#526070]">Mensagem</span>
                <textarea className="w-full min-h-28 px-4 py-3 rounded-[14px] border border-[rgba(11,16,32,0.08)] bg-white/70 text-[#0F172A] resize-none" name="message" placeholder="Escreva uma mensagem curta para aparecer na central." required></textarea>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="text-[0.78rem] font-bold text-[#526070]">Tipo</span>
                  <input className="w-full h-14 px-4 rounded-[14px] border border-[rgba(11,16,32,0.08)] bg-white/70 text-[#0F172A]" name="type" placeholder="Aviso" defaultValue="Aviso" />
                </label>
                <label className="space-y-2">
                  <span className="text-[0.78rem] font-bold text-[#526070]">Público</span>
                  <select className="w-full h-14 px-4 rounded-[14px] border border-[rgba(11,16,32,0.08)] bg-white/70 text-[#0F172A]" name="audience" defaultValue="all">
                    <option value="all">Todos</option>
                    <option value="email">Um e-mail</option>
                  </select>
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-[0.78rem] font-bold text-[#526070]">E-mail específico</span>
                <input className="w-full h-14 px-4 rounded-[14px] border border-[rgba(11,16,32,0.08)] bg-white/70 text-[#0F172A]" name="targetEmail" type="email" placeholder="Opcional, se o público for um e-mail" />
              </label>
            </div>
            <button className="w-full h-14 rounded-[16px] bg-[#0B1020] text-white font-black transition-transform active:scale-[0.98]" type="submit">
              Enviar notificação
            </button>
          </form>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#0F172A]">Últimas mensagens</h2>
              <span className="text-[0.78rem] font-bold text-[#526070]">${recentAdminNotifications.length}</span>
            </div>
            <div className="space-y-3">
              ${recentAdminNotifications.length
                ? recentAdminNotifications.slice(0, 8).map((item) => html`
                    <article className="mos-info-card py-4 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <strong className="text-[#0F172A]">${item.title}</strong>
                        <span className="text-[0.72rem] font-bold text-[#526070]">${item.tag || "MOS!"}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-[#526070]">${item.body}</p>
                    </article>
                  `)
                : html`<p className="text-sm text-[#526070]">Nenhuma mensagem criada ainda.</p>`}
            </div>
          </section>
        </main>
        <${BottomNav} active=${null} onChange=${setScreen} />
      </div>
    `;
  }

  function renderAppNews() {
    return html`
      <div className="mos-screen text-on-surface min-h-screen pb-24">
        <${TopBar}
          title="Novidades do app"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("home")}
          onSearch=${() => openSearch("home")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-5">
          <section className="bg-white rounded-xl p-6 border border-surface-container-high space-y-2">
            <span className="text-sm text-[#4558C8]">Changelog</span>
            <h1 className="text-[1.8rem] font-bold text-jet-black leading-tight">Registro de atualizações do MOS!</h1>
            <p className="text-sm leading-relaxed text-on-surface-variant">Aqui você acompanha o que foi melhorado no app, com data e descrição das mudanças mais recentes.</p>
          </section>

          <section className="space-y-3">
            ${appNewsEntries.map(
              (entry) => html`
                <article className="bg-white rounded-xl p-5 border border-surface-container-high space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[0.8rem] text-[#4558C8]">${parseDateKey(entry.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                      <h2 className="text-[1.1rem] font-bold text-jet-black">${entry.title}</h2>
                    </div>
                    <div className="w-10 h-10 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0">
                      <${Icon} name="article" className="text-[#4558C8]" />
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant">${entry.description}</p>
                </article>
              `,
            )}
          </section>
        </main>
        <${BottomNav} active=${null} onChange=${setScreen} />
      </div>
    `;
  }

  function renderSearch() {
    const searchBg =
      searchOpenFrom === "food" || searchOpenFrom === "food-detail"
        ? getSectionBackground("food")
        : searchOpenFrom === "water"
          ? getSectionBackground("water")
          : getSectionBackground("plan");
    return html`
      <div className="${searchBg} text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Buscar"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen(searchOpenFrom || "home")}
          onSearch=${() => null}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-5">
          <section className="rounded-xl p-4 flex items-center gap-3 shadow-[0_10px_30px_rgba(41,43,45,0.06)] border border-white/60" style=${{ background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(236,240,255,0.92) 100%)" }}>
            <div className="w-10 h-10 rounded-full bg-[#D9B8F3] flex items-center justify-center shrink-0">
              <${Icon} name="search" className="text-[#292B2D]" />
            </div>
            <input
              className="flex-1 h-12 bg-transparent outline-none text-[1rem] text-jet-black placeholder:text-outline"
              type="search"
              placeholder="Buscar comida, alimento, suplemento..."
              value=${searchQuery}
              onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSearchQuery(value);
              }}
            />
            ${
              searchQuery
                ? html`
                    <button className="h-10 px-4 bg-white/80 rounded-xl text-sm font-bold text-jet-black active:scale-95 transition-transform border border-black/5" onClick=${() => setSearchQuery("")}>
                      Limpar
                    </button>
                  `
                : null
            }
          </section>

          ${
            normalizedSearch
              ? html`
                  <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-lg font-bold text-jet-black">Resultados</h2>
                      <span className="text-[0.75rem] text-outline">${searchResults.length} encontrados</span>
                    </div>
                    ${
                      searchResults.length
                        ? html`
                            <div className="flex flex-col gap-3">
                              ${searchResults.map(
                                (item) => html`
                                  <button className="w-full bg-white rounded-xl p-4 text-left flex items-start gap-4 active:scale-[0.98] transition-transform" onClick=${item.action}>
                                    <div className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                                      <${Icon} name=${item.icon} className="text-[#292B2D]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-4">
                                        <p className="font-bold text-jet-black">${item.title}</p>
                                        <span className="text-[0.6875rem] text-outline whitespace-nowrap">${item.meta}</span>
                                      </div>
                                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">${item.subtitle}</p>
                                    </div>
                                  </button>
                                `,
                              )}
                            </div>
                          `
                        : html`
                            <div className="bg-white rounded-xl p-6 text-center space-y-2">
                              <p className="font-bold text-jet-black">Nenhum resultado encontrado</p>
                              <p className="text-sm text-on-surface-variant">Tente buscar por nome da refeição, alimento ou suplemento.</p>
                            </div>
                          `
                    }
                  </section>
                `
              : html`
                  <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-lg font-bold text-jet-black">Últimas atividades</h2>
                      <span className="text-[0.75rem] text-outline">Recentes</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      ${recentActivities.map(
                        (item) => html`
                          <button className="w-full bg-white rounded-xl p-4 text-left flex items-start gap-4 active:scale-[0.98] transition-transform" onClick=${item.action}>
                            <div className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                              <${Icon} name=${item.icon} className="text-[#292B2D]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-4">
                                <p className="font-bold text-jet-black">${item.title}</p>
                                <span className="text-[0.6875rem] text-outline whitespace-nowrap">${item.meta}</span>
                              </div>
                              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">${item.body}</p>
                            </div>
                          </button>
                        `,
                      )}
                    </div>
                  </section>
                `
          }
        </main>
        <${BottomNav}
          active=${searchOpenFrom === "water" ? "water" : searchOpenFrom === "plan" || searchOpenFrom === "supplements" ? "plan" : null}
          onChange=${setScreen}
        />
      </div>
    `;
  }

  function renderIngredientDetail() {
    if (!selectedFood) return renderFood();
    const ingredientBg = selectedFood.back === "plan-detail" ? getSectionBackground("plan") : getSectionBackground("food");
    return html`
      <div className="${ingredientBg} text-on-surface min-h-screen pb-24">
        <${TopBar} title=${selectedFood.name} leftIcon="arrow_back" centerBold=${false} onLeft=${() => setScreen(selectedFood.back || "food-detail")} onSearch=${() => openSearch("ingredient-detail")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <${ContextNav}
            items=${[
              { label: "Voltar à refeição", onClick: () => setScreen(selectedFood.back || "food-detail"), primary: true },
              { label: "Comida", onClick: () => setScreen("food") },
              { label: "Início", onClick: () => setScreen("home") },
            ]}
          />
          <section className="space-y-2">
            <span className="text-[0.6875rem] font-medium text-outline">Alimento</span>
            <h1 className="text-[1.9rem] font-bold text-jet-black">${selectedFood.name}</h1>
          </section>
          <section className="mos-card rounded-2xl p-6 grid grid-cols-2 gap-4">
            <div><span className="text-[0.6875rem] text-outline block">Calorias</span><strong className="text-2xl text-jet-black">${selectedFood.calories} kcal</strong></div>
            <div><span className="text-[0.6875rem] text-outline block">Carbo</span><strong className="text-2xl text-jet-black">${selectedFood.carbs} g</strong></div>
            <div><span className="text-[0.6875rem] text-outline block">Proteínas</span><strong className="text-2xl text-jet-black">${selectedFood.protein} g</strong></div>
            <div><span className="text-[0.6875rem] text-outline block">Gorduras</span><strong className="text-2xl text-jet-black">${selectedFood.fat} g</strong></div>
          </section>
          <section className="mos-card rounded-2xl p-6 space-y-2">
            <h3 className="text-base font-bold text-jet-black">Benefícios</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">${selectedFood.benefit}</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">Ajuda o corpo e a meta do usuário quando encaixado com consistência, porção adequada e regularidade no plano.</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">Orientação de consumo: use dentro da refeição planejada e ajuste a quantidade conforme sua meta calórica do dia.</p>
          </section>
          <section className="mos-card rounded-2xl p-6 space-y-2">
            <h3 className="text-base font-bold text-jet-black">Fonte</h3>
            <p className="text-sm text-on-surface-variant">TACO</p>
            <p className="text-sm text-on-surface-variant">Ministério da Saúde</p>
          </section>
        </main>
        <${BottomNav} active="food" onChange=${setScreen} />
      </div>
    `;
  }

  function renderRegisterSupplement() {
    const supplementDirty = isDraftDirty("register-supplement");
    const guardSupplementNavigation = (action) =>
      confirmDiscard(action, "Deseja cancelar a edição? As alterações do suplemento ainda não foram salvas.");
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Registrar suplemento"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => guardSupplementNavigation(() => setScreen("supplements"))}
          onSearch=${() => openSearch("register-supplement")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto">
          <section className="bg-white rounded-xl p-8 flex flex-col gap-6">
            <${ContextNav}
              items=${[
                { label: "Suplementos", onClick: () => guardSupplementNavigation(() => setScreen("supplements")), primary: true },
                { label: "Plano", onClick: () => guardSupplementNavigation(() => setScreen("plan")) },
                { label: "Início", onClick: () => guardSupplementNavigation(() => setScreen("home")) },
              ]}
            />
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("register-supplement")}
              onChange=${() => markDraftDirty("register-supplement")}
              onSubmit=${(e) => {
                e.preventDefault();
                createSupplement(new FormData(e.currentTarget));
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Nome</label>
                <input className="w-full h-14 px-5 bg-white border border-outline-variant rounded-xl text-jet-black" name="name" placeholder="Ex: Creatina" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Dose</label>
                <input className="w-full h-14 px-5 bg-white border border-outline-variant rounded-xl text-jet-black" name="dosage" placeholder="Ex: 5g" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-medium text-jet-black">Categoria</label>
                  <input className="w-full h-14 px-5 bg-white border border-outline-variant rounded-xl text-jet-black" name="category" placeholder="Ex: Performance" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-medium text-jet-black">Horário</label>
                  <input className="w-full h-14 px-5 bg-white border border-outline-variant rounded-xl text-jet-black" name="time" type="time" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Instrução</label>
                <textarea className="w-full min-h-32 px-5 py-4 bg-white border border-outline-variant rounded-xl text-jet-black resize-none" name="instruction" placeholder="Descreva o uso do suplemento" required></textarea>
              </div>
              <button className=${getPrimaryActionClass(!supplementDirty)} type="submit" disabled=${!supplementDirty}>Registrar</button>
              <button className=${getSecondaryActionClass(false)} type="button" onClick=${() => guardSupplementNavigation(() => setScreen("supplements"))}>Cancelar</button>
            </form>
          </section>
        </main>
        <${BottomNav} active="plan" onChange=${(nextScreen) => guardSupplementNavigation(() => setScreen(nextScreen))} />
      </div>
    `;
  }

  function renderSupplementDetail() {
    return renderSupplements();
  }

  const shouldRenderResetPassword = authReady && passwordRecoveryReady;

  return html`
    <div>
      <style>
        body {
          background: #ebf5f2;
        }
        .text-jet-black { color: #0F172A; }
        .text-on-surface { color: #0F172A; }
        .text-on-surface-variant { color: #334155; }
        .text-outline { color: #475569; }
        section.bg-white:not([class*="shadow"]),
        div.bg-white:not([class*="shadow"]) {
          border: 1px solid #e2e8f0;
          box-shadow: none;
          border-radius: 20px;
        }
        nav.fixed.bottom-0 {
          background: transparent;
          box-shadow: none;
        }
        nav.fixed.bottom-0 button {
          color: #f5f5f5;
        }
        nav.fixed.bottom-0 button.bottom-nav-active,
        nav.fixed.bottom-0 button.bottom-nav-active:hover,
        nav.fixed.bottom-0 button:not(.bottom-nav-active):hover {
          color: #0F172A;
        }
        nav.fixed.bottom-0 button .material-symbols-outlined {
          color: inherit;
        }
      </style>
      ${appRoute === "landing" && renderLanding()}
      ${appRoute === "app" && !authReady &&
      html`
        <div className="min-h-screen bg-white text-[#111] flex items-center justify-center px-6">
          <div className="max-w-sm w-full space-y-4 text-center">
            <${AuthWordmark} />
            <p className="text-[1rem] text-[#6e7178]">Preparando autenticação do MOS!...</p>
          </div>
        </div>
      `}
      ${appRoute === "app" && shouldRenderResetPassword && renderResetPassword()}
      ${appRoute === "app" && authReady && !isSignedIn && screen === "welcome" && renderWelcome()}
      ${appRoute === "app" && !shouldRenderResetPassword && authReady && !isSignedIn && screen === "signup" && renderSignup()}
      ${appRoute === "app" && !shouldRenderResetPassword && authReady && !isSignedIn && screen === "login" && renderLogin()}
      ${appRoute === "app" && !shouldRenderResetPassword && authReady && !isSignedIn && screen === "recover-password" && renderRecoverPassword()}
      ${appRoute === "app" && !shouldRenderResetPassword && authReady && !isSignedIn && screen === "reset-password" && renderResetPassword()}
      ${appRoute === "app" && !shouldRenderResetPassword && authReady && !isSignedIn && screen === "legal" && renderLegal()}

      ${appRoute === "app" &&
      !shouldRenderResetPassword &&
      authReady &&
      isSignedIn &&
      html`
        ${desktopAccountMenuOpen ? html`<button className="mos-desktop-menu-backdrop" onClick=${() => setDesktopAccountMenuOpen(false)} aria-label="Fechar menu da conta"></button>` : null}
        <div className="mos-desktop-shell">
          <${DesktopSidebar}
            active=${screen}
            onChange=${setScreen}
            onOpenProfile=${() => setScreen("profile")}
            onOpenMeasures=${() => setScreen("measures")}
            onOpenSettings=${openDesktopSettings}
            onOpenAbout=${() => setScreen("about-app")}
            onOpenAdminNotifications=${() => setScreen("admin-notifications")}
            onSignOut=${() => openMenuItem("Sair")}
            isAdmin=${isAdminUser}
          />
          <${DesktopRightRail}
            onSearch=${openDesktopSearch}
            onOpenNotifications=${openNotifications}
            notificationCount=${notifications.length}
            avatarLabel=${profileInitial}
            accountMenuOpen=${desktopAccountMenuOpen}
            onToggleAccountMenu=${() => setDesktopAccountMenuOpen((current) => !current)}
            onCloseAccountMenu=${() => setDesktopAccountMenuOpen(false)}
            onOpenProfile=${() => setScreen("profile")}
            onOpenMeasures=${() => setScreen("measures")}
            onOpenSettings=${openDesktopSettings}
            onSignOut=${() => openMenuItem("Sair")}
            caloriesConsumed=${summary.calories}
            calorieTarget=${state.profile.calorieTarget}
            waterConsumedMl=${state.water[todayKey] ?? 0}
            waterTargetMl=${Number(state.profile.waterTargetMl) || 3000}
            trainingDone=${trainingDoneToday}
            onOpenFood=${() => setScreen("food")}
            onOpenWater=${() => setScreen("water")}
            onOpenTraining=${() => setScreen("training")}
          />
          <div className="mos-desktop-main">
            ${renderSignedInScreen()}
          </div>
        </div>
        ${desktopSearchOpen ? html`<button className="mos-desktop-search-backdrop" onClick=${closeDesktopSearch} aria-label="Fechar busca"></button>` : null}
        ${desktopSearchOpen
          ? html`<${DesktopSearchPanel}
              query=${searchQuery}
              results=${normalizedSearch ? searchResults : searchableItems.slice(0, 8)}
              onQueryChange=${setSearchQuery}
              onClose=${closeDesktopSearch}
              onPick=${handleDesktopSearchPick}
            />`
          : null}
      `}

      ${appRoute === "app" && authReady && isSignedIn && drawerOpen && html`<${MenuDrawer} onClose=${() => setDrawerOpen(false)} onSelect=${openMenuItem} isAdmin=${isAdminUser} />`}
      ${appRoute === "app" && authReady && isSignedIn && notificationsOpen && html`<${NotificationsPanel} items=${notifications} onClose=${() => setNotificationsOpen(false)} onOpen=${openNotificationItem} onClear=${clearNotifications} />`}
      ${
        authReady &&
        isSignedIn &&
        authNotice &&
        html`
          <div className="fixed top-20 left-0 w-full px-4 z-[70] pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto bg-[#fff6f2] border border-[#f5ddd5] rounded-[10px] px-4 py-3 shadow-[0_14px_30px_rgba(41,43,45,0.08)] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffe6dc] flex items-center justify-center shrink-0">
                <${Icon} name="info" className="text-[#EF5F37] text-[1rem]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-[#292B2D]">${authNotice}</p>
              </div>
              <button className="shrink-0 active:scale-95 transition-transform" onClick=${clearAuthNotice}>
                <${Icon} name="close" className="text-[#292B2D]/60 text-[1.15rem]" />
              </button>
            </div>
          </div>
        `
      }
      ${
        isSignedIn &&
        foodCalendarOpen &&
        html`<${FoodCalendarPanel}
          selectedDate=${foodDate}
          monthDate=${foodCalendarMonth}
          markedDates=${markedFoodDates}
          todayKey=${todayKey}
          onClose=${() => setFoodCalendarOpen(false)}
          onPickDate=${pickFoodDate}
          onGoToday=${goToTodayFood}
          onPrevMonth=${() => setFoodCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          onNextMonth=${() => setFoodCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
        />`
      }

      ${
        isSignedIn &&
        waterHistoryOpen &&
        html`<${WaterHistoryPanel}
          selectedDate=${waterHistoryDate}
          monthDate=${waterHistoryMonth}
          markedDates=${markedWaterDates}
          todayKey=${todayKey}
          onClose=${() => setWaterHistoryOpen(false)}
          onPickDate=${pickWaterHistoryDate}
          onGoToday=${goToTodayWaterHistory}
          onPrevMonth=${() => setWaterHistoryMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          onNextMonth=${() => setWaterHistoryMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
        />`
      }

      ${
        isSignedIn &&
        modal === "training-pause" &&
        html`
          <${Modal} title="Pausa" onClose=${resumeTraining}>
            <div className="flex flex-col gap-5">
              <div className="rounded-[10px] bg-white p-6 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4ef]">
                  <${Icon} name="pause" className="text-[1.5rem] text-[#EF5F37]" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-jet-black">Treino pausado</p>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    O treino está pausado há ${formatClock(pausedTrainingSeconds)}.
                  </p>
                </div>
              </div>
              <button className=${getPrimaryActionClass(false)} onClick=${resumeTraining}>
                Continuar
              </button>
              <button
                className="h-14 w-full rounded-[10px] border border-outline-variant bg-white px-4 text-base font-bold text-error active:scale-[0.98] transition-transform"
                onClick=${abandonTraining}
              >
                Encerrar treino
              </button>
            </div>
          </${Modal}>
        `
      }

      ${
        isSignedIn &&
        modal === "training-finish-confirm" &&
        html`
          <${Modal} title="Concluir treino de hoje" onClose=${() => setModal(null)}>
            <div className="flex flex-col gap-5">
              <div className="rounded-[10px] bg-white p-6 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4ef]">
                  <${Icon} name="check" className="text-[1.5rem] text-[#EF5F37]" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-jet-black">Deseja concluir o treino de hoje?</p>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    Ao confirmar, você verá o resumo desta sessão e poderá voltar para os treinos depois.
                  </p>
                </div>
              </div>
              <button className=${getSecondaryActionClass(false)} onClick=${() => setModal(null)}>
                Voltar
              </button>
              <button className=${getPrimaryActionClass(false)} onClick=${() => completeTrainingSession(activeTraining)}>
                Concluir treino de hoje
              </button>
            </div>
          </${Modal}>
        `
      }

      ${
        isSignedIn &&
        modal === "food" &&
        html`
          <${Modal}
            title="Registrar Comida"
            onClose=${() => confirmDiscard(() => {
              clearDraft("modal-food");
              setModal(null);
            }, "Deseja cancelar a edição? As alterações desta refeição não foram salvas.")}
          >
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("modal-food")}
              onChange=${() => markDraftDirty("modal-food")}
              onSubmit=${(e) => {
                e.preventDefault();
                registerMeal(new FormData(e.currentTarget));
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Nome da Refeição</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-royal-blue placeholder:text-outline/50 text-jet-black font-medium transition-all" name="mealName" placeholder="Ex: Almoço de Domingo" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Descrição / Detalhes</label>
                <textarea className="w-full p-6 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-royal-blue placeholder:text-outline/50 text-jet-black font-medium transition-all resize-none" name="description" rows="4" placeholder="O que você comeu hoje?"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-old-flax/20 p-4 rounded-lg flex items-center gap-3">
                  <${Icon} name="restaurant" className="text-jet-black" />
                  <div className="flex flex-col">
                    <span className="text-[0.6875rem] font-bold text-jet-black/60">Categoria</span>
                    <span className="text-sm font-bold text-jet-black">Proteína Alta</span>
                  </div>
                </div>
                <div className="bg-royal-blue/10 p-4 rounded-lg flex items-center gap-3">
                  <${Icon} name="schedule" className="text-royal-blue" />
                  <div className="flex flex-col">
                    <span className="text-[0.6875rem] font-bold text-royal-blue/60">Horário</span>
                    <span className="text-sm font-bold text-jet-black">12:30 PM</span>
                  </div>
                </div>
              </div>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
                  isDraftDirty("modal-food") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-food")}
              >
                <span>Registrar</span>
                <${Icon} name="check_circle" />
              </button>
            </form>
          </${Modal}>
        `
      }

      ${
        modal === "plan" &&
        html`
          <${Modal}
            title="Nova refeição"
            onClose=${() => confirmDiscard(() => {
              clearDraft("modal-plan");
              setModal(null);
            }, "Deseja cancelar a edição? As alterações desta refeição do plano não foram salvas.")}
          >
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("modal-plan")}
              onChange=${() => markDraftDirty("modal-plan")}
              onSubmit=${(e) => {
                e.preventDefault();
                createPlanMeal(new FormData(e.currentTarget));
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Nome da Refeição</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-royal-blue placeholder:text-outline/50 text-jet-black font-medium transition-all" name="mealName" placeholder="Ex: Ceia leve" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Horário planejado</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-royal-blue text-jet-black font-medium transition-all" name="time" type="time" defaultValue="12:30" />
              </div>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("modal-plan") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-plan")}
              >
                Registrar
              </button>
            </form>
          </${Modal}>
        `
      }

      ${
        modal === "water" &&
        html`
          <${Modal}
            title="Registrar água"
            onClose=${() => confirmDiscard(() => {
              clearDraft("modal-water");
              setModal(null);
            }, "Deseja cancelar a edição? As alterações do registro de água não foram salvas.")}
          >
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("modal-water")}
              onChange=${() => markDraftDirty("modal-water")}
              onSubmit=${(e) => {
                e.preventDefault();
                registerWater(new FormData(e.currentTarget));
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-[0.6875rem] font-medium text-jet-black">Quantidade de água</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-royal-blue placeholder:text-outline/50 text-jet-black font-medium transition-all" name="amount" type="number" min="1" step="1" inputMode="numeric" placeholder="Ex: 250 ml" required />
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">Digite quantos ml você bebeu. Ao registrar, o valor será somado ao total do dia.</p>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("modal-water") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-water")}
              >
                Registrar
              </button>
            </form>
          </${Modal}>
        `
      }

      ${
        modal === "measures" &&
        html`
          <${Modal}
            title="Editar meus dados"
            onClose=${() => confirmDiscard(() => {
              clearDraft("modal-measures");
              setModal(null);
            }, "Deseja cancelar a edição? As alterações das suas medidas ainda não foram salvas.")}
          >
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("modal-measures")}
              onChange=${() => markDraftDirty("modal-measures")}
              onSubmit=${(e) => {
                e.preventDefault();
                saveMeasures(new FormData(e.currentTarget));
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Data da atualização</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="date" type="date" defaultValue=${latestMeasure.date || todayKey} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Peso</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="weight" type="number" step="0.1" defaultValue=${latestMeasure.weight} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Altura (cm)</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="height" type="number" step="0.1" defaultValue=${latestMeasure.height} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Gordura corporal (%)</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="bodyFat" type="number" step="0.1" defaultValue=${latestMeasure.bodyFat} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Massa muscular (kg)</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="muscleMass" type="number" step="0.1" defaultValue=${latestMeasure.muscleMass} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Água corporal (kg)</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="bodyWater" type="number" step="0.1" defaultValue=${latestMeasure.bodyWater} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Idade metabólica</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="metabolicAge" type="number" step="1" defaultValue=${latestMeasure.metabolicAge} required />
                </div>
              </div>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("modal-measures") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-measures")}
              >
                Salvar dados
              </button>
            </form>
          </${Modal}>
        `
      }

      ${
        modal === "profile" &&
        html`
          <${Modal}
            title="Editar perfil"
            onClose=${() => confirmDiscard(() => {
              clearDraft("modal-profile");
              setModal(null);
            }, "Deseja cancelar a edição? As alterações do seu perfil ainda não foram salvas.")}
          >
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("modal-profile")}
              onChange=${() => markDraftDirty("modal-profile")}
              onSubmit=${(e) => {
                e.preventDefault();
                saveProfile(new FormData(e.currentTarget));
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Nome</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="name" defaultValue=${state.profile.name || ""} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Email</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="email" type="email" defaultValue=${state.profile.email || ""} placeholder="voce@email.com" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Cidade</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="city" defaultValue=${state.profile.city || ""} placeholder="Sua cidade" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Aniversário</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="birthday" type="date" defaultValue=${state.profile.birthday || ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Meta calórica</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="calorieTarget" type="number" min="1" step="1" defaultValue=${state.profile.calorieTarget || 2400} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Meta de água (ml)</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="waterTargetMl" type="number" min="1" step="1" defaultValue=${state.profile.waterTargetMl || 3000} />
                </div>
              </div>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("modal-profile") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-profile")}
              >
                Salvar
              </button>
            </form>
          </${Modal}>
        `
      }

      ${
        modal === "edit-supplement" &&
        html`
          <${Modal}
            title="Editar suplemento"
            onClose=${() => confirmDiscard(() => {
              clearDraft("modal-edit-supplement");
              setModal(null);
            }, "Deseja cancelar a edição? As alterações deste suplemento não foram salvas.")}
          >
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("modal-edit-supplement")}
              onChange=${() => markDraftDirty("modal-edit-supplement")}
              onSubmit=${(e) => {
                e.preventDefault();
                saveSupplement(new FormData(e.currentTarget));
              }}
            >
              <input type="hidden" name="id" value=${selectedSupplementId || ""} />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Nome</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="name" defaultValue=${state.supplements.find((item) => item.id === selectedSupplementId)?.name || ""} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Categoria</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="category" defaultValue=${state.supplements.find((item) => item.id === selectedSupplementId)?.category || ""} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-jet-black">Horário</label>
                  <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="time" type="time" defaultValue=${state.supplements.find((item) => item.id === selectedSupplementId)?.time || ""} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Quantidade</label>
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="dosage" defaultValue=${state.supplements.find((item) => item.id === selectedSupplementId)?.dosage || ""} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Descrição</label>
                <textarea className="w-full min-h-32 px-6 py-4 bg-surface-container-low border-0 rounded-lg text-jet-black resize-none" name="instruction" required>${state.supplements.find((item) => item.id === selectedSupplementId)?.instruction || ""}</textarea>
              </div>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("modal-edit-supplement") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-edit-supplement")}
              >
                Salvar
              </button>
            </form>
          </${Modal}>
        `
      }

      ${
        modal === "feedback" &&
        html`
          <${Modal}
            title="Enviar feedback"
            onClose=${() => confirmDiscard(() => {
              clearDraft("modal-feedback");
              setModal(null);
            }, "Deseja cancelar a edição? O seu feedback ainda não foi enviado.")}
          >
            <form
              className="flex flex-col gap-6"
              onInput=${() => markDraftDirty("modal-feedback")}
              onChange=${() => markDraftDirty("modal-feedback")}
              onSubmit=${(e) => {
                e.preventDefault();
                saveFeedback(new FormData(e.currentTarget));
              }}
            >
              <div className="rounded-[18px] bg-[#F2F8EE] border border-[#dfe9df] p-4 space-y-1">
                <p className="text-sm font-bold text-jet-black">Como isso chega até mim</p>
                <p className="text-sm leading-relaxed text-on-surface-variant">O MOS! salva sua mensagem e abre um e-mail pronto. Depois é só confirmar o envio.</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Área do app</label>
                <select className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg text-jet-black" name="section" defaultValue="Geral">
                  <option>Geral</option>
                  <option>Início</option>
                  <option>Comida</option>
                  <option>Plano</option>
                  <option>Água</option>
                  <option>Minhas medidas</option>
                  <option>Suplementos</option>
                  <option>Busca</option>
                  <option>Notificações</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">O que você quer contar?</label>
                <textarea className="w-full min-h-36 px-6 py-5 bg-surface-container-low border-0 rounded-lg resize-none text-jet-black" name="message" placeholder="Conte o que não ficou claro, o que falhou ou o que podemos melhorar." required></textarea>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                O e-mail será enviado para ${MOS_FEEDBACK_EMAIL}. Se o app de e-mail não abrir, use o botão “Abrir e-mail novamente” em Sobre o app.
              </p>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("modal-feedback") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-feedback")}
              >
                Salvar e abrir e-mail
              </button>
            </form>
          </${Modal}>
        `
      }

      ${
        substituteFood &&
        html`
          <${Modal} title=${`Substituir ${substituteFood.name}`} onClose=${() => setSubstituteFood(null)}>
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-on-surface-variant">Estas opções servem como equivalentes para o dia. Elas aparecem só como sugestão e não trocam automaticamente o ingrediente do plano.</p>
              <div className="bg-white rounded-xl divide-y divide-surface-container-high border border-surface-container-high">
                ${getEquivalentFoods(substituteFood).map(
                  (option) => {
                    const accent = getFoodAccent(option);
                    return html`
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style=${{ backgroundColor: accent.soft }}>
                          <${Icon} name=${accent.icon} className="text-jet-black" />
                        </div>
                        <div>
                          <p className="font-bold text-jet-black">${option}</p>
                          <p className="text-sm text-on-surface-variant">Pode substituir ${substituteFood.name} mantendo o plano mais flexível.</p>
                        </div>
                      </div>
                    `;
                  },
                )}
              </div>
            </div>
          </${Modal}>
        `
      }

      ${
        confirmAction &&
        html`
          <${Modal} title=${confirmAction.title || "Confirmar"} onClose=${() => setConfirmAction(null)}>
            <div className="flex flex-col gap-5">
              <p className="text-sm leading-relaxed text-on-surface-variant">${confirmAction.message || "Tem certeza que deseja apagar este item?"}</p>
              <button type="button" className="w-full h-14 bg-[#EF5F37] text-white rounded-[10px] font-bold" onClick=${handleConfirmAction}>
                ${confirmAction.confirmLabel || "Confirmar"}
              </button>
            </div>
          </${Modal}>
        `
      }

      ${
        editor &&
        html`
          <${Modal}
            title=${editor.food ? "Editar alimento" : "Adicionar alimento"}
            onClose=${() => confirmDiscard(() => {
              clearDraft("editor-food");
              setEditor(null);
            }, "Deseja cancelar a edição? As alterações deste alimento não foram salvas.")}
          >
            <form
              className="flex flex-col gap-4"
              onInput=${() => markDraftDirty("editor-food")}
              onChange=${() => markDraftDirty("editor-food")}
              onSubmit=${(e) => {
                e.preventDefault();
                saveFood(new FormData(e.currentTarget));
              }}
            >
              <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg" name="name" placeholder="Nome" defaultValue=${editor.food?.name || ""} required />
              <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg" name="quantity" placeholder="Quantidade" defaultValue=${editor.food?.quantity || ""} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg" name="calories" type="number" placeholder="Kcal" defaultValue=${editor.food?.calories || ""} required />
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg" name="protein" type="number" placeholder="Proteína" defaultValue=${editor.food?.protein || ""} required />
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg" name="carbs" type="number" placeholder="Carbo" defaultValue=${editor.food?.carbs || ""} required />
                <input className="w-full h-14 px-6 bg-surface-container-low border-0 rounded-lg" name="fat" type="number" placeholder="Gordura" defaultValue=${editor.food?.fat || ""} required />
              </div>
              <textarea className="w-full p-6 bg-surface-container-low border-0 rounded-lg resize-none" name="benefit" rows="4" placeholder="Benefício">${editor.food?.benefit || ""}</textarea>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("editor-food") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("editor-food")}
              >
                Registrar
              </button>
            </form>
          </${Modal}>
        `
      }
    </div>
  `;
}

createRoot(document.getElementById("app")).render(html`<${App} />`);
