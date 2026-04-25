export function renderProfileScreen(ctx) {
  const {
    html,
    TopBar,
    BottomNav,
    Icon,
    state,
    parseDateKey,
    setScreen,
    openSearch,
    openNotifications,
    setModal,
  } = ctx;

  const profileItems = [
    { label: "Nome", value: state.profile.name || "Ainda não informado", icon: "person" },
    { label: "Email", value: state.profile.email || "Ainda não informado", icon: "mail" },
    { label: "Cidade", value: state.profile.city || "Ainda não informado", icon: "location_on" },
    {
      label: "Aniversário",
      value: state.profile.birthday ? parseDateKey(state.profile.birthday).toLocaleDateString("pt-BR") : "Ainda não informado",
      icon: "cake",
    },
    { label: "Meta calórica", value: `${Math.round(state.profile.calorieTarget || 0).toLocaleString("pt-BR")} kcal`, icon: "local_fire_department" },
    { label: "Meta de água", value: `${Math.round(state.profile.waterTargetMl || 0).toLocaleString("pt-BR")} ml`, icon: "water_drop" },
  ];

  return html`
    <div className="mos-screen text-on-surface min-h-screen pb-32">
      <${TopBar}
        title="Meu perfil"
        leftIcon="arrow_back"
        centerBold=${false}
        onLeft=${() => setScreen("home")}
        onSearch=${() => openSearch("home")}
        onRight=${openNotifications}
      />
      <main className="pt-24 px-4 max-w-md mx-auto space-y-6">
        <section className="mos-info-card space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm text-[#4558C8]">Dados pessoais</span>
              <h1 className="text-[1.9rem] font-bold text-jet-black leading-tight">${state.profile.name || "Meu perfil"}</h1>
              <p className="text-sm leading-relaxed text-on-surface-variant">Aqui você concentra as informações principais da sua conta para manter o MOS! mais pessoal e organizado.</p>
            </div>
            <div className="w-12 h-12 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0">
              <${Icon} name="account_circle" className="text-[#4558C8] text-[1.6rem]" />
            </div>
          </div>
        </section>

        <section className="mos-info-grid">
          ${profileItems.map(
            (item) => html`
              <div className="mos-info-tile">
                <div className="mos-info-icon">
                  <${Icon} name=${item.icon} className="text-[#4558C8]" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm text-on-surface-variant block mb-1">${item.label}</span>
                  <strong className="text-[1rem] font-bold text-jet-black break-words">${item.value}</strong>
                </div>
              </div>
            `
          )}
        </section>

        <button className="w-full h-14 bg-[#EF5F37] text-white rounded-[10px] font-bold text-base active:scale-95 transition-transform" onClick=${() => setModal("profile")}>
          Editar
        </button>
      </main>
      <${BottomNav} active=${null} onChange=${setScreen} />
    </div>
  `;
}
