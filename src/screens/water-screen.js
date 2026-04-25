export function renderWaterScreen(ctx) {
  const {
    html,
    getSectionBackground,
    TopBar,
    BottomNav,
    Icon,
    state,
    summary,
    trainingHistory,
    todayKey,
    water,
    waterGoal,
    waterEntries,
    waterHistoryDate,
    waterViewDateLabel,
    evaluateDailyBrain,
    setScreen,
    setDrawerOpen,
    openSearch,
    openNotifications,
    goToTodayWaterHistory,
    appendWaterAmount,
    setModal,
    openWaterHistory,
    askDeleteConfirm,
    getAuthenticatedUser,
    deleteWaterEntry,
    authConfigured,
    showAuthNotice,
    mutate,
  } = ctx;

  const nowHour = new Date().getHours();
  const profileName = state.profile.name ? state.profile.name.split(" ")[0] : "amigo";
  const waterProgress = Math.min(100, (water / waterGoal) * 100);
  const remainingWater = Math.max(0, waterGoal - water);
  const quickWaterOptions = [200, 300, 500];
  const selectedEntriesCount = waterEntries.length;
  const waterInsight = evaluateDailyBrain({
    caloriesConsumed: summary.calories,
    calorieTarget: state.profile.calorieTarget,
    waterConsumedMl: water,
    waterTargetMl: waterGoal,
    trainingDone: trainingHistory.some((entry) => entry.date === todayKey),
  }).output.insight;

  return html`
    <div className="${getSectionBackground("water")} text-on-surface min-h-screen pb-32">
      <${TopBar} onLeft=${() => setDrawerOpen(true)} onSearch=${() => openSearch("water")} onRight=${openNotifications} />
      <main className="pt-24 px-6 max-w-md mx-auto space-y-6">
        <section className="space-y-3">
          <p className="text-[0.95rem] font-semibold text-[#0F172A]">Boa ${nowHour < 12 ? "manhã" : nowHour < 18 ? "tarde" : "noite"}, ${profileName}!</p>
          <h1 className="font-black text-[#0F172A]" style=${{ fontSize: "clamp(2rem, 6.5vw, 3rem)", lineHeight: "1.06" }}>
            Água hoje
          </h1>
          <p className="text-[0.95rem] text-[#334155]">Veja quanto entrou e quanto falta para a meta.</p>
        </section>
        <section className="water-focus-hero">
          <div className="water-status-head">
            <span className="text-[0.78rem] font-black text-[#64748B]">Status da água</span>
            <span className="water-progress-chip">${Math.round(waterProgress)}%</span>
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="water-primary-number">
                ${remainingWater > 0 ? `Faltam ${remainingWater}` : "Meta batida"}
                ${remainingWater > 0 ? html`<span>ml</span>` : null}
              </h2>
              <p className="water-status-copy">${Math.round(water)} de ${waterGoal} ml consumidos hoje</p>
            </div>
            <div className="water-progress-track" aria-hidden="true">
              <div className="water-progress-fill" style=${{ width: `${waterProgress}%` }}></div>
            </div>
          </div>
          <div className="water-insight-line">
            <${Icon} name="water_drop" className="text-[1.05rem]" filled=${true} />
            <p>${waterInsight}</p>
          </div>
          ${waterHistoryDate !== todayKey
            ? html`
                <div className="flex justify-end">
                  <button
                    className="min-h-11 px-4 rounded-[10px] bg-[#fff4ef] border border-[#ffd8ce] text-[#EF5F37] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    onClick=${goToTodayWaterHistory}
                  >
                    <${Icon} name="today" className="text-[#EF5F37]" />
                    <span>Ver hoje</span>
                  </button>
                </div>
              `
            : null}
        </section>

        <section className="water-action-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[1.15rem] font-black text-[#0F172A]">Adicionar água</h2>
              <p className="text-sm text-[#475569]">Toque uma vez para somar no dia.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            ${quickWaterOptions.map(
              (amount) => html`
                <button className="water-quick-button" onClick=${() => appendWaterAmount(amount)}>
                  <${Icon} name="water_drop" className="text-[1.15rem]" filled=${true} />
                  <span>${amount} ml</span>
                </button>
              `
            )}
            <button className="water-quick-button water-quick-button--custom" onClick=${() => setModal("water")}>
              <${Icon} name="add_circle" className="text-[1.15rem]" />
              <span>Outro valor</span>
            </button>
          </div>
        </section>

        <section className="water-support-panel">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-[#0F172A]">
              ${waterHistoryDate === todayKey ? `Hoje você já registrou ${selectedEntriesCount} ${selectedEntriesCount === 1 ? "vez" : "vezes"}` : `Registros de ${waterViewDateLabel}`}
            </h3>
            <button className="water-history-link" onClick=${openWaterHistory}>Ver tudo</button>
          </div>
          <div className="space-y-1">
            ${waterEntries.length
              ? waterEntries.slice(0, 4).map(
                  (entry) => html`
                    <div className="water-history-row">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[1.05rem] font-black leading-none text-[#0F172A]">${entry.amount}</span>
                            <span className="text-[0.75rem] font-bold text-[#64748B]">ml</span>
                          </div>
                          <p className="text-[0.82rem] text-[#64748B]">${entry.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[0.9rem] font-bold text-[#475569]">${entry.time}</span>
                        <button
                          className="w-9 h-9 rounded-full text-[#EF5F37] flex items-center justify-center active:scale-95 transition-transform"
                          onClick=${() => askDeleteConfirm({
                            title: "Apagar registro de água",
                            message: "Tem certeza que deseja apagar este item?",
                            onConfirm: async () => {
                              if (authConfigured) {
                                const user = await getAuthenticatedUser();
                                if (!user) {
                                  showAuthNotice("Sua sessão não foi encontrada. Entre novamente para apagar o registro.");
                                  return;
                                }
                                const result = await deleteWaterEntry(user.id, entry.id);
                                if (!result.ok) {
                                  showAuthNotice(result.error?.message || "Não foi possível apagar o registro agora.");
                                  return;
                                }
                              }
                              mutate((draft) => {
                                draft.waterHistory[waterHistoryDate] = (draft.waterHistory[waterHistoryDate] || waterEntries).filter((item) => item.id !== entry.id);
                                draft.water[waterHistoryDate] = Math.max(0, (draft.water[waterHistoryDate] || water) - entry.amount);
                              });
                            },
                          })}
                        >
                          <${Icon} name="delete" className="text-[1rem]" />
                        </button>
                      </div>
                    </div>
                  `
                )
              : html`
                  <div className="water-empty-state">
                    <p className="font-bold text-[#0F172A]">Nenhum registro nesse dia</p>
                    <p className="text-sm text-[#64748B]">Adicione água para começar o histórico.</p>
                  </div>
                `}
          </div>
        </section>
      </main>
      <${BottomNav} active="water" onChange=${setScreen} />
    </div>
  `;
}
