export function createMosStateStorage({
  storageKey,
  forceLoginKey,
  localDemoMode = false,
  demoTodayKey,
  defaultState,
  initialState,
  normalizeMeasureEntry,
  normalizeMeal,
  normalizeSupplement,
  normalizeTrainingPlan,
  normalizeProfile,
}) {
  const legacyDemoProfileNames = new Set([defaultState.profile.name, "Nirlandy Leitão Pinheiro"]);
  const legacyDemoActiveGoals = new Set(["Plano atual: Perder 5kg"]);
  const legacyDemoMeasureIds = new Set(defaultState.measureEntries.map((entry) => entry.id));
  const legacyDemoPlanMealIds = new Set(defaultState.planMeals.map((meal) => meal.id));
  const legacyDemoSupplementIds = new Set(defaultState.supplements.map((item) => item.id));
  const legacyDemoTrainingIds = new Set(defaultState.trainingPlans.map((plan) => plan.id));

  function isLegacyDemoId(item = {}, prefix = "") {
    return String(item.id || "").startsWith(prefix);
  }

  function stripLegacyDemoList(items = [], legacyIds = new Set(), prefix = "") {
    if (localDemoMode || !Array.isArray(items)) return items;
    return items.filter((item) => {
      const id = String(item?.id || "");
      if (legacyIds.has(id)) return false;
      if (prefix && id.startsWith(prefix)) return false;
      return true;
    });
  }

  function stripLegacyDemoConsumedMeals(mealsByDate = {}) {
    if (localDemoMode || !mealsByDate || typeof mealsByDate !== "object") return mealsByDate || {};

    return Object.fromEntries(
      Object.entries(mealsByDate)
        .map(([key, meals]) => [
          key,
          Array.isArray(meals) ? meals.filter((meal) => !isLegacyDemoId(meal, "meal-demo")) : [],
        ])
        .filter(([, meals]) => meals.length),
    );
  }

  function stripLegacyDemoWaterHistory(entriesByDate = {}) {
    if (localDemoMode || !entriesByDate || typeof entriesByDate !== "object") return entriesByDate || {};

    return Object.fromEntries(
      Object.entries(entriesByDate)
        .map(([key, entries]) => [
          key,
          Array.isArray(entries) ? entries.filter((entry) => !isLegacyDemoId(entry, "water-demo")) : [],
        ])
        .filter(([, entries]) => entries.length),
    );
  }

  function stripLegacyDemoWaterTotals(waterTotals = {}) {
    if (localDemoMode || !waterTotals || typeof waterTotals !== "object") return waterTotals || {};
    return Object.fromEntries(
      Object.entries(waterTotals).filter(
        ([key, value]) => !(key === demoTodayKey && Number(value) === defaultState.water[demoTodayKey]),
      ),
    );
  }

  function cleanProductionText(value = "", forbiddenValues = new Set()) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (!localDemoMode && forbiddenValues.has(text)) return "";
    return text;
  }

  function migrate(raw) {
    const rawPlanMeals = raw.planMeals || raw.mealPlan;
    const rawConsumedMeals = raw.consumedMeals || raw.foodLog || {};
    const normalizedMeasures = Array.isArray(raw.measureEntries)
      ? stripLegacyDemoList(raw.measureEntries, legacyDemoMeasureIds).map((entry, index) => normalizeMeasureEntry(entry, index))
      : initialState.measureEntries;
    const normalizedConsumedMeals = stripLegacyDemoConsumedMeals(rawConsumedMeals);
    const normalizedPlanMeals = Array.isArray(rawPlanMeals)
      ? stripLegacyDemoList(rawPlanMeals, legacyDemoPlanMealIds).map((meal, index) => normalizeMeal(meal, index))
      : initialState.planMeals;
    const normalizedSupplements = Array.isArray(raw.supplements)
      ? stripLegacyDemoList(raw.supplements, legacyDemoSupplementIds).map((item, index) => normalizeSupplement(item, index))
      : initialState.supplements;
    const normalizedTrainingPlans = Array.isArray(raw.trainingPlans)
      ? stripLegacyDemoList(raw.trainingPlans, legacyDemoTrainingIds).map((plan, index) => normalizeTrainingPlan(plan, index))
      : initialState.trainingPlans;
    const normalizedWater = stripLegacyDemoWaterTotals(raw.water || {});
    const normalizedWaterHistory = stripLegacyDemoWaterHistory(raw.waterHistory || {});

    const normalizedProfile = normalizeProfile(raw.profile, initialState.profile);

    return {
      auth: {
        registered: raw.auth?.registered ?? Boolean(raw.profile?.email),
        signedIn: raw.auth?.signedIn ?? true,
        email: raw.auth?.email || raw.profile?.email || "",
        password: raw.auth?.password || "",
      },
      profile: {
        ...normalizedProfile,
        activeGoal:
          cleanProductionText(normalizedProfile.activeGoal, legacyDemoActiveGoals) || initialState.profile.activeGoal,
        name: cleanProductionText(normalizedProfile.name, legacyDemoProfileNames) || initialState.profile.name,
      },
      feedbackEntries: Array.isArray(raw.feedbackEntries) ? raw.feedbackEntries : [],
      appNotifications: Array.isArray(raw.appNotifications) ? raw.appNotifications : [],
      measureEntries: normalizedMeasures,
      consumedMeals: (() => {
        if (!localDemoMode) return normalizedConsumedMeals;
        return {
          ...initialState.consumedMeals,
          ...normalizedConsumedMeals,
        };
      })(),
      planMeals: normalizedPlanMeals,
      supplements: normalizedSupplements,
      trainingPlans: normalizedTrainingPlans,
      trainingHistory: Array.isArray(raw.trainingHistory) ? raw.trainingHistory : [],
      water: (() => {
        if (!localDemoMode) return normalizedWater;
        return {
          ...initialState.water,
          ...normalizedWater,
        };
      })(),
      waterHistory: (() => {
        if (!localDemoMode) return normalizedWaterHistory;
        return {
          ...initialState.waterHistory,
          ...normalizedWaterHistory,
        };
      })(),
    };
  }

  function loadState() {
    try {
      const current = localStorage.getItem(storageKey);
      if (current) return migrate(JSON.parse(current));
    } catch (error) {
      console.error(error);
    }
    return structuredClone(initialState);
  }

  function saveState(state) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }

  function shouldOpenLoginAfterReload() {
    try {
      if (sessionStorage.getItem(forceLoginKey) === "1") {
        sessionStorage.removeItem(forceLoginKey);
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  function markLoginAfterReload() {
    try {
      sessionStorage.setItem(forceLoginKey, "1");
    } catch (error) {
      console.error(error);
    }
  }

  return {
    migrate,
    loadState,
    saveState,
    shouldOpenLoginAfterReload,
    markLoginAfterReload,
  };
}
