import React, { useEffect, useMemo, useRef, useState } from "https://esm.sh/react@18";
import { createRoot } from "https://esm.sh/react-dom@18/client";
import htm from "https://esm.sh/htm@3";
import {
  createConsumedMealEntry,
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

const html = htm.bind(React.createElement);

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

const STORAGE_KEY = "mos-stitch-faithful";
const FORCE_LOGIN_KEY = "mos-force-login";

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
    registered: false,
    signedIn: false,
    email: "",
    password: "",
  },
  profile: {
    calorieTarget: 2400,
    waterTargetMl: 3000,
    activeGoal: "Plano atual: Perder 5kg",
    planFocus: "Déficit calórico com mais constância",
    planNotes: "Monte refeições simples, sustentáveis e fáceis de repetir ao longo da semana.",
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
  consumedMeals: {},
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
  water: {},
  waterHistory: {},
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

function getSectionBackground(section = "home") {
  if (["food", "food-detail"].includes(section)) return "bg-[#faf3f2]";
  if (["plan", "plan-detail", "plan-config", "supplements", "supplement-detail", "register-supplement", "history"].includes(section)) return "bg-[#e9ecfa]";
  if (section === "water") return "bg-surface";
  return "bg-surface";
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
    measureEntries: Array.isArray(raw.measureEntries)
      ? raw.measureEntries.map((entry, index) => normalizeMeasureEntry(entry, index))
      : defaultState.measureEntries,
    consumedMeals: raw.consumedMeals || raw.foodLog || {},
    planMeals: Array.isArray(raw.planMeals || raw.mealPlan) ? (raw.planMeals || raw.mealPlan).map((meal, index) => normalizeMeal(meal, index)) : defaultState.planMeals,
    supplements: Array.isArray(raw.supplements) ? raw.supplements.map((item, index) => normalizeSupplement(item, index)) : defaultState.supplements,
    water: raw.water || {},
    waterHistory: raw.waterHistory || {},
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

function TopBar({ title = "MOS", leftIcon = "menu", onLeft, onSearch, onRight, centerBold = true, rightSlot = null }) {
  return html`
    <header className="fixed top-0 w-full z-50 bg-white">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-screen-xl mx-auto">
        <button type="button" className="hover:opacity-80 transition-opacity active:scale-95" onClick=${onLeft}>
          <${Icon} name=${leftIcon} className="text-[#292B2D]" />
        </button>
        <h1 className=${centerBold ? "text-xl font-black text-[#292B2D]" : "font-bold text-base text-[#292B2D]"}>${title}</h1>
        ${
          rightSlot ||
          html`<div className="flex items-center gap-4">
            <button type="button" className="hover:opacity-80 transition-opacity active:scale-95" onClick=${onSearch}>
              <${Icon} name="search" className="text-[#292B2D]" />
            </button>
            <button type="button" className="hover:opacity-80 transition-opacity active:scale-95" onClick=${onRight}>
              <${Icon} name="notifications" className="text-[#292B2D]" />
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
            <h2 className="text-[1.5rem] font-bold text-jet-black">Notificações</h2>
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

function MenuDrawer({ onClose, onSelect }) {
  const items = [
    { label: "Início", icon: "home" },
    { label: "Configurar plano", icon: "settings" },
    { label: "Meu perfil", icon: "person" },
    { label: "Minhas Medidas", icon: "straighten" },
    { label: "Sobre o App", icon: "info" },
    { label: "Sair", icon: "logout" },
  ];
  return html`
    <div className="fixed inset-0 z-[70] bg-black/30" onClick=${onClose}>
      <aside className="w-[82%] max-w-sm h-full bg-white p-6 flex flex-col gap-6" onClick=${(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[0.6875rem] font-medium text-royal-blue">MOS</span>
            <h2 className="text-[1.75rem] font-bold text-jet-black">Menu</h2>
          </div>
          <button type="button" className="hover:opacity-80 transition-opacity active:scale-95" onClick=${onClose}>
            <${Icon} name="close" className="text-[#292B2D]" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          ${items.map(
            (item) => html`
              <button type="button" className="w-full rounded-xl px-4 py-3 text-left font-medium text-jet-black active:scale-[0.98] transition-transform flex items-center gap-4 hover:bg-surface-container-low" onClick=${() => onSelect(item.label)}>
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                  <${Icon} name=${item.icon} className="text-[#292B2D]" />
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
    { key: "plan", label: "Plano", icon: "description" },
    { key: "water", label: "Água", icon: "water_drop" },
  ];

  return html`
    <nav className="fixed bottom-0 left-0 w-full px-4 pb-4 bg-white/96 backdrop-blur-sm z-50">
      <div className="max-w-md mx-auto w-full h-20 flex justify-around items-center">
        ${items.map((item) => {
          const isActive = active === item.key;
          return html`
            <button
              className=${`flex flex-col items-center justify-center ${isActive ? "bg-[#DFF37D] text-[#292B2D] rounded-full px-5 py-2 shadow-[0_8px_18px_rgba(223,243,125,0.35)]" : "text-[#292B2D] px-5 py-2 hover:bg-slate-100 rounded-full"} transition-all active:scale-98`}
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
    <nav className="fixed bottom-0 left-0 w-full px-4 pb-4 bg-white z-50">
      <div className="max-w-screen-md mx-auto grid grid-cols-4 gap-2 rounded-[10px] bg-white border border-black/5 p-2 shadow-[0_8px_24px_rgba(41,43,45,0.08)]">
        ${items.map(
          (item) => html`
            <button
              className=${`min-h-[76px] rounded-[10px] flex flex-col items-center justify-center gap-2 text-center active:scale-95 transition-transform ${item.active ? "bg-[#EF5F37] text-white" : "bg-surface-container-low text-[#292B2D]"}`}
              onClick=${item.onClick}
            >
              <${Icon} name=${item.icon} className="text-[1.2rem]" />
              <span className="text-[0.76rem] font-bold">${item.label}</span>
            </button>
          `,
        )}
      </div>
    </nav>
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
  return html`<div className="text-[1.6rem] font-black text-[#111]">MOS</div>`;
}

function App() {
  const [state, setState] = useState(loadState);
  const [screen, setScreen] = useState(() => (shouldOpenLoginAfterReload() ? "login" : loadState().auth?.signedIn ? "home" : "welcome"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
    const hasOverlayOpen = drawerOpen || notificationsOpen || foodCalendarOpen || waterHistoryOpen || Boolean(modal) || Boolean(editor) || Boolean(substituteFood) || Boolean(confirmAction);
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

  const todayKey = getTodayKey();
  const date = todayKey;
  const consumedMeals = state.consumedMeals[todayKey] || [];


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let active = true;
    if (!authConfigured) {
      setAuthReady(true);
      return () => {
        active = false;
      };
    }

    (async () => {
      const result = await getCurrentAuthState();
      if (!active) return;

      if (result.error) {
        showAuthNotice("Não foi possível verificar sua sessão agora. Revise a configuração do Supabase.");
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
          "Seu link de recuperação foi validado. Agora defina uma nova senha para voltar a entrar no MOS.",
          { tone: "info", title: "Criar nova senha" },
        );
      }
    });

    return unsubscribe;
  }, [authConfigured]);

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
  const selectedPlan = state.planMeals.find((meal) => meal.id === selectedPlanId);
  const selectedConsumed = foodMeals.find((meal) => meal.id === selectedConsumedId);
  const foodDateLabel = foodDate === todayKey ? "Hoje" : formatDateLabel(foodDate);
  const markedFoodDates = new Set(Object.entries(state.consumedMeals).filter(([, meals]) => Array.isArray(meals) && meals.length).map(([key]) => key));
  const markedWaterDates = new Set(Object.entries(state.waterHistory || {}).filter(([, entries]) => Array.isArray(entries) && entries.length).map(([key]) => key));
  const waterViewDateLabel = waterHistoryDate === todayKey ? "Hoje" : formatDateLabel(waterHistoryDate);
  const isSignedIn = !["welcome", "signup", "login", "recover-password", "reset-password", "legal"].includes(screen);
  const notifications = notificationsCleared
    ? []
    : [
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
      body: "Atualize peso e medidas para o MOS calcular seu progresso com mais precisão.",
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
  const currentDayMeals = state.consumedMeals[date] || [];
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

    if (!name || !email || !password || !confirmPassword || !signupForm.acceptedTerms || !age || !weight || !height) return;
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
          `Enviamos um link de confirmação para ${email}. Abra seu e-mail e confirme a conta antes de entrar no MOS. Se não encontrar a mensagem, verifique a pasta de spam ou promoções.`,
          { tone: "info", title: "Confirme seu e-mail" }
        );
        setScreen("login");
      } else {
        const hydrated = await getCurrentAuthState();
        if (hydrated.session && hydrated.user) {
          applyHydratedAuthState(hydrated, email);
        }
        clearAuthNotice();
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
      setScreen("home");
      return;
    }

    showAuthNotice(getSupabaseSetupMessage(), {
      tone: "error",
      title: "Autenticação indisponível",
    });
    return;
OLD = nil
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
      time: "12:30",
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

  function renderHome() {
    const currentMeals = state.consumedMeals[date] || [];
    const recentMeal = currentMeals[1] || currentMeals[0];
    const recentWaterEntry = waterEntries[0] || null;
    const formattedConsumed = Math.round(summary.calories).toLocaleString("pt-BR");
    const formattedRemaining = Math.max(0, Math.round(remaining)).toLocaleString("pt-BR");
    const formattedTarget = Math.round(state.profile.calorieTarget).toLocaleString("pt-BR");
    return html`
      <div className="min-h-screen pb-32 bg-[#E2F1F5]">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("home")} onRight=${openNotifications} />
        <main className="pt-24 px-6 max-w-md mx-auto" style=${{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style=${{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <section className="bg-white rounded-xl p-7 space-y-6 shadow-[0_14px_30px_rgba(41,43,45,0.05)] border border-white/80">
              <div className="flex items-center gap-3">
                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#b9ddd3]"></span>
                <span className="text-[1rem] font-semibold text-jet-black">Resumo calórico</span>
              </div>
              <div className="flex items-end gap-4 text-left pr-2">
                <span className="text-[3.6rem] font-black leading-none text-jet-black">${formattedRemaining}</span>
                <span className="text-[1rem] font-[300] leading-none text-[#8d8d8d] pb-2 whitespace-nowrap">Restante</span>
              </div>
              <div className="w-full space-y-5">
                <div className="h-4 w-full bg-[#d8eee7] rounded-full overflow-hidden">
                  <div className="h-full bg-[#b9ddd3]" style=${{ width: `${progress}%` }}></div>
                </div>
                <div className="flex flex-wrap items-center gap-x-10 gap-y-3 w-full">
                  <div className="flex items-baseline gap-3 whitespace-nowrap">
                    <span className="text-[1.55rem] font-bold text-jet-black">${formattedConsumed}</span>
                    <span className="text-[1.05rem] font-[300] text-[#8d8d8d]">Comido</span>
                  </div>
                  <div className="flex items-baseline gap-3 whitespace-nowrap">
                    <span className="text-[1.55rem] font-bold text-jet-black">${formattedTarget}</span>
                    <span className="text-[1.05rem] font-[300] text-[#8d8d8d]">Meta de consumo</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-3" style=${{ gap: "8px" }}>
              ${[
                { label: "Proteína", value: `${Math.round(summary.protein)}`, unit: "g", color: "bg-royal-blue", bar: "75%" },
                { label: "Carbo", value: `${Math.round(summary.carbs)}`, unit: "g", color: "bg-salmon-orange", bar: "52%" },
                { label: "Água", value: `${round(water / 1000)}`, unit: "l", color: "bg-royal-blue", bar: `${Math.min(100, (water / 2500) * 100)}%` },
              ].map(
                (item) => html`
                  <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-between gap-3 min-h-[138px] shadow-[0_10px_24px_rgba(41,43,45,0.04)] border border-white/80">
                    <div>
                      <span className="block text-[1.05rem] font-semibold text-jet-black mb-2 whitespace-nowrap">${item.label === "Proteína" ? "Proteinas" : item.label}</span>
                      <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
                        <span className="text-[1.1rem] font-[200] text-jet-black">${item.value}</span>
                        <span className="text-[1.1rem] font-[200] text-jet-black">${item.unit === "L" ? "litros" : item.unit.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                      <div className=${`h-full ${item.color}`} style=${{ width: item.bar }}></div>
                    </div>
                  </div>
                `,
              )}
            </section>
          </div>

          <section className="grid grid-cols-1" style=${{ gap: "12px" }}>
            <button className="bg-[#D9B8F3] rounded-[10px] p-8 h-40 flex flex-col justify-between active:scale-95 transition-all text-left shadow-[0_14px_28px_rgba(41,43,45,0.06)]" onClick=${() => setScreen("food")}>
              <div className="flex items-center justify-between">
                <${Icon} name="restaurant" className="text-jet-black text-4xl" />
                <${Icon} name="arrow_forward" className="text-jet-black text-[2rem]" />
              </div>
              <span className="text-jet-black text-[2.2rem] font-[200] leading-none whitespace-nowrap">Comida</span>
            </button>
            <button className="bg-[#DFF37D] rounded-[10px] p-8 h-40 flex flex-col justify-between active:scale-95 transition-all text-left shadow-[0_14px_28px_rgba(41,43,45,0.06)]" onClick=${() => setScreen("plan")}>
              <div className="flex items-center justify-between">
                <${Icon} name="description" className="text-jet-black text-4xl" />
                <${Icon} name="arrow_forward" className="text-jet-black text-[2rem]" />
              </div>
              <span className="text-jet-black text-[2.2rem] font-[200] leading-none whitespace-nowrap">Plano alimentar</span>
            </button>
            <button className="bg-[#4558C8] rounded-[10px] p-8 h-40 flex flex-col justify-between active:scale-95 transition-all text-left shadow-[0_14px_28px_rgba(41,43,45,0.08)]" onClick=${() => setScreen("water")}>
              <div className="flex items-center justify-between">
                <${Icon} name="water_drop" className="text-white text-4xl" />
                <${Icon} name="arrow_forward" className="text-white text-[2rem]" />
              </div>
              <span className="text-white text-[2.2rem] font-[200] leading-none whitespace-nowrap">Água</span>
            </button>
          </section>

          <section className="space-y-4" style=${{ marginTop: "14px" }}>
            <h3 className="text-lg font-bold text-jet-black">Atividade Recente</h3>
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_12px_24px_rgba(41,43,45,0.04)] border border-white/80">
              <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer text-left" onClick=${() => setScreen("food")}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center">
                    <${Icon} name="lunch_dining" className="text-jet-black" />
                  </div>
                  <div>
                    <p className="font-bold text-jet-black">${recentMeal?.title || "Almoço Executivo"}</p>
                    <p className="text-[0.6875rem] font-medium text-on-surface-variant">Hoje, ${recentMeal?.time || "13:05"} • ${Math.round(summarizeFoods(recentMeal?.foods || []).calories || 640)} kcal</p>
                  </div>
                </div>
                <${Icon} name="chevron_right" className="text-on-surface-variant" />
              </button>
              <button className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer border-t border-surface-container-low text-left" onClick=${() => setScreen("water")}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-royal-blue/10 flex items-center justify-center">
                    <${Icon} name="water_full" className="text-royal-blue" />
                  </div>
                  <div>
                    <p className="font-bold text-jet-black">${recentWaterEntry?.label || "Água registrada"}</p>
                    <p className="text-[0.6875rem] font-medium text-on-surface-variant">
                      ${recentWaterEntry ? `Hoje, ${recentWaterEntry.time} • ${recentWaterEntry.amount} ml` : "Registre sua hidratação do dia."}
                    </p>
                  </div>
                </div>
                <${Icon} name="chevron_right" className="text-on-surface-variant" />
              </button>
            </div>
          </section>
        </main>
        <${BottomNav} active="home" onChange=${setScreen} />
      </div>
    `;
  }

  function renderWelcome() {
    return html`
      <div className="bg-white text-[#111] min-h-screen" data-auth-screen="true">
        <main className="min-h-screen px-7 py-8 max-w-md mx-auto flex flex-col">
          <div className="pt-2">
            <${AuthWordmark} />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-5">
              <h1 className="text-[3.3rem] leading-[0.92] font-black text-[#111]">MOS</h1>
              <p className="text-[1.35rem] leading-snug text-[#6e7178] max-w-[16rem]">Seu app para organizar alimentação, plano, água e evolução diária.</p>
              <div className="w-24 h-1 bg-[#111] rounded-full"></div>
            </div>
          </div>

          <div className="space-y-4 pb-5">
            <div className="rounded-[10px] bg-[#eef6ff] border border-[#dbe7ff] p-4 text-sm text-[#111]">Bem-vinda ao MOS. Entre ou crie sua conta para começar sua rotina com mais clareza, consistência e controle do seu dia.</div>
            <button className="w-full h-16 bg-[#111] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform flex items-center justify-center gap-2" onClick=${() => openAuthScreen("signup")}>
              <span>Começar</span>
              <${Icon} name="arrow_forward" className="text-white" />
            </button>
            <button className="w-full h-16 bg-white border border-[#111]/25 text-[#111] rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => openAuthScreen("login")}>
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
      <div className="bg-white text-[#111] min-h-screen" data-auth-screen="true">
        <header className="border-b border-black/10">
          <div className="h-16 px-6 max-w-md mx-auto flex items-center justify-between">
            <${AuthWordmark} />
            <button onClick=${() => openAuthScreen("welcome")}><${Icon} name="menu" className="text-[#111]" /></button>
          </div>
        </header>

        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <section className="space-y-4">
            <h1 className="text-[3.1rem] leading-[0.92] font-black text-[#111]">Criar conta</h1>
            <p className="text-[1.2rem] leading-snug text-[#6e7178]">Junte-se à plataforma MOS para acessar sua rotina de forma organizada e visual.</p>
          </section>

          ${renderAuthNoticeCard()}

          <form className="space-y-5" onSubmit=${handleSignupSubmit}>
            <div className="space-y-2">
              <label className="text-[0.8rem] font-bold text-[#111]">Nome completo</label>
              <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" value=${signupForm.name} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, name: value }));
              }} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <label className="text-[0.8rem] font-bold text-[#111]">E-mail</label>
              <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" type="email" value=${signupForm.email} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, email: value }));
              }} placeholder="exemplo@mos.app" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Idade</label>
                <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" type="number" min="10" step="1" value=${signupForm.age} onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, age: value }));
                }} placeholder="30" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Altura (cm)</label>
                <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" type="number" min="100" step="1" value=${signupForm.height} onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, height: value }));
                }} placeholder="170" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Peso atual (kg)</label>
                <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" type="number" min="20" step="0.1" value=${signupForm.weight} onInput=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, weight: value }));
                }} placeholder="77.7" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.8rem] font-bold text-[#111]">Objetivo</label>
                <select className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111] bg-white" value=${signupForm.goal} onChange=${(e) => {
                  const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                  setSignupForm((current) => ({ ...current, goal: value }));
                }}>
                  <option value="lose">Perder peso</option>
                  <option value="maintain">Manter peso</option>
                  <option value="gain">Ganhar massa</option>
                </select>
              </div>
            </div>
            <div className="rounded-[10px] border border-[#111]/10 bg-[#f7f8fb] p-4 space-y-1">
              <p className="text-[0.78rem] font-bold text-[#6e7178]">Meta calórica sugerida</p>
              <p className="text-[1.8rem] font-black text-[#111]">${suggestedCalories ? `${suggestedCalories.toLocaleString("pt-BR")} kcal` : "Preencha seus dados"}</p>
              <p className="text-sm leading-snug text-[#6e7178]">Você poderá editar essa meta depois em Meu perfil.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[0.8rem] font-bold text-[#111]">Senha</label>
                <button type="button" className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#8a8a8a]" onClick=${() => setShowSignupPassword((current) => !current)}>
                  <${Icon} name=${showSignupPassword ? "visibility_off" : "visibility"} className="text-[1rem]" />
                  <span>${showSignupPassword ? "Ocultar senha" : "Ver senha"}</span>
                </button>
              </div>
              <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" type=${showSignupPassword ? "text" : "password"} value=${signupForm.password} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, password: value }));
              }} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[0.8rem] font-bold text-[#111]">Confirmar senha</label>
                <button type="button" className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#8a8a8a]" onClick=${() => setShowSignupConfirmPassword((current) => !current)}>
                  <${Icon} name=${showSignupConfirmPassword ? "visibility_off" : "visibility"} className="text-[1rem]" />
                  <span>${showSignupConfirmPassword ? "Ocultar senha" : "Ver senha"}</span>
                </button>
              </div>
              <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" type=${showSignupConfirmPassword ? "text" : "password"} value=${signupForm.confirmPassword} onInput=${(e) => {
                const value = e?.currentTarget?.value ?? e?.target?.value ?? "";
                setSignupForm((current) => ({ ...current, confirmPassword: value }));
              }} placeholder="••••••••" />
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
          </form>

          <button className="w-full text-sm font-bold text-[#111] underline underline-offset-4" onClick=${() => openAuthScreen("login")}>
            Já tem conta? Entrar
          </button>

          <footer className="pt-8 border-t border-black/10 space-y-4">
            <h2 className="text-xl font-black text-[#111]">MOS system</h2>
            <p className="text-sm leading-relaxed text-[#6e7178]">Organização editorial do seu dia com foco em alimentação, hidratação, medidas e consistência.</p>
          </footer>
        </main>
      </div>
    `;
  }

  function renderLogin() {
    const isReady = loginForm.email.trim() && loginForm.password;

    return html`
      <div className="bg-white text-[#111] min-h-screen" data-auth-screen="true">
        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <${AuthWordmark} />

          <section className="space-y-4 pt-2">
            <h1 className="text-[3.2rem] leading-[0.93] font-black text-[#111]">Acesse sua conta</h1>
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
      <div className="bg-white text-[#111] min-h-screen" data-auth-screen="true">
        <header className="border-b border-black/10">
          <div className="h-16 px-6 max-w-md mx-auto flex items-center justify-between">
            <${AuthWordmark} />
            <button onClick=${() => openAuthScreen("login")}><${Icon} name="menu" className="text-[#111]" /></button>
          </div>
        </header>

        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <section className="space-y-4 pt-10">
            <h1 className="text-[3rem] leading-[0.94] font-black text-[#111]">Recuperar senha</h1>
            <p className="text-[1.2rem] leading-snug text-[#6e7178]">Digite seu e-mail para enviarmos o link de recuperação.</p>
          </section>

          ${renderAuthNoticeCard()}

          <form className="space-y-6" onSubmit=${handleRecoverSubmit}>
            <div className="space-y-2">
              <label className="text-[0.8rem] font-bold text-[#111]">E-mail</label>
              <input className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]" type="email" value=${recoverEmail} onInput=${(e) => {
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
      <div className="bg-white text-[#111] min-h-screen" data-auth-screen="true">
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
            <h1 className="text-[3rem] leading-[0.94] font-black text-[#111]">Criar nova senha</h1>
            <p className="text-[1.2rem] leading-snug text-[#6e7178]">
              Defina sua nova senha para voltar a entrar no MOS com segurança.
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
                className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]"
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
                className="w-full h-14 px-4 border border-[#111]/30 rounded-[10px] text-[#111]"
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
      <div className="bg-white text-[#111] min-h-screen">
        <main className="px-6 py-8 max-w-md mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <${AuthWordmark} />
            <button onClick=${() => openAuthScreen("welcome")}><${Icon} name="close" className="text-[#111]" /></button>
          </div>
          <section className="space-y-4 pt-4">
            <h1 className="text-[2.6rem] leading-[0.94] font-black text-[#111]">Termos e condições</h1>
            <p className="text-[1.05rem] leading-relaxed text-[#6e7178]">O MOS funciona como um organizador pessoal de alimentação, água, plano e medidas. Os dados ficam salvos localmente neste dispositivo.</p>
            <p className="text-[1.05rem] leading-relaxed text-[#6e7178]">Você pode editar suas informações quando quiser. Ao sair da conta, seus dados continuam guardados localmente até que você escolha apagar manualmente.</p>
            <p className="text-[1.05rem] leading-relaxed text-[#6e7178]">Seus dados ficam vinculados à sua conta e podem ser acessados com segurança sempre que você entrar no MOS.</p>
          </section>
          <button className="w-full h-14 bg-[#111] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => openAuthScreen("welcome")}>
            Voltar
          </button>
        </main>
      </div>
    `;
  }

  function renderFood() {
    return html`
      <div className="bg-[#faf3f2] text-on-surface min-h-screen pb-40">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("food")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-screen-xl mx-auto space-y-8">
          <section className="w-full">
            <button className="w-full bg-[#D9B8F3] rounded-xl p-6 flex justify-between items-center active:scale-98 transition-transform text-left" onClick=${openFoodCalendar}>
              <div className="space-y-1">
                <span className="font-label text-[0.6875rem] font-medium text-jet-black/60">Calendário</span>
                <h2 className="font-headline text-2xl font-bold text-[#292B2D]">${foodDateLabel}</h2>
              </div>
              <div className="bg-white/60 p-4 rounded-xl">
                <${Icon} name="calendar_today" className="text-[#292B2D]" />
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
          <section className="grid grid-cols-1 gap-4">
            ${foodMeals.length
              ? foodMeals.map(
              (meal) => {
                const mealTotal = summarizeFoods(meal.foods);
                return html`
                  <button className="bg-white rounded-xl p-6 min-h-[150px] active:scale-98 transition-transform cursor-pointer text-left flex flex-col justify-between gap-6" onClick=${() => { setSelectedConsumedId(meal.id); setScreen("food-detail"); }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                        <${Icon} name=${meal.icon || "restaurant"} className="text-jet-black text-[1.65rem]" />
                      </div>
                      <${Icon} name="arrow_forward" className="text-jet-black text-[2rem] shrink-0" />
                    </div>
                    <div>
                      <h3 className="font-headline text-[1.9rem] font-[300] leading-none mb-3 text-jet-black">${meal.name}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">${meal.description}</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[1.9rem] font-black leading-none text-jet-black">${Math.round(mealTotal.calories)}</span>
                      <span className="font-label text-[0.6875rem] font-bold text-outline">kcal</span>
                    </div>
                  </button>
                `;
              },
            )
              : html`
                  <div className="bg-white rounded-xl p-6 text-center space-y-2">
                    <p className="font-bold text-jet-black">Nenhuma refeição registrada</p>
                    <p className="text-sm text-on-surface-variant">Escolha outra data ou registre uma refeição para este dia.</p>
                  </div>
                `}
          </section>
          <div className="fixed bottom-24 left-0 w-full px-4 z-40 pointer-events-none">
            <button className="pointer-events-auto w-full max-w-screen-xl mx-auto bg-[#EF5F37] text-white py-5 rounded-xl font-headline font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform" onClick=${() => setModal("food")}>
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
          <section className="bg-white rounded-xl px-4 divide-y divide-surface-container-high">
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
            <div className="bg-white rounded-xl px-4 divide-y divide-surface-container-high">
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

  function renderPlan() {
    return html`
      <div className="bg-[#e9ecfa] text-on-surface min-h-screen pb-32">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("plan")} onRight=${openNotifications} />
        <main className="pt-24 pb-32 px-6 max-w-md mx-auto space-y-8">
          <header className="bg-[#DFF37D] text-[#292B2D] p-8 rounded-xl shadow-[0_14px_30px_rgba(41,43,45,0.06)]">
            <div className="flex flex-col gap-1">
              <span className="text-[0.6875rem] font-medium text-jet-black/60">Meta Ativa</span>
              <h1 className="text-[1.75rem] font-bold leading-tight">${state.profile.activeGoal}</h1>
            </div>
          </header>
          <div className="sticky top-20 z-40 bg-white rounded-xl p-2 flex gap-2 shadow-[0_10px_24px_rgba(41,43,45,0.06)] border border-white/80">
            <button className="flex-1 py-3 px-4 rounded-xl bg-[#4558C8] text-white text-[0.875rem] font-bold transition-all active:scale-95">Cardápio</button>
            <button className="flex-1 py-3 px-4 rounded-xl bg-surface-container-low text-[#292B2D] text-[0.875rem] font-bold" onClick=${() => setScreen("supplements")}>Suplementos</button>
          </div>
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold text-[#292B2D]">Cardápio do Plano</h2>
            </div>
            ${state.planMeals.map(
              (meal) => html`
                <button className="bg-[#FFFFFF] p-6 rounded-xl w-full text-left active:scale-[0.98] transition-transform flex flex-col gap-6 shadow-[0_12px_24px_rgba(41,43,45,0.04)] border border-white/80" onClick=${() => { setSelectedPlanId(meal.id); setScreen("plan-detail"); }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                      <${Icon} name=${meal.icon || "description"} className="text-jet-black text-[1.65rem]" />
                    </div>
                    <${Icon} name="arrow_forward" className="text-jet-black text-[2rem] shrink-0" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-[1.55rem] font-bold leading-none text-[#292B2D]">${meal.name}</h3>
                    <p className="text-[0.875rem] text-slate-500 mt-3 leading-relaxed">${meal.description}</p>
                  </div>
                </button>
              `,
            )}
          </section>
          <section className="grid grid-cols-3 gap-3">
            <div className="bg-[#D9B8F3] p-5 rounded-xl flex flex-col justify-between min-h-[132px] shadow-[0_10px_22px_rgba(41,43,45,0.05)]">
              <span className="text-[0.6875rem] font-bold text-[#292B2D]">Calorias</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[1.9rem] font-bolder leading-none">${Math.round(planTotals.calories)}</span>
                <span className="text-[0.6875rem] font-medium">kcal</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between min-h-[132px] shadow-[0_10px_22px_rgba(41,43,45,0.05)]">
              <span className="text-[0.6875rem] font-bold text-[#292B2D]">Proteínas</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[1.9rem] font-bolder leading-none">${Math.round(planTotals.protein)}</span>
                <span className="text-[0.6875rem] font-medium">g</span>
              </div>
            </div>
            <div className="bg-surface-container-highest p-5 rounded-xl flex flex-col justify-between min-h-[132px] shadow-[0_10px_22px_rgba(41,43,45,0.05)]">
              <span className="text-[0.6875rem] font-bold text-[#292B2D]">Carbos</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[1.9rem] font-bolder leading-none">${Math.round(planTotals.carbs)}</span>
                <span className="text-[0.6875rem] font-medium">g</span>
              </div>
            </div>
          </section>
          <button className="w-full py-5 bg-[#EF5F37] text-white rounded-[10px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" onClick=${() => setScreen("plan-config")}>
            <${Icon} name="settings" />
            Configurar plano
          </button>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  function renderPlanConfig() {
    const planFocus = state.profile.planFocus || "Déficit calórico com mais constância";
    const planNotes = state.profile.planNotes || "Defina o foco do plano, ajuste o objetivo principal e use a navegação abaixo para criar refeições ou revisar o histórico.";
    const planMealCount = state.planMeals.length;
    const averageCalories = planMealCount ? Math.round(planTotals.calories / planMealCount) : 0;
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
          <section className="bg-[#292B2D] text-white rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-sm text-white/65">Painel do plano</span>
                <h1 className="text-[1.8rem] font-bold leading-tight">${state.profile.activeGoal}</h1>
                <p className="text-sm leading-relaxed text-white/72">${planFocus}</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
                <${Icon} name="dashboard" className="text-white text-[1.65rem]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/8 rounded-[10px] p-4 space-y-2">
                <span className="text-[0.75rem] text-white/65">Refeições</span>
                <strong className="text-[1.5rem] font-bold block">${planMealCount}</strong>
              </div>
              <div className="bg-white/8 rounded-[10px] p-4 space-y-2">
                <span className="text-[0.75rem] text-white/65">Calorias</span>
                <strong className="text-[1.5rem] font-bold block">${Math.round(planTotals.calories)}</strong>
              </div>
              <div className="bg-white/8 rounded-[10px] p-4 space-y-2">
                <span className="text-[0.75rem] text-white/65">Média</span>
                <strong className="text-[1.5rem] font-bold block">${averageCalories}</strong>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 space-y-4 border border-[#dde4ff]">
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
            <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-[10px] overflow-hidden">
              ${state.planMeals.length
                ? state.planMeals.map(
                    (meal) => html`
                      <div className="py-4 px-4 bg-white">
                        <div className="min-w-0">
                          <span className="text-[1rem] font-medium text-jet-black block">${meal.name}</span>
                          <span className="text-[0.85rem] text-on-surface-variant">${meal.foods.length} item(ns) no plano</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            className="h-10 px-4 rounded-[10px] bg-[#eef2ff] text-[#4558C8] font-bold active:scale-95 transition-transform"
                            onClick=${() =>
                              guardPlanConfigNavigation(() => {
                                setSelectedPlanId(meal.id);
                                setScreen("plan-detail");
                              })}
                          >
                            Editar
                          </button>
                          <button
                            className="h-10 px-4 rounded-[10px] bg-white border border-[#efc1bc] text-error font-bold active:scale-95 transition-transform"
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
                : html`<p className="py-2 text-sm text-on-surface-variant">Nenhuma refeição cadastrada no plano ainda.</p>`}
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 border border-[#dde4ff] space-y-5">
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
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-24">
        <${TopBar}
          title=${selectedPlan.name}
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("plan")}
        />
        <main className="pt-20 px-4 max-w-md mx-auto space-y-8">
          <section className="space-y-2">
            <h1 className="text-[2rem] font-bold text-jet-black">${selectedPlan.name}</h1>
          </section>
          <section className="bg-white rounded-xl px-4 divide-y divide-surface-container-high">
            ${selectedPlan.foods.map(
              (food) => {
                const accent = getFoodAccent(food.name);
                return html`
                  <div className="py-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style=${{ backgroundColor: accent.soft }}>
                        <${Icon} name=${accent.icon} className="text-jet-black text-[1.35rem]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[1rem] leading-relaxed text-jet-black">
                          <strong className="font-bold">${food.name}</strong>
                        </p>
                        <p className="text-[0.9rem] text-on-surface-variant mt-1">${food.quantity}</p>
                      </div>
                    </div>
                    <button className="shrink-0 min-h-10 px-4 rounded-[10px] bg-[#fff4ef] border border-[#ffd8ce] text-[#EF5F37] text-[0.8rem] font-bold active:scale-95 transition-transform flex items-center gap-2" onClick=${() => setSubstituteFood(food)}>
                      <${Icon} name="swap_horiz" className="text-[1.05rem] text-[#EF5F37]" />
                      <span>Ver trocas</span>
                    </button>
                  </div>
                `;
              },
            )}
          </section>
          <section className="space-y-3">
            <h3 className="text-[0.875rem] font-bold text-[#292B2D]">Informação Nutricional</h3>
            <div className="bg-white rounded-xl px-4 divide-y divide-surface-container-high">
              ${selectedPlan.foods.map(
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
                          <span className="text-[0.6875rem] font-bold text-[#292B2D]/60 block mb-1">Calorias</span>
                          <p className="text-[1rem] font-bold text-jet-black">${food.calories} kcal</p>
                        </div>
                        <div className="rounded-[10px] p-3 bg-surface-container-low">
                          <span className="text-[0.6875rem] font-bold text-[#292B2D]/60 block mb-1">Carbo</span>
                          <p className="text-[1rem] font-bold text-jet-black">${food.carbs} g</p>
                        </div>
                        <div className="rounded-[10px] p-3 bg-surface-container-low">
                          <span className="text-[0.6875rem] font-bold text-[#292B2D]/60 block mb-1">Proteína</span>
                          <p className="text-[1rem] font-bold text-jet-black">${food.protein} g</p>
                        </div>
                        <div className="rounded-[10px] p-3 bg-surface-container-low">
                          <span className="text-[0.6875rem] font-bold text-[#292B2D]/60 block mb-1">Gordura</span>
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
          <section className="bg-white rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DFF37D] flex items-center justify-center">
                <${Icon} name="lightbulb" className="text-jet-black" />
              </div>
              <h3 className="text-[0.875rem] font-bold text-[#292B2D]">Recomendação</h3>
            </div>
            <p className="text-[1rem] leading-relaxed text-on-surface-variant">Mastigue bem os alimentos, faça a refeição com calma e respeite as quantidades planejadas para melhorar a digestão e a aderência à meta.</p>
          </section>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  function renderSupplements() {
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-32">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("supplements")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-screen-xl mx-auto">
          <div className="mb-10">
            <span className="font-label text-[0.6875rem] font-medium text-secondary">Performance</span>
            <h2 className="font-headline text-[1.75rem] font-bold text-custom-jet leading-tight">Meus Suplementos</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            ${state.supplements.map(
              (supplement) => html`
                <button className="bg-white rounded-xl p-6 flex flex-col justify-between h-40 text-left w-full" onClick=${() => { setSelectedSupplementId(supplement.id); setScreen("supplement-detail"); }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label text-[0.6875rem] font-medium text-outline">${supplement.category || supplement.period}</span>
                      <h3 className="font-headline text-[1.2rem] font-bold mt-1 text-jet-black">${supplement.name}</h3>
                    </div>
                    <${Icon} name="chevron_right" className="text-outline" />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-jet-black">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[1.8rem] font-bold leading-none">${supplement.dosage.split(" ")[0] || supplement.dosage}</span>
                      <span className="font-label text-[0.6875rem] font-bold">${supplement.dosage.split(" ").slice(1).join(" ") || ""}</span>
                    </div>
                    <span className="text-[0.85rem] text-on-surface-variant">${supplement.time || "Sem horário"}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">${supplement.instruction}</p>
                </button>
              `,
            )}
            <button className="bg-surface-container-low rounded-xl p-6 flex flex-col items-center justify-center h-40 border border-outline-variant opacity-60" onClick=${() => setScreen("register-supplement")}>
              <${Icon} name="add_circle" className="text-4xl text-outline mb-2" />
              <p className="font-label text-xs font-bold text-outline">Adicionar mais</p>
            </button>
          </div>
          <button className="fixed bottom-28 right-6 bg-[#EF5F37] text-white px-6 py-4 rounded-[10px] font-bold flex items-center gap-3 active:scale-95 transition-transform z-40" onClick=${() => setScreen("register-supplement")}>
            <${Icon} name="add" />
            <span className="font-['Sora'] text-[0.6875rem]">Novo suplemento</span>
          </button>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  function renderWater() {
    const waterProgress = Math.min(100, (water / waterGoal) * 100);
    const remainingWater = Math.max(0, waterGoal - water);
    const waterFillHeight = Math.max(26, Math.min(88, waterProgress));
    const quickWaterOptions = [100, 150, 200, 250, 300];
    const selectedEntriesCount = waterEntries.length;
    return html`
      <div className="bg-[#f4f7ff] text-on-surface min-h-screen pb-32">
        <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("water")} onRight=${openNotifications} />
        <main className="pt-24 px-6 max-w-md mx-auto space-y-6">
          <section className="space-y-4">
            <div className="bg-[#f7fbff] rounded-[10px] p-6 md:p-8 relative overflow-hidden border border-[#e8f2ff] shadow-[0_16px_50px_rgba(47,104,255,0.08)]">
              <div className="flex flex-col items-center text-center">
                <div className="w-11 h-11 rounded-full bg-[#eef2ff] flex items-center justify-center mb-4 shadow-[0_10px_20px_rgba(69,88,200,0.12)]">
                  <${Icon} name="water_drop" className="text-[#4558C8] text-[1.35rem]" filled=${true} />
                </div>
                <div className="space-y-1 mb-6">
                  <p className="text-[0.95rem] font-medium text-[#292B2D]/82">Hidratação do dia</p>
                  <h2 className="text-[2.05rem] font-bold text-[#292B2D]">Seu consumo de água</h2>
                </div>

                <div className="mos-water-shell">
                  <div className="mos-water-fill" style=${{ height: `${waterFillHeight}%` }}></div>
                  <div className="mos-water-glow"></div>
                  <div className="mos-water-markers">
                    <span>500</span>
                    <span>400</span>
                    <span>300</span>
                    <span>200</span>
                    <span>100</span>
                    <span>0</span>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <strong className="text-[3rem] font-black leading-none text-[#292B2D] drop-shadow-[0_2px_8px_rgba(255,255,255,0.55)]">${Math.round(waterProgress)}%</strong>
                    <span className="mt-2 text-[0.85rem] font-medium text-[#292B2D]/70">da meta diária</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-3 bg-white rounded-full px-5 py-3 shadow-[0_10px_24px_rgba(41,43,45,0.08)] border border-[#e5eaff]">
                  <div className="w-8 h-8 rounded-full bg-[#eef2ff] flex items-center justify-center">
                    <${Icon} name="water_drop" className="text-[#4558C8] text-[1rem]" filled=${true} />
                  </div>
                  <div className="text-left">
                    <strong className="block text-[1.1rem] text-[#4558C8]">${Math.round(water)} / ${waterGoal} ml</strong>
                    <span className="text-[0.82rem] text-[#292B2D]/72">${waterHistoryDate === todayKey ? `Faltam ${remainingWater} ml` : `Visualizando ${waterViewDateLabel}`}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 top-14 w-28 h-28 rounded-full bg-[#e1e7ff] blur-2xl opacity-55"></div>
              <div className="absolute -left-8 bottom-8 w-24 h-24 rounded-full bg-[#eef2ff] blur-2xl opacity-80"></div>
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

          <section className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-[0_10px_22px_rgba(41,43,45,0.04)] border border-white/80">
              <span className="text-[0.78rem] font-medium text-[#292B2D]/55">Faltam</span>
              <div className="mt-2 flex items-baseline gap-1">
                <strong className="text-[1.9rem] font-black leading-none text-[#292B2D]">${remainingWater}</strong>
                <span className="text-[0.82rem] font-medium text-[#292B2D]/62">ml</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-[0_10px_22px_rgba(41,43,45,0.04)] border border-white/80">
              <span className="text-[0.78rem] font-medium text-[#292B2D]/55">${waterHistoryDate === todayKey ? "Registros hoje" : "Registros na data"}</span>
              <div className="mt-2 flex items-baseline gap-1">
                <strong className="text-[1.9rem] font-black leading-none text-[#292B2D]">${selectedEntriesCount}</strong>
                <span className="text-[0.82rem] font-medium text-[#292B2D]/62">${selectedEntriesCount === 1 ? "registro" : "registros"}</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-4 md:p-5 space-y-4 shadow-[0_12px_24px_rgba(41,43,45,0.04)] border border-white/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[1rem] font-bold text-[#292B2D]">Registro rápido</h3>
                <p className="text-sm text-[#292B2D]/60">Toque em um volume para somar na data ${waterViewDateLabel.toLowerCase()}.</p>
              </div>
              <button className="h-11 px-4 rounded-[10px] bg-[#EF5F37] text-white font-bold whitespace-nowrap shrink-0 active:scale-95 transition-transform" onClick=${() => setModal("water")}>
                Outro valor
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
              ${quickWaterOptions.map(
                (amount) => html`
                  <button
                    className="min-w-[108px] bg-white border border-[#dbe5fb] rounded-[10px] py-4 px-3 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_24px_rgba(69,88,200,0.06)] snap-start"
                    onClick=${() => appendWaterAmount(amount)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#edf2ff] flex items-center justify-center">
                      <${Icon} name="water_drop" className="text-[#4558C8]" filled=${true} />
                    </div>
                    <span className="text-[0.95rem] font-bold text-[#292B2D]">${amount} ml</span>
                  </button>
                `,
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#292B2D]">${waterHistoryDate === todayKey ? "Histórico de hoje" : `Histórico de ${waterViewDateLabel}`}</h3>
              <button className="min-h-10 px-3 rounded-[10px] bg-white border border-[#dbe5fb] text-[0.875rem] font-medium text-secondary shadow-[0_8px_18px_rgba(69,88,200,0.05)]" onClick=${openWaterHistory}>Ver tudo</button>
            </div>
            <div className="space-y-2">
              ${waterEntries.length
                ? waterEntries.map(
                    (entry) => html`
                      <div className="w-full bg-white rounded-xl p-4 flex items-center justify-between border-l-4 border-secondary text-left shadow-[0_10px_18px_rgba(41,43,45,0.03)] border border-white/80">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                            <${Icon} name="local_drink" className="text-lg text-secondary" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[1.35rem] font-black leading-none text-[#292B2D]">${entry.amount}</span>
                              <span className="text-[0.75rem] font-bold text-[#292B2D]/55">ml</span>
                            </div>
                            <p className="text-[0.82rem] text-[#292B2D]/55">${entry.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[1rem] font-bold leading-none text-[#292B2D]">${entry.time}</span>
                            <span className="text-[0.6875rem] font-medium text-[#292B2D]/40">registrado</span>
                          </div>
                          <button
                            className="w-10 h-10 rounded-full bg-[#fff4ef] text-[#EF5F37] flex items-center justify-center active:scale-95 transition-transform"
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
                    <div className="bg-surface-container-low rounded-xl p-6 text-center space-y-2">
                      <p className="font-bold text-jet-black">Nenhum registro nesse dia</p>
                      <p className="text-sm text-on-surface-variant">Escolha outra data no calendário ou registre água para começar o histórico.</p>
                    </div>
                  `}
            </div>
          </section>

          <section>
            <div className="bg-[#fff6f2] border border-[#f5ddd5] rounded-xl p-6 relative overflow-hidden shadow-[0_12px_22px_rgba(239,95,55,0.08)]">
              <div className="z-10 relative">
                <h4 className="text-[#292B2D] text-lg font-bold">Dica de Performance</h4>
                <p className="text-[#292B2D]/70 text-sm mt-1 max-w-[70%]">Beber água logo ao acordar ajuda a ativar a rotina e melhorar a consistência da hidratação ao longo do dia.</p>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[8rem] text-[#EF5F37]/10 rotate-12">lightbulb</span>
            </div>
          </section>
        </main>
        <div className="fixed bottom-24 left-0 w-full px-4 z-40 pointer-events-none">
          <button className="pointer-events-auto w-full max-w-md mx-auto bg-[#EF5F37] text-white py-5 rounded-[10px] font-headline font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-[0_16px_28px_rgba(239,95,55,0.24)]" onClick=${() => setModal("water")}>
            <${Icon} name="add_circle" />
            Registrar água
          </button>
        </div>
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
      <div className="bg-[#eef6fb] text-on-surface min-h-screen pb-32">
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
              <p className="text-sm text-on-surface-variant">Os indicadores abaixo ajudam a acompanhar o que mais importa para o MOS.</p>
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
      <div className="bg-[#f7f8fc] text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Meu perfil"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("home")}
          onSearch=${() => openSearch("home")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="bg-white rounded-xl p-6 border border-surface-container-high space-y-4 shadow-[0_12px_24px_rgba(41,43,45,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm text-[#4558C8]">Dados pessoais</span>
                <h1 className="text-[1.9rem] font-bold text-jet-black leading-tight">${state.profile.name || "Meu perfil"}</h1>
                <p className="text-sm leading-relaxed text-on-surface-variant">Aqui você concentra as informações principais da sua conta para manter o MOS mais pessoal e organizado.</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0">
                <${Icon} name="account_circle" className="text-[#4558C8] text-[1.6rem]" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 border border-surface-container-high space-y-3 shadow-[0_12px_24px_rgba(41,43,45,0.04)]">
            ${profileItems.map(
              (item) => html`
                <div className="rounded-[10px] bg-surface-container-low p-4 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-[10px] bg-white flex items-center justify-center shrink-0">
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
      { name: "Minhas medidas", description: "Concentra peso, IMC, composição corporal e evolução das últimas atualizações." },
      { name: "Notificações", description: "Reúne lembretes de suplemento, avisos importantes e novidades do MOS." },
      { name: "Busca", description: "Ajuda a encontrar rapidamente refeições, alimentos, suplementos e páginas do app." },
    ];

    return html`
      <div className="bg-[#f7f8fc] text-on-surface min-h-screen pb-32">
        <${TopBar}
          title="Sobre o app"
          leftIcon="arrow_back"
          centerBold=${false}
          onLeft=${() => setScreen("home")}
          onSearch=${() => openSearch("home")}
          onRight=${openNotifications}
        />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <section className="bg-white rounded-xl p-6 border border-surface-container-high space-y-4 shadow-[0_12px_24px_rgba(41,43,45,0.04)]">
            <span className="text-sm text-[#4558C8]">Bem-vinda ao MOS</span>
            <h1 className="text-[1.85rem] font-bold text-jet-black leading-tight">Um guia rápido para usar o app com clareza e leveza</h1>
            <p className="text-sm leading-relaxed text-on-surface-variant">O MOS foi pensado para acompanhar rotina, alimentação, água e evolução corporal sem complicar sua vida. Aqui você entende o que cada parte faz e como aproveitar melhor o app no dia a dia.</p>
          </section>

          <section className="bg-white rounded-xl p-6 border border-surface-container-high space-y-4 shadow-[0_12px_24px_rgba(41,43,45,0.04)]">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">Mini manual de uso</h2>
              <p className="text-sm text-on-surface-variant">Um caminho simples para usar o MOS sem se perder.</p>
            </div>
            <div className="space-y-3">
              ${[
                "Comece pela página Início para ver como está seu dia.",
                "Use Comida para registrar refeições e revisar o que já foi consumido.",
                "Entre em Plano para organizar o cardápio e ajustar as refeições planejadas.",
                "Atualize Água sempre que beber algo para manter a meta visível.",
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

          <section className="bg-white rounded-xl p-6 border border-surface-container-high space-y-4 shadow-[0_12px_24px_rgba(41,43,45,0.04)]">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">O que cada área faz</h2>
              <p className="text-sm text-on-surface-variant">Assim fica mais fácil entender a linguagem do app.</p>
            </div>
            <div className="space-y-3">
              ${areas.map(
                (area) => html`
                  <div className="rounded-[10px] bg-surface-container-low p-4 space-y-1">
                    <h3 className="text-[1rem] font-bold text-jet-black">${area.name}</h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">${area.description}</p>
                  </div>
                `,
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 border border-surface-container-high space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-jet-black">Nos ajude a melhorar</h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">Se algo ficou confuso, se você sentiu falta de uma função ou se quer sugerir uma melhoria, pode mandar por aqui. A ideia é que o app evolua junto com sua rotina.</p>
            </div>
            ${latestFeedback
              ? html`
                  <div className="rounded-[10px] bg-[#fff6f2] border border-[#f5ddd5] p-4">
                    <p className="text-sm font-bold text-jet-black">Último feedback salvo</p>
                    <p className="text-sm text-on-surface-variant mt-1">${latestFeedback.section} · ${new Date(latestFeedback.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                `
              : null}
            <button className="w-full h-14 bg-[#EF5F37] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => setModal("feedback")}>
              Enviar feedback
            </button>
          </section>
        </main>
        <${BottomNav} active=${null} onChange=${setScreen} />
      </div>
    `;
  }

  function renderHistory() {
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-32">
        <${TopBar} title="Histórico" leftIcon="arrow_back" centerBold=${false} onLeft=${() => setScreen("plan-config")} onSearch=${() => openSearch("history")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-screen-xl mx-auto">
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

  function renderAppNews() {
    return html`
      <div className="bg-[#f7f8fc] text-on-surface min-h-screen pb-24">
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
            <h1 className="text-[1.8rem] font-bold text-jet-black leading-tight">Registro de atualizações do MOS</h1>
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
        <main className="pt-24 px-4 max-w-screen-md mx-auto space-y-5">
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
          <section className="bg-white rounded-xl p-6 grid grid-cols-2 gap-4">
            <div><span className="text-[0.6875rem] text-outline block">Calorias</span><strong className="text-2xl text-jet-black">${selectedFood.calories} kcal</strong></div>
            <div><span className="text-[0.6875rem] text-outline block">Carbo</span><strong className="text-2xl text-jet-black">${selectedFood.carbs} g</strong></div>
            <div><span className="text-[0.6875rem] text-outline block">Proteínas</span><strong className="text-2xl text-jet-black">${selectedFood.protein} g</strong></div>
            <div><span className="text-[0.6875rem] text-outline block">Gorduras</span><strong className="text-2xl text-jet-black">${selectedFood.fat} g</strong></div>
          </section>
          <section className="bg-white rounded-xl p-6 space-y-2">
            <h3 className="text-base font-bold text-jet-black">Benefícios</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">${selectedFood.benefit}</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">Ajuda o corpo e a meta do usuário quando encaixado com consistência, porção adequada e regularidade no plano.</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">Orientação de consumo: use dentro da refeição planejada e ajuste a quantidade conforme sua meta calórica do dia.</p>
          </section>
          <section className="bg-white rounded-xl p-6 space-y-2">
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
    const supplement = state.supplements.find((item) => item.id === selectedSupplementId);
    if (!supplement) return renderSupplements();
    return html`
      <div className="${getSectionBackground("plan")} text-on-surface min-h-screen pb-24">
        <${TopBar} title=${supplement.name} leftIcon="arrow_back" centerBold=${false} onLeft=${() => setScreen("supplements")} onSearch=${() => openSearch("supplement-detail")} onRight=${openNotifications} />
        <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
          <${ContextNav}
            items=${[
              { label: "Suplementos", onClick: () => setScreen("supplements"), primary: true },
              { label: "Plano", onClick: () => setScreen("plan") },
              { label: "Início", onClick: () => setScreen("home") },
            ]}
          />
          <section className="space-y-2">
            <span className="text-[0.6875rem] font-medium text-outline">${supplement.category || supplement.period}</span>
            <h1 className="text-[1.9rem] font-bold text-jet-black">${supplement.name}</h1>
          </section>
          <section className="bg-white rounded-xl p-6 space-y-3">
            <p className="text-base font-semibold text-jet-black">${supplement.dosage}</p>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span>Horário: ${supplement.time || "Não definido"}</span>
              <span>•</span>
              <span>Categoria: ${supplement.category || "Geral"}</span>
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">${supplement.instruction}</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">Descrição: suplemento usado para apoiar consistência, recuperação e adesão à rotina, conforme objetivo da pessoa.</p>
          </section>
          <div className="grid grid-cols-1 gap-3">
            <button className="w-full h-14 bg-surface-container-low text-jet-black rounded-xl font-bold" onClick=${() => setModal("edit-supplement")}>Editar</button>
            <button className="w-full h-14 bg-white border border-outline-variant text-error rounded-xl font-bold" onClick=${() => askDeleteConfirm({
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
                setScreen("supplements");
              },
            })}>Apagar</button>
          </div>
        </main>
        <${BottomNav} active="plan" onChange=${setScreen} />
      </div>
    `;
  }

  const shouldRenderResetPassword = authReady && passwordRecoveryReady;

  return html`
    <div>
      ${!authReady &&
      html`
        <div className="min-h-screen bg-white text-[#111] flex items-center justify-center px-6">
          <div className="max-w-sm w-full space-y-4 text-center">
            <${AuthWordmark} />
            <p className="text-[1rem] text-[#6e7178]">Preparando autenticação do MOS valendo...</p>
          </div>
        </div>
      `}
      ${shouldRenderResetPassword && renderResetPassword()}
      ${!shouldRenderResetPassword && authReady && !isSignedIn && screen === "welcome" && renderWelcome()}
      ${!shouldRenderResetPassword && authReady && !isSignedIn && screen === "signup" && renderSignup()}
      ${!shouldRenderResetPassword && authReady && !isSignedIn && screen === "login" && renderLogin()}
      ${!shouldRenderResetPassword && authReady && !isSignedIn && screen === "recover-password" && renderRecoverPassword()}
      ${!shouldRenderResetPassword && authReady && !isSignedIn && screen === "reset-password" && renderResetPassword()}
      ${!shouldRenderResetPassword && authReady && !isSignedIn && screen === "legal" && renderLegal()}

      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "home" && renderHome()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "food" && renderFood()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "food-detail" && renderFoodDetail()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "ingredient-detail" && renderIngredientDetail()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "plan" && renderPlan()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "plan-config" && renderPlanConfig()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "plan-detail" && renderPlanDetail()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "supplements" && renderSupplements()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "register-supplement" && renderRegisterSupplement()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "supplement-detail" && renderSupplementDetail()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "water" && renderWater()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "profile" && renderProfile()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "measures" && renderMeasures()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "about-app" && renderAboutApp()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "app-news" && renderAppNews()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "history" && renderHistory()}
      ${!shouldRenderResetPassword && authReady && isSignedIn && screen === "search" && renderSearch()}

      ${authReady && isSignedIn && drawerOpen && html`<${MenuDrawer} onClose=${() => setDrawerOpen(false)} onSelect=${openMenuItem} />`}
      ${authReady && isSignedIn && notificationsOpen && html`<${NotificationsPanel} items=${notifications} onClose=${() => setNotificationsOpen(false)} onOpen=${openNotificationItem} onClear=${clearNotifications} />`}
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
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-jet-black">Seção</label>
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
                <label className="text-sm font-medium text-jet-black">Mensagem</label>
                <textarea className="w-full min-h-36 px-6 py-5 bg-surface-container-low border-0 rounded-lg resize-none text-jet-black" name="message" placeholder="Conte com calma o que você sentiu, o que não funcionou bem ou o que gostaria de ver no MOS." required></textarea>
              </div>
              <button
                className=${`w-full h-16 bg-salmon-orange text-white rounded-lg font-bold text-base transition-all ${
                  isDraftDirty("modal-feedback") ? "active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
                }`}
                type="submit"
                disabled=${!isDraftDirty("modal-feedback")}
              >
                Enviar feedback
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
