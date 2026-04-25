export function renderHomeScreen(ctx) {
  const {
    html,
    getSectionBackground,
    TopBar,
    BottomNav,
    Icon,
    state,
    date,
    summary,
    remaining,
    todayKey,
    trainingHistory,
    waterGoal,
    water,
    latestMeasure,
    latestBmi,
    executionSignals,
    evaluateDailyBrain,
    setScreen,
    setDrawerOpen,
    openSearch,
    openNotifications,
    setModal,
  } = ctx;

  const currentMeals = state.consumedMeals[date] || [];
  const formattedConsumed = Math.round(summary.calories).toLocaleString("pt-BR");
  const formattedRemaining = Math.max(0, Math.round(remaining)).toLocaleString("pt-BR");
  const formattedTarget = Math.round(state.profile.calorieTarget).toLocaleString("pt-BR");
  const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
  const nowHour = new Date().getHours();
  const greeting = nowHour < 12 ? "Bom dia" : nowHour < 18 ? "Boa tarde" : "Boa noite";
  const trainingDoneToday = trainingHistory.some((entry) => entry.date === todayKey);
  const waterRemaining = Math.max(0, waterGoal - water);
  const brain = evaluateDailyBrain({
    caloriesConsumed: summary.calories,
    calorieTarget: state.profile.calorieTarget,
    waterConsumedMl: water,
    waterTargetMl: waterGoal,
    trainingDone: trainingDoneToday,
  });
  const insight = brain.output.insight;
  const profileInsight = brain.output.recommendation;
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
      status: summary.calories <= 0 ? "Sem registro" : remaining <= 0 ? "Ajustar hoje" : "Dentro da meta",
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
