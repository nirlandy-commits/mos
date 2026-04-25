function renderPlanModeTabs({ html, activeMode, setScreen }) {
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

function renderPlanModeHeader({ html, activeMode, headline, support, nowHour, profileName, setScreen }) {
  return html`
    <section className="plan-mode-header">
      <div className="plan-mode-copy">
        <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
        <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)", lineHeight: "1.08" }}>
          ${headline}
        </h1>
        ${support ? html`<p className="text-[0.95rem] text-[#334155]">${support}</p>` : null}
      </div>
      <${renderPlanModeTabs} html=${html} activeMode=${activeMode} setScreen=${setScreen} />
    </section>
  `;
}

export function renderPlanScreen(ctx) {
  const {
    html,
    getSectionBackground,
    TopBar,
    BottomNav,
    Icon,
    state,
    summary,
    water,
    waterGoal,
    trainingHistory,
    todayKey,
    sortedPlanMeals,
    selectedPlanId,
    planTimelineRef,
    evaluateDailyBrain,
    getCurrentPlanMeal,
    summarizeFoods,
    formatMealTimeLabel,
    getFoodAccent,
    setScreen,
    setDrawerOpen,
    openSearch,
    openNotifications,
    setSelectedPlanId,
    setSubstituteFood,
  } = ctx;

  const nowHour = new Date().getHours();
  const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
  const planBrainState = evaluateDailyBrain({
    caloriesConsumed: summary.calories,
    calorieTarget: state.profile.calorieTarget,
    waterConsumedMl: water,
    waterTargetMl: waterGoal,
    trainingDone: trainingHistory.some((entry) => entry.date === todayKey),
  }).state;
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
          html=${html}
          activeMode="plan"
          headline=${planHeadline}
          nowHour=${nowHour}
          profileName=${profileName}
          setScreen=${setScreen}
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
