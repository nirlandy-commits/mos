export function renderTrainingScreen(ctx) {
  const {
    html,
    getSectionBackground,
    TopBar,
    BottomNav,
    Icon,
    state,
    todayKey,
    trainingPlans,
    trainingHistory,
    TRAINING_THEME,
    summarizeExerciseNames,
    getPrimaryActionClass,
    setScreen,
    setDrawerOpen,
    openSearch,
    openNotifications,
    openTrainingDetail,
    openTrainingCreate,
    openTrainingImport,
    getSecondaryActionClass,
  } = ctx;

  const nowHour = new Date().getHours();
  const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";

  return html`
    <div className="${getSectionBackground("training")} text-on-surface min-h-screen pb-32">
      <${TopBar} title="Treino" leftIcon="menu" centerBold=${false} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("training")} onRight=${openNotifications} />
      <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
        <section className="space-y-3">
          <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
          <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)", lineHeight: "1.08" }}>Meus treinos</h1>
          <p className="text-[0.95rem] text-[#334155]">Abra um treino para ver exercícios e registrar a sessão.</p>
        </section>

        <section className="space-y-3">
          ${trainingPlans.length
            ? trainingPlans.map((plan) => {
                const completedToday = trainingHistory.some((entry) => entry.planId === plan.id && entry.date === todayKey);
                return html`
                  <button
                    className="mos-card rounded-2xl p-5 w-full text-left active:scale-[0.98] transition-transform flex flex-col gap-4"
                    onClick=${() => openTrainingDetail(plan.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[0.6875rem] ${TRAINING_THEME.accentText}">Treino</span>
                        <h3 className="text-[1.25rem] font-bold text-jet-black">${plan.name}</h3>
                      </div>
                      ${completedToday
                        ? html`<div className="w-11 h-11 rounded-full ${TRAINING_THEME.accentSurface} flex items-center justify-center shrink-0"><${Icon} name="check" className="text-[#101846]" /></div>`
                        : html`<${Icon} name="arrow_forward" className="${TRAINING_THEME.accentText} text-[1.75rem] shrink-0" />`}
                    </div>
                    <div className="flex items-center gap-4 text-sm ${TRAINING_THEME.mutedText}">
                      <span>${plan.estimatedMinutes} min</span>
                      <span>${plan.exercises.length} exercícios</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[0.75rem] font-semibold ${TRAINING_THEME.accentText}">Exercícios do treino</p>
                      <p className="text-sm ${TRAINING_THEME.mutedText}">${summarizeExerciseNames(plan)}</p>
                    </div>
                    ${completedToday ? html`<p className="text-sm ${TRAINING_THEME.accentText} font-bold">Treino concluído hoje</p>` : null}
                  </button>
                `;
              })
            : html`
                <div className="mos-card rounded-2xl p-5 text-jet-black">
                  <p className="font-bold text-base">Você ainda não criou um treino.</p>
                  <p className="text-sm text-on-surface-variant mt-1">Crie seu primeiro treino para começar a acompanhar suas sessões e evoluções.</p>
                </div>
              `}
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className=${getSecondaryActionClass(false)} onClick=${openTrainingImport}>
            Importar treino
          </button>
          <button className=${getPrimaryActionClass(false)} onClick=${openTrainingCreate}>
            Novo treino
          </button>
        </div>
      </main>
      <${BottomNav} active="training" onChange=${setScreen} />
    </div>
  `;
}
