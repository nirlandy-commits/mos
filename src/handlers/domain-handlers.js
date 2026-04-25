export function createDomainHandlers(deps) {
  const {
    uid,
    authConfigured,
    foodDate,
    todayKey,
    consumedMeals,
    getAuthenticatedUser,
    createConsumedMealEntry,
    appendWaterAmount,
    saveMeasureEntry,
    createFeedbackEntry,
    normalizeMeasureEntry,
    mutate,
    clearDraft,
    setModal,
    setScreen,
    showToast,
    showAuthNotice,
  } = deps;

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
      draft.consumedMeals[foodDate] = [
        ...(draft.consumedMeals[foodDate] || (foodDate === todayKey ? consumedMeals : [])),
        meal,
      ];
    });
    clearDraft("modal-food");
    showToast("Refeição registrada.");
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
      id: `measure-${formData.get("date") || todayKey}`,
      date: formData.get("date") || todayKey,
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
    showToast("Medidas salvas.");
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
        ...(Array.isArray(draft.feedbackEntries) ? draft.feedbackEntries : []),
      ].slice(0, 10);
    });
    clearDraft("modal-feedback");
    setModal(null);
    showToast("Feedback enviado.");
    setScreen("about-app");
  }

  return {
    registerMeal,
    registerWater,
    saveMeasures,
    saveFeedback,
  };
}
