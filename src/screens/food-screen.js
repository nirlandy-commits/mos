export function renderFoodScreen(ctx) {
  const {
    html,
    getSectionBackground,
    TopBar,
    BottomNav,
    Icon,
    state,
    summary,
    remaining,
    todayKey,
    foodDate,
    foodDateLabel,
    foodMeals,
    summarizeFoods,
    setScreen,
    setDrawerOpen,
    openSearch,
    openNotifications,
    openFoodCalendar,
    goToTodayFood,
    setModal,
    setSelectedConsumedId,
  } = ctx;

  const nowHour = new Date().getHours();
  const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
  const consumedCalories = Math.round(summary.calories);
  const calorieTarget = Math.round(state.profile.calorieTarget);
  const remainingCalories = Math.max(0, Math.round(remaining));
  const rawRemainingCalories = Math.round(remaining);
  const percentRemaining = calorieTarget > 0 ? rawRemainingCalories / calorieTarget : 0;
  const foodHeadline =
    rawRemainingCalories <= 0
      ? "Atenção ao excesso"
      : percentRemaining > 0.3
        ? "Ainda há margem hoje"
        : percentRemaining >= 0.1
          ? "Meta próxima"
          : "Meta quase atingida";
  const nextMealRecommendation =
    rawRemainingCalories <= 0
      ? "Evite consumir mais calorias hoje"
      : percentRemaining > 0.3
        ? "Você pode reforçar a próxima refeição"
        : percentRemaining >= 0.1
          ? "Mantenha refeições equilibradas"
          : "Prefira algo leve na próxima refeição";

  return html`
    <div className="${getSectionBackground()} text-on-surface min-h-screen pb-40">
      <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("food")} onRight=${openNotifications} />
      <main className="pt-24 px-4 max-w-md mx-auto space-y-8">
        <section className="space-y-3">
          <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
          <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)", lineHeight: "1.08" }}>
            ${foodHeadline}
          </h1>
          <p className="text-[0.95rem] text-[#334155]">Veja rápido o que já entrou, o que falta e onde ajustar hoje. <span className="emoji-badge emoji-badge--food" aria-hidden="true">🍽️</span></p>
        </section>
        <section className="food-summary-card rounded-[28px] p-6 space-y-5">
          <div className="space-y-2">
            <span className="text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-[#475569]">Resumo do dia</span>
            <p className="text-[0.95rem] text-[#334155]">Uma leitura simples para seguir o dia com clareza.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="food-summary-metric">
              <span className="food-summary-label">Comidas</span>
              <strong className="food-summary-value">${consumedCalories.toLocaleString("pt-BR")}</strong>
              <span className="food-summary-unit">kcal</span>
            </div>
            <div className="food-summary-metric">
              <span className="food-summary-label">Meta</span>
              <strong className="food-summary-value">${calorieTarget.toLocaleString("pt-BR")}</strong>
              <span className="food-summary-unit">kcal</span>
            </div>
            <div className="food-summary-metric">
              <span className="food-summary-label">Restante</span>
              <strong className="food-summary-value">${remainingCalories.toLocaleString("pt-BR")}</strong>
              <span className="food-summary-unit">kcal</span>
            </div>
          </div>
          <p className="text-[0.92rem] text-[#334155] leading-[1.45]">${nextMealRecommendation}</p>
        </section>
        <section className="w-full">
          <button className="w-full food-hero-card food-calendar-card rounded-2xl p-6 flex justify-between items-center active:scale-98 transition-transform text-left" onClick=${openFoodCalendar}>
            <div className="space-y-1">
              <span className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#475569]">Calendário</span>
              <h2 className="font-headline text-[1.8rem] font-bold text-[#0F172A]">${foodDateLabel}</h2>
              <p className="text-[0.9rem] text-[#334155]">Abra outra data ou volte para hoje quando quiser comparar.</p>
            </div>
            <div className="food-calendar-badge">
              <${Icon} name="calendar_today" className="text-[#0F172A]" />
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
        <section className="grid grid-cols-1 gap-5">
          ${foodMeals.length
            ? foodMeals.map((meal) => {
                const mealTotal = summarizeFoods(meal.foods);
                const mealCalories = Math.round(mealTotal.calories);
                const hasMealCalories = mealCalories > 0;
                const mealDescription =
                  Array.isArray(meal.foods) && meal.foods.length
                    ? meal.foods.map((food) => `${food.name}${food.quantity ? ` (${food.quantity})` : ""}`).join(", ")
                    : meal.description || "Sem registro";
                const mealCalorieLabel = mealCalories <= 300 ? "Baixo" : mealCalories <= 600 ? "OK" : "Alto";
                return html`
                  <button className="mos-card food-meal-card rounded-[26px] p-7 min-h-[176px] active:scale-98 transition-transform cursor-pointer text-left flex flex-col justify-between gap-8" onClick=${() => { setSelectedConsumedId(meal.id); setScreen("food-detail"); }}>
                    <div className="food-meal-top">
                      <div className="food-meal-icon">
                        <${Icon} name=${meal.icon || "restaurant"} className="text-[#0F172A] text-[1.55rem]" />
                      </div>
                      <${Icon} name="arrow_forward" className="food-meal-arrow" />
                    </div>
                    <div className="food-meal-copy">
                      <h3 className="font-headline text-[1.82rem] font-[320] leading-none text-[#0F172A]">${meal.name}</h3>
                      <p className="food-meal-description">${mealDescription}</p>
                    </div>
                    <div className="food-meal-footer">
                      ${hasMealCalories
                        ? html`
                            <div className="food-meal-calories">
                              <span className="food-meal-calories-value">${mealCalories}</span>
                              <span className="food-meal-calories-unit">kcal</span>
                            </div>
                            <span className="food-meal-chip">${mealCalorieLabel}</span>
                          `
                        : html`<span className="food-meal-empty">Sem registro</span>`}
                    </div>
                  </button>
                `;
              })
            : html`
                <div className="mos-card rounded-[26px] p-6 text-center space-y-3">
                  <p className="font-bold text-[#0F172A]">Nenhuma refeição registrada</p>
                  <p className="text-[0.96rem] text-[#334155]">Escolha outra data ou registre uma refeição para este dia.</p>
                </div>
              `}
        </section>
        <div className="fixed left-0 w-full px-4 z-40 pointer-events-none mos-fixed-cta">
          <button className="mos-fixed-cta-button font-headline shadow-[0_18px_34px_rgba(239,95,55,0.24)]" onClick=${() => setModal("food")}>
            <${Icon} name="add_circle" />
            Registrar comida
          </button>
        </div>
      </main>
      <${BottomNav} active="food" onChange=${setScreen} />
    </div>
  `;
}
