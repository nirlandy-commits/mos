export function renderSignedInScreen(screen, renderers, { isAdminUser = false } = {}) {
  const fallback = renderers.home;
  if (!screen) return fallback?.();

  if (screen === "admin-notifications") {
    return isAdminUser ? renderers.adminNotifications?.() ?? fallback?.() : fallback?.();
  }

  const directMap = {
    home: renderers.home,
    food: renderers.food,
    "food-detail": renderers.foodDetail,
    "ingredient-detail": renderers.ingredientDetail,
    plan: renderers.plan,
    "plan-config": renderers.planConfig,
    "plan-detail": renderers.planDetail,
    supplements: renderers.supplements,
    "register-supplement": renderers.registerSupplement,
    "supplement-detail": renderers.supplementDetail,
    water: renderers.water,
    training: renderers.training,
    "training-detail": renderers.trainingDetail,
    "training-execution": renderers.trainingExecution,
    "training-summary": renderers.trainingSummary,
    "training-edit": renderers.trainingEdit,
    profile: renderers.profile,
    measures: renderers.measures,
    "about-app": renderers.aboutApp,
    "app-news": renderers.appNews,
    history: renderers.history,
    search: renderers.search,
  };

  return directMap[screen]?.() ?? fallback?.();
}

export function getMenuTargetScreen(title) {
  const menuMap = {
    "Início": "home",
    "Meu perfil": "profile",
    "Minhas Medidas": "measures",
    "Configurar plano": "plan-config",
    "Sobre o App": "about-app",
    "Admin de notificações": "admin-notifications",
  };

  return menuMap[title] || "home";
}
