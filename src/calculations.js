export function round(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

export function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function calorieTarget(profile) {
  if (!profile) return 0;

  const base = profile.weight * 22 + profile.height * 6.25 - profile.age * 5;
  const maintenance = Math.max(1200, Math.round(base * 1.35));

  if (profile.goal === "lose") return Math.max(1200, maintenance - 450);
  if (profile.goal === "gain") return maintenance + 250;
  return maintenance;
}

export function macroTargets(profile) {
  if (!profile) return { protein: 0, carbs: 0, fat: 0 };

  const calories = calorieTarget(profile);
  const proteinPerKg = profile.goal === "lose" ? 2 : 1.8;
  const fatPerKg = 0.8;
  const protein = Math.round(profile.weight * proteinPerKg);
  const fat = Math.round(profile.weight * fatPerKg);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { protein, carbs, fat };
}

export function summarizeEntries(entries = []) {
  return entries.reduce(
    (acc, item) => {
      acc.calories += Number(item.calories) || 0;
      acc.protein += Number(item.protein) || 0;
      acc.carbs += Number(item.carbs) || 0;
      acc.fat += Number(item.fat) || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function getDashboardData(profile, entries = []) {
  const totals = summarizeEntries(entries);
  const target = calorieTarget(profile);
  const remaining = target - totals.calories;
  const progress = target > 0 ? Math.min(100, Math.max(0, (totals.calories / target) * 100)) : 0;

  return {
    totals,
    target,
    remaining,
    progress,
    macroGoal: macroTargets(profile),
  };
}

export function getWeightProgress(profile, history = []) {
  if (!profile) {
    return { currentWeight: 0, targetWeight: 0, percent: 0, toGoal: 0 };
  }

  const startWeight = Number(profile.weight) || 0;
  const targetWeight = Number(profile.targetWeight) || startWeight;
  const currentWeight = Number(history.at(-1)?.weight) || startWeight;

  const totalDistance = Math.abs(startWeight - targetWeight);
  const movedDistance = Math.abs(startWeight - currentWeight);
  const percent = totalDistance === 0 ? 100 : Math.min(100, Math.max(0, (movedDistance / totalDistance) * 100));

  return {
    currentWeight,
    targetWeight,
    percent,
    toGoal: round(Math.abs(currentWeight - targetWeight)),
  };
}
