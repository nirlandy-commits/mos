export function buildSignedOutState({
  initialState,
  current,
  email = "",
  registered = current?.auth?.registered ?? false,
}) {
  return {
    ...structuredClone(initialState),
    auth: {
      ...structuredClone(initialState).auth,
      registered,
      signedIn: false,
      email,
      password: "",
    },
  };
}

export function hydrateAuthenticatedState(current, result, { fallbackEmail = "", normalizeTrainingPlan }) {
  const currentPlanMeals = Array.isArray(current.planMeals) ? current.planMeals : [];
  return {
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
    planMeals: Array.isArray(result.planMeals)
      ? result.planMeals.map((meal) => {
        const localMeal = currentPlanMeals.find((item) => item.id === meal.id);
        return {
          ...meal,
          time: localMeal?.time || meal.time,
          description: localMeal?.description || meal.description,
        };
      })
      : current.planMeals,
    consumedMeals: result.consumedMeals || current.consumedMeals,
    trainingPlans: Array.isArray(result.trainingPlans)
      ? result.trainingPlans.map((plan, index) => normalizeTrainingPlan(plan, index, { allowEmptyExercises: true }))
      : current.trainingPlans,
    trainingHistory: Array.isArray(result.trainingHistory) ? result.trainingHistory : current.trainingHistory,
    feedbackEntries: Array.isArray(result.feedbackEntries) ? result.feedbackEntries : current.feedbackEntries,
    appNotifications: Array.isArray(result.appNotifications) ? result.appNotifications : current.appNotifications,
  };
}
