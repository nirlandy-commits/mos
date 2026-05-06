import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOCAL_CONFIG_KEY = "mos-valendo-supabase-config";

function readWindowConfig() {
  const config = globalThis.MOS_SUPABASE_CONFIG || {};
  return {
    url: String(config.url || "").trim(),
    anonKey: String(config.anonKey || "").trim(),
    redirectUrl: String(config.redirectUrl || "").trim(),
  };
}

function readLocalConfig() {
  try {
    const raw = globalThis.localStorage?.getItem(LOCAL_CONFIG_KEY);
    if (!raw) return { url: "", anonKey: "" };
    const parsed = JSON.parse(raw);
    return {
      url: String(parsed.url || "").trim(),
      anonKey: String(parsed.anonKey || "").trim(),
      redirectUrl: String(parsed.redirectUrl || "").trim(),
    };
  } catch (error) {
    return { url: "", anonKey: "", redirectUrl: "" };
  }
}

export function getSupabaseConfig() {
  const fromWindow = readWindowConfig();
  if (fromWindow.url && fromWindow.anonKey) return fromWindow;
  return readLocalConfig();
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function getSupabaseSetupMessage() {
  return "Configure o arquivo mos-runtime-config.js ou a chave local mos-valendo-supabase-config para ativar cadastro, login, recuperação de senha e logout reais.";
}

let supabaseClient = null;

function getAuthRedirectUrl() {
  const config = getSupabaseConfig();
  if (config.redirectUrl) return config.redirectUrl;

  if (globalThis.location?.origin && globalThis.location?.pathname) {
    return `${globalThis.location.origin}${globalThis.location.pathname}`;
  }

  return undefined;
}

export function normalizeAppMessage(input) {
  const message = String(input || "").trim();
  if (!message) return "";

  const exactMap = {
    "Email not confirmed": "Seu e-mail ainda não foi confirmado. Abra sua caixa de entrada e clique no link de confirmação antes de entrar.",
    "Invalid login credentials": "E-mail ou senha inválidos.",
    "User already registered": "Já existe uma conta cadastrada com este e-mail.",
    "Signup requires a valid password": "Defina uma senha válida para concluir o cadastro.",
    "Password should be at least 6 characters": "A senha precisa ter pelo menos 6 caracteres.",
    "Unable to validate email address: invalid format": "Digite um e-mail válido.",
    "Failed to fetch": "Não foi possível conectar ao servidor agora. Verifique sua internet e tente novamente.",
    "Email rate limit exceeded": "Você fez muitas tentativas em pouco tempo. Aguarde um pouco antes de tentar novamente.",
  };

  if (exactMap[message]) return exactMap[message];

  if (message.toLowerCase().includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Abra sua caixa de entrada e clique no link de confirmação antes de entrar.";
  }

  if (message.toLowerCase().includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }

  if (message.toLowerCase().includes("already registered")) {
    return "Já existe uma conta cadastrada com este e-mail.";
  }

  if (message.toLowerCase().includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (message.toLowerCase().includes("unable to validate email address")) {
    return "Digite um e-mail válido.";
  }

  if (message.toLowerCase().includes("rate limit")) {
    return "Você fez muitas tentativas em pouco tempo. Aguarde um pouco antes de tentar novamente.";
  }

  return message;
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (supabaseClient) return supabaseClient;
  const { url, anonKey } = getSupabaseConfig();
  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseClient;
}

export async function getCurrentAuthState() {
  const client = getSupabaseClient();
  if (!client) {
    return {
      configured: false,
      session: null,
      user: null,
      profile: null,
      measureEntries: [],
      supplements: [],
      waterHistory: {},
      waterTotals: {},
      planMeals: [],
      consumedMeals: {},
      feedbackEntries: [],
      appNotifications: [],
      error: null,
    };
  }

  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
    client.auth.getSession(),
    client.auth.getUser(),
  ]);

  const session = sessionData?.session || null;
  const user = userData?.user || null;
  const [profile, measureEntries, supplements, waterState, planMeals, consumedMeals, trainingState, feedbackEntries, appNotifications] = user
    ? await Promise.all([
        fetchProfile(user.id),
        fetchMeasureEntries(user.id),
        fetchSupplements(user.id),
        fetchWaterEntries(user.id),
        fetchPlanMeals(user.id),
        fetchConsumedMeals(user.id),
        fetchTrainingState(user.id),
        fetchFeedbackEntries(user.id),
        fetchAppNotifications(user.id, user.email),
      ])
    : [null, [], [], { history: {}, totals: {} }, [], {}, { plans: [], history: [] }, [], []];

  return {
    configured: true,
    session,
    user,
    profile,
    measureEntries,
    supplements,
    waterHistory: waterState.history,
    waterTotals: waterState.totals,
    planMeals,
    consumedMeals,
    trainingPlans: trainingState.plans,
    trainingHistory: trainingState.history,
    feedbackEntries,
    appNotifications,
    error: sessionError || userError || null,
  };
}

export async function signUpWithEmail({ name, email, password, age = 0, weight = 0, height = 0, calorieTarget = 0, goal = "", planFocus = "" }) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: new Error(getSupabaseSetupMessage()) };
  }

  const redirectTo = getAuthRedirectUrl();

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        name,
        age,
        weight,
        height,
        calorie_target: calorieTarget,
        goal,
        plan_focus: planFocus,
      },
    },
  });

  if (error) return { ok: false, error };

  const looksLikeExistingAccount = Boolean(
    data?.user &&
      !data?.session &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0,
  );

  if (looksLikeExistingAccount) {
    return {
      ok: false,
      duplicateAccount: true,
      error: new Error("User already registered"),
    };
  }

  if (data?.user) {
    await upsertProfile({
      id: data.user.id,
      name,
      email,
      age,
      weight,
      height,
      calorie_target: calorieTarget,
      goal,
      plan_focus: planFocus,
      target_weight: goal.includes("Perder") ? Math.max(0, Number(weight) - 5) : goal.includes("Ganhar") ? Number(weight) + 3 : Number(weight) || null,
    });
  }

  return {
    ok: true,
    user: data?.user || null,
    session: data?.session || null,
    needsEmailConfirmation: Boolean(data?.user && !data?.session),
  };
}

export async function signInWithEmail({ email, password }) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: new Error(getSupabaseSetupMessage()) };
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error };

  const user = data?.user || null;
  const profile = user ? await ensureProfileFromUser(user) : null;

  return {
    ok: true,
    user,
    session: data?.session || null,
    profile,
  };
}

export async function sendRecoverEmail(email) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: new Error(getSupabaseSetupMessage()) };
  }

  const redirectTo = getAuthRedirectUrl();

  const { error } = await client.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function updatePassword(password) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: new Error(getSupabaseSetupMessage()) };
  }

  const { data, error } = await client.auth.updateUser({ password });
  if (error) return { ok: false, error };
  return { ok: true, user: data?.user || null };
}

export function subscribeToAuthChanges(callback) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => data?.subscription?.unsubscribe?.();
}

export async function signOutUser() {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: new Error(getSupabaseSetupMessage()) };
  }
  const { error } = await client.auth.signOut();
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function getAuthenticatedUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data?.user || null;
}

export async function fetchProfile(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;

  const [{ data, error }, role] = await Promise.all([
    client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
    fetchUserRole(userId),
  ]);

  if (error) return null;
  return data ? { ...data, role } : null;
}

export async function fetchUserRole(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return "user";

  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return "user";
  return data?.role || "user";
}

export async function saveProfileData(userId, profile) {
  if (!userId) return { ok: false, error: new Error("Usuário não autenticado.") };

  const payload = {
    id: userId,
    name: profile.name || null,
    email: profile.email || null,
    city: profile.city || null,
    birth_date: profile.birthday || null,
    goal: profile.activeGoal || null,
    plan_focus: profile.planFocus || null,
    plan_notes: profile.planNotes || null,
    calorie_target: Number(profile.calorieTarget) || 0,
    water_target_ml: Number(profile.waterTargetMl) || 3000,
    updated_at: new Date().toISOString(),
  };

  const data = await upsertProfile(payload);
  if (!data) {
    return { ok: false, error: new Error("Não foi possível salvar o perfil agora.") };
  }

  return { ok: true, profile: data };
}

export async function fetchMeasureEntries(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  const { data, error } = await client
    .from("measure_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true });

  if (error || !Array.isArray(data)) return [];

  return data.map((entry) => ({
    id: entry.id,
    date: entry.entry_date,
    weight: Number(entry.weight) || 0,
    height: Number(entry.height) || 0,
    bodyFat: Number(entry.body_fat) || 0,
    muscleMass: Number(entry.muscle_mass) || 0,
    bodyWater: Number(entry.body_water) || 0,
    metabolicAge: Number(entry.metabolic_age) || 0,
  }));
}

export async function saveMeasureEntry(userId, entry) {
  const client = getSupabaseClient();
  if (!client || !userId) {
    return { ok: false, error: new Error("Usuário não autenticado.") };
  }

  const payload = {
    user_id: userId,
    entry_date: entry.date,
    weight: Number(entry.weight) || 0,
    height: Number(entry.height) || 0,
    body_fat: Number(entry.bodyFat) || 0,
    muscle_mass: Number(entry.muscleMass) || 0,
    body_water: Number(entry.bodyWater) || 0,
    metabolic_age: Number(entry.metabolicAge) || 0,
  };

  const { data: existing } = await client
    .from("measure_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("entry_date", entry.date)
    .maybeSingle();

  if (existing?.id) payload.id = existing.id;

  const { data, error } = await client
    .from("measure_entries")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) return { ok: false, error };

  await upsertProfile({
    id: userId,
    weight: payload.weight,
    height: payload.height,
    updated_at: new Date().toISOString(),
  });

  return {
    ok: true,
    entry: {
      id: data.id,
      date: data.entry_date,
      weight: Number(data.weight) || 0,
      height: Number(data.height) || 0,
      bodyFat: Number(data.body_fat) || 0,
      muscleMass: Number(data.muscle_mass) || 0,
      bodyWater: Number(data.body_water) || 0,
      metabolicAge: Number(data.metabolic_age) || 0,
    },
  };
}

export async function fetchSupplements(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  const { data, error } = await client
    .from("supplements")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) return [];

  return data.map((item) => ({
    id: item.id,
    period: item.preferred_time || "Livre",
    category: item.category || "Geral",
    time: item.preferred_time || "",
    name: item.name || "Suplemento",
    dosage: item.quantity || "",
    instruction: item.description || "",
    card: "bg-old-flax text-custom-jet",
  }));
}

export async function createSupplementEntry(userId, supplement) {
  const client = getSupabaseClient();
  if (!client || !userId) return { ok: false, error: new Error("Usuário não autenticado.") };

  const payload = {
    user_id: userId,
    name: supplement.name || "Suplemento",
    category: supplement.category || "Geral",
    quantity: supplement.dosage || "",
    preferred_time: supplement.time || null,
    description: supplement.instruction || "",
  };

  const { data, error } = await client.from("supplements").insert(payload).select().single();
  if (error) return { ok: false, error };

  return {
    ok: true,
    supplement: {
      id: data.id,
      period: data.preferred_time || "Livre",
      category: data.category || "Geral",
      time: data.preferred_time || "",
      name: data.name || "Suplemento",
      dosage: data.quantity || "",
      instruction: data.description || "",
      card: "bg-old-flax text-custom-jet",
    },
  };
}

export async function updateSupplementEntry(userId, supplementId, supplement) {
  const client = getSupabaseClient();
  if (!client || !userId || !supplementId) return { ok: false, error: new Error("Suplemento inválido.") };

  const payload = {
    name: supplement.name || "Suplemento",
    category: supplement.category || "Geral",
    quantity: supplement.dosage || "",
    preferred_time: supplement.time || null,
    description: supplement.instruction || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("supplements")
    .update(payload)
    .eq("id", supplementId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return { ok: false, error };

  return {
    ok: true,
    supplement: {
      id: data.id,
      period: data.preferred_time || "Livre",
      category: data.category || "Geral",
      time: data.preferred_time || "",
      name: data.name || "Suplemento",
      dosage: data.quantity || "",
      instruction: data.description || "",
      card: "bg-old-flax text-custom-jet",
    },
  };
}

export async function deleteSupplementEntry(userId, supplementId) {
  const client = getSupabaseClient();
  if (!client || !userId || !supplementId) return { ok: false, error: new Error("Suplemento inválido.") };

  const { error } = await client.from("supplements").delete().eq("id", supplementId).eq("user_id", userId);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function fetchWaterEntries(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return { history: {}, totals: {} };

  const { data, error } = await client
    .from("water_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("entry_time", { ascending: false });

  if (error || !Array.isArray(data)) return { history: {}, totals: {} };

  const history = {};
  const totals = {};

  data.forEach((item) => {
    const dateKey = item.entry_date;
    const entry = {
      id: item.id,
      label: item.label || "Água registrada",
      time: String(item.entry_time || "").slice(0, 5),
      amount: Number(item.amount_ml) || 0,
    };
    history[dateKey] = [...(history[dateKey] || []), entry];
    totals[dateKey] = (totals[dateKey] || 0) + entry.amount;
  });

  return { history, totals };
}

export async function createWaterEntry(userId, entry) {
  const client = getSupabaseClient();
  if (!client || !userId) return { ok: false, error: new Error("Usuário não autenticado.") };

  const payload = {
    user_id: userId,
    entry_date: entry.date,
    amount_ml: Number(entry.amount) || 0,
    entry_time: entry.time,
    label: entry.label || "Água registrada",
  };

  const { data, error } = await client.from("water_entries").insert(payload).select().single();
  if (error) return { ok: false, error };

  return {
    ok: true,
    entry: {
      id: data.id,
      label: data.label || "Água registrada",
      time: String(data.entry_time || "").slice(0, 5),
      amount: Number(data.amount_ml) || 0,
      date: data.entry_date,
    },
  };
}

export async function deleteWaterEntry(userId, entryId) {
  const client = getSupabaseClient();
  if (!client || !userId || !entryId) return { ok: false, error: new Error("Registro inválido.") };

  const { error } = await client.from("water_entries").delete().eq("id", entryId).eq("user_id", userId);
  if (error) return { ok: false, error };
  return { ok: true };
}

function normalizeDbFoodItem(item) {
  return {
    id: item.id,
    name: item.name || "Alimento",
    quantity: item.quantity_label || "1 porção",
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    carbs: Number(item.carbs) || 0,
    fat: Number(item.fat) || 0,
    benefit: item.benefit_text || "Mantém a refeição mais organizada dentro do plano.",
  };
}

export async function fetchPlanMeals(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  const [{ data: meals, error: mealsError }, { data: foods, error: foodsError }] = await Promise.all([
    client.from("plan_meals").select("*").eq("user_id", userId).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    client.from("plan_food_items").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  if (mealsError || foodsError || !Array.isArray(meals)) return [];

  const foodsByMeal = (foods || []).reduce((acc, item) => {
    acc[item.plan_meal_id] = [...(acc[item.plan_meal_id] || []), normalizeDbFoodItem(item)];
    return acc;
  }, {});

  return meals.map((meal, index) => ({
    id: meal.id,
    name: meal.title || `Refeição ${index + 1}`,
    title: meal.title || `Refeição ${index + 1}`,
    description: meal.description || "",
    time: "12:00",
    icon: "restaurant",
    accent: "#4558C8",
    color: "border-[#4558C8]",
    foods: foodsByMeal[meal.id] || [],
  }));
}

export async function createPlanMealEntry(userId, meal, sortOrder = 0) {
  const client = getSupabaseClient();
  if (!client || !userId) return { ok: false, error: new Error("Usuário não autenticado.") };

  const payload = {
    user_id: userId,
    title: meal.name || meal.title || "Refeição",
    description: meal.description || "",
    sort_order: sortOrder,
  };

  const { data, error } = await client.from("plan_meals").insert(payload).select().single();
  if (error) return { ok: false, error };

  return {
    ok: true,
    meal: {
      id: data.id,
      name: data.title,
      title: data.title,
      description: data.description || "",
      time: "12:00",
      icon: "restaurant",
      accent: "#4558C8",
      color: "border-[#4558C8]",
      foods: [],
    },
  };
}

export async function deletePlanMealEntry(userId, mealId) {
  const client = getSupabaseClient();
  if (!client || !userId || !mealId) return { ok: false, error: new Error("Refeição inválida.") };
  const { error } = await client.from("plan_meals").delete().eq("id", mealId).eq("user_id", userId);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function savePlanFoodItem(userId, mealId, food) {
  const client = getSupabaseClient();
  if (!client || !userId || !mealId) return { ok: false, error: new Error("Alimento inválido.") };

  const payload = {
    user_id: userId,
    plan_meal_id: mealId,
    name: food.name || "Alimento",
    quantity_label: food.quantity || "1 porção",
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,
    benefit_text: food.benefit || "",
    recommendation_text: null,
  };

  let query = client.from("plan_food_items");
  if (food.id && !String(food.id).startsWith("food-")) {
    payload.id = food.id;
  }

  const { data, error } = await query.upsert(payload, { onConflict: "id" }).select().single();
  if (error) return { ok: false, error };
  return { ok: true, food: normalizeDbFoodItem(data) };
}

export async function deletePlanFoodItem(userId, foodId) {
  const client = getSupabaseClient();
  if (!client || !userId || !foodId) return { ok: false, error: new Error("Alimento inválido.") };
  const { error } = await client.from("plan_food_items").delete().eq("id", foodId).eq("user_id", userId);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function fetchConsumedMeals(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return {};

  const [{ data: meals, error: mealsError }, { data: foods, error: foodsError }] = await Promise.all([
    client.from("consumed_meals").select("*").eq("user_id", userId).order("entry_date", { ascending: false }).order("meal_time", { ascending: true }).order("created_at", { ascending: true }),
    client.from("consumed_food_items").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  if (mealsError || foodsError || !Array.isArray(meals)) return {};

  const foodsByMeal = (foods || []).reduce((acc, item) => {
    acc[item.meal_id] = [...(acc[item.meal_id] || []), normalizeDbFoodItem(item)];
    return acc;
  }, {});

  return meals.reduce((acc, meal) => {
    const entry = {
      id: meal.id,
      name: meal.title || "Refeição",
      title: meal.title || "Refeição",
      description: meal.description || "",
      time: String(meal.meal_time || "").slice(0, 5) || "Agora",
      icon: "restaurant",
      cardClass: "bg-[#EF5F37] text-white",
      foods: foodsByMeal[meal.id] || [],
    };
    acc[meal.entry_date] = [...(acc[meal.entry_date] || []), entry];
    return acc;
  }, {});
}

export async function createConsumedMealEntry(userId, date, meal) {
  const client = getSupabaseClient();
  if (!client || !userId) return { ok: false, error: new Error("Usuário não autenticado.") };

  const now = new Date();
  const informedTime = String(meal.time || "").match(/^(\d{1,2}):(\d{2})$/);
  const time = informedTime
    ? `${String(Math.max(0, Math.min(23, Number(informedTime[1]) || 0))).padStart(2, "0")}:${String(Math.max(0, Math.min(59, Number(informedTime[2]) || 0))).padStart(2, "0")}:00`
    : `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
  const payload = {
    user_id: userId,
    entry_date: date,
    title: meal.name || meal.title || "Refeição",
    description: meal.description || "",
    meal_time: time,
  };

  const { data, error } = await client.from("consumed_meals").insert(payload).select().single();
  if (error) return { ok: false, error };

  return {
    ok: true,
    meal: {
      id: data.id,
      name: data.title || "Refeição",
      title: data.title || "Refeição",
      description: data.description || "",
      time: String(data.meal_time || "").slice(0, 5) || "Agora",
      icon: "restaurant",
      cardClass: "bg-[#EF5F37] text-white",
      foods: [],
    },
  };
}

export async function deleteConsumedMealEntry(userId, mealId) {
  const client = getSupabaseClient();
  if (!client || !userId || !mealId) return { ok: false, error: new Error("Refeição inválida.") };
  const { error } = await client.from("consumed_meals").delete().eq("id", mealId).eq("user_id", userId);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function saveConsumedFoodItem(userId, mealId, food) {
  const client = getSupabaseClient();
  if (!client || !userId || !mealId) return { ok: false, error: new Error("Alimento inválido.") };

  const payload = {
    user_id: userId,
    meal_id: mealId,
    name: food.name || "Alimento",
    quantity_label: food.quantity || "1 porção",
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,
    benefit_text: food.benefit || "",
    source_label: "MOS",
  };

  if (food.id && !String(food.id).startsWith("food-")) {
    payload.id = food.id;
  }

  const { data, error } = await client.from("consumed_food_items").upsert(payload, { onConflict: "id" }).select().single();
  if (error) return { ok: false, error };
  return { ok: true, food: normalizeDbFoodItem(data) };
}

export async function deleteConsumedFoodItem(userId, foodId) {
  const client = getSupabaseClient();
  if (!client || !userId || !foodId) return { ok: false, error: new Error("Alimento inválido.") };
  const { error } = await client.from("consumed_food_items").delete().eq("id", foodId).eq("user_id", userId);
  if (error) return { ok: false, error };
  return { ok: true };
}

function normalizeTrainingExercise(item = {}, index = 0) {
  return {
    id: item.id || `training-exercise-${index + 1}`,
    name: item.name || `Exercício ${index + 1}`,
    focus: item.focus || "",
    sets: Number(item.sets) || 3,
    reps: item.reps || "10-12",
    targetReps: Number(item.targetReps) || 12,
    restSeconds: Number(item.restSeconds) || 60,
    suggestedLoadKg: Number(item.suggestedLoadKg) || 0,
    loadDelta: item.loadDelta || "",
  };
}

function normalizeTrainingPlanRecord(item = {}, index = 0) {
  const exercises = Array.isArray(item.exercises) ? item.exercises : [];
  return {
    id: item.id,
    name: item.name || `Treino ${index + 1}`,
    estimatedMinutes: Number(item.estimated_minutes ?? item.estimatedMinutes) || 45,
    exercises: exercises.map((exercise, exerciseIndex) => normalizeTrainingExercise(exercise, exerciseIndex)),
  };
}

function normalizeTrainingSessionRecord(item = {}) {
  const exercises = Array.isArray(item.exercises) ? item.exercises : [];
  return {
    id: item.id,
    date: item.entry_date,
    completedAt: item.completed_at || item.created_at,
    planId: item.plan_id,
    planName: item.plan_name || "Treino",
    durationSeconds: Number(item.duration_seconds) || 0,
    exercisesCompleted: Number(item.exercises_completed) || 0,
    seriesCompleted: Number(item.series_completed) || 0,
    volumeTotal: Number(item.volume_total) || 0,
    exercises: exercises.map((exercise, index) => normalizeTrainingExercise(exercise, index)),
  };
}

export async function fetchTrainingState(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return { plans: [], history: [] };

  const [{ data: plans, error: plansError }, { data: sessions, error: sessionsError }] = await Promise.all([
    client
      .from("training_plans")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    client
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  if (plansError || sessionsError) {
    return {
      plans: null,
      history: null,
      error: plansError || sessionsError,
    };
  }

  return {
    plans: Array.isArray(plans) ? plans.map(normalizeTrainingPlanRecord) : [],
    history: Array.isArray(sessions) ? sessions.map(normalizeTrainingSessionRecord) : [],
  };
}

export async function saveTrainingPlanEntry(userId, plan, sortOrder = 0) {
  const client = getSupabaseClient();
  if (!client || !userId) return { ok: false, error: new Error("Usuário não autenticado.") };

  const payload = {
    user_id: userId,
    name: plan.name || "Treino",
    estimated_minutes: Number(plan.estimatedMinutes) || 45,
    exercises: Array.isArray(plan.exercises) ? plan.exercises.map((exercise, index) => normalizeTrainingExercise(exercise, index)) : [],
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (plan.id && !String(plan.id).startsWith("training-plan")) payload.id = plan.id;

  const { data, error } = await client
    .from("training_plans")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) return { ok: false, error };
  return { ok: true, plan: normalizeTrainingPlanRecord(data, sortOrder) };
}

export async function createTrainingSessionEntry(userId, session) {
  const client = getSupabaseClient();
  if (!client || !userId) return { ok: false, error: new Error("Usuário não autenticado.") };

  const payload = {
    user_id: userId,
    entry_date: session.date,
    completed_at: session.completedAt || new Date().toISOString(),
    plan_id: session.planId && !String(session.planId).startsWith("training-plan") ? session.planId : null,
    plan_name: session.planName || "Treino",
    duration_seconds: Number(session.durationSeconds) || 0,
    exercises_completed: Number(session.exercisesCompleted) || 0,
    series_completed: Number(session.seriesCompleted) || 0,
    volume_total: Number(session.volumeTotal) || 0,
    exercises: Array.isArray(session.exercises) ? session.exercises.map((exercise, index) => normalizeTrainingExercise(exercise, index)) : [],
  };

  const { data, error } = await client.from("training_sessions").insert(payload).select().single();
  if (error) return { ok: false, error };
  return { ok: true, session: normalizeTrainingSessionRecord(data) };
}

export async function upsertProfile(profile) {
  const client = getSupabaseClient();
  if (!client || !profile?.id) return null;

  const payload = {
    id: profile.id,
    name: profile.name || null,
    email: profile.email || null,
    city: profile.city || null,
    birth_date: profile.birth_date || null,
    goal: profile.goal || null,
    plan_focus: profile.plan_focus || null,
    plan_notes: profile.plan_notes || null,
    weight: Number(profile.weight) || null,
    target_weight: Number(profile.target_weight) || null,
    height: Number(profile.height) || null,
    age: Number(profile.age) || null,
    calorie_target: Number(profile.calorie_target) || 0,
    water_target_ml: Number(profile.water_target_ml) || 3000,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function ensureProfileFromUser(user) {
  if (!user) return null;

  const existing = await fetchProfile(user.id);
  if (existing) return existing;

  return upsertProfile({
    id: user.id,
    name: user.user_metadata?.name || "",
    email: user.email || "",
    age: Number(user.user_metadata?.age) || null,
    weight: Number(user.user_metadata?.weight) || null,
    height: Number(user.user_metadata?.height) || null,
    calorie_target: Number(user.user_metadata?.calorie_target) || null,
    goal: user.user_metadata?.goal || null,
    plan_focus: user.user_metadata?.plan_focus || null,
  });
}

export async function fetchFeedbackEntries(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  const { data, error } = await client
    .from("feedback_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) return [];

  return data.map((item) => ({
    id: item.id,
    section: item.section,
    message: item.message,
    createdAt: item.created_at,
  }));
}

export async function createFeedbackEntry(userId, entry) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: new Error("Supabase não configurado.") };

  const payload = {
    user_id: userId || null,
    section: entry.section || "Geral",
    message: entry.message || "",
  };

  const { data, error } = await client.from("feedback_entries").insert(payload).select().single();
  if (error) return { ok: false, error };

  return {
    ok: true,
    feedback: {
      id: data.id,
      section: data.section,
      message: data.message,
      createdAt: data.created_at,
    },
  };
}

function normalizeAppNotification(item = {}) {
  return {
    id: item.id,
    title: item.title || "Mensagem do MOS!",
    body: item.message || item.body || "",
    tag: item.type || item.tag || "MOS!",
    createdAt: item.created_at || new Date().toISOString(),
    audience: item.audience || "all",
    targetEmail: item.target_email || "",
  };
}

export async function fetchAppNotifications(userId, email = "") {
  const client = getSupabaseClient();
  if (!client) return [];

  const queries = [
    client
      .from("app_notifications")
      .select("*")
      .eq("audience", "all")
      .order("created_at", { ascending: false })
      .limit(20),
  ];

  if (userId) {
    queries.push(
      client
        .from("app_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    );
  }

  if (email) {
    queries.push(
      client
        .from("app_notifications")
        .select("*")
        .eq("target_email", email)
        .order("created_at", { ascending: false })
        .limit(20),
    );
  }

  const results = await Promise.all(queries);
  const items = results.flatMap(({ data, error }) => (error || !Array.isArray(data) ? [] : data));
  const unique = new Map();
  items.forEach((item) => unique.set(item.id, normalizeAppNotification(item)));
  return [...unique.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 20);
}

export async function createAppNotification(userId, entry) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: new Error("Supabase não configurado.") };

  const payload = {
    created_by: userId || null,
    audience: entry.audience || "all",
    user_id: entry.userId || null,
    target_email: entry.targetEmail || null,
    title: entry.title || "Mensagem do MOS!",
    message: entry.message || "",
    type: entry.type || "Aviso",
  };

  const { data, error } = await client.from("app_notifications").insert(payload).select().single();
  if (error) return { ok: false, error };
  return { ok: true, notification: normalizeAppNotification(data) };
}
