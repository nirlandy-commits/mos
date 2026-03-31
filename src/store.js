import { DEFAULT_MEALS } from "./data.js";

const STORAGE_KEY = "mos-shape-state";

const initialState = {
  profile: null,
  mealPlan: DEFAULT_MEALS.map((name, index) => ({
    id: `meal-${index + 1}`,
    name,
    foods: [],
  })),
  supplements: [],
  dailySupplements: {},
  dailyLogs: {},
  weightHistory: [],
};

function normalizeMealPlan(mealPlan) {
  if (!Array.isArray(mealPlan) || !mealPlan.length) return structuredClone(initialState.mealPlan);

  return mealPlan.map((meal, index) => ({
    id: meal.id || `meal-${index + 1}`,
    name: meal.name || `Refeicao ${index + 1}`,
    foods: Array.isArray(meal.foods) ? meal.foods : [],
  }));
}

function normalizeDailyLogs(dailyLogs) {
  if (!dailyLogs || typeof dailyLogs !== "object") return {};

  return Object.fromEntries(
    Object.entries(dailyLogs).map(([date, items]) => [
      date,
      Array.isArray(items)
        ? items.map((item) => ({
            ...item,
            mealId: item.mealId ?? "",
          }))
        : [],
    ]),
  );
}

function normalizeSupplements(supplements) {
  if (!Array.isArray(supplements)) return [];

  return supplements.map((supplement, index) => ({
    id: supplement.id || `supplement-${index + 1}`,
    name: supplement.name || `Suplemento ${index + 1}`,
    dosage: supplement.dosage || "",
    time: supplement.time || "08:00",
  }));
}

function normalizeDailySupplements(dailySupplements) {
  if (!dailySupplements || typeof dailySupplements !== "object") return {};

  return Object.fromEntries(
    Object.entries(dailySupplements).map(([date, items]) => [
      date,
      Array.isArray(items)
        ? items.map((item) => ({
            supplementId: item.supplementId ?? "",
            taken: Boolean(item.taken),
            takenAt: item.takenAt ?? "",
          }))
        : [],
    ]),
  );
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(initialState),
      ...parsed,
      mealPlan: normalizeMealPlan(parsed.mealPlan),
      supplements: normalizeSupplements(parsed.supplements),
      dailySupplements: normalizeDailySupplements(parsed.dailySupplements),
      dailyLogs: normalizeDailyLogs(parsed.dailyLogs),
      weightHistory: parsed.weightHistory ?? [],
    };
  } catch (error) {
    console.error("Erro ao ler dados locais:", error);
    return structuredClone(initialState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}
