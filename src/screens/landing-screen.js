export function renderLandingScreen({ html, MosWordmark, Icon, onAccess }) {
  return html`
    <main className="mos-landing mos-landing--hold">
      <section className="mos-landing-hold-card" aria-label="Boas-vindas ao MOS!">
        <${MosWordmark} className="mos-wordmark--landing mos-wordmark--landing-hold" />
        <p>Bem-vindo ao MOS!</p>
        <button className="mos-landing-access-button" onClick=${onAccess}>
          <span>ACESSAR AO MOS!</span>
          <${Icon} name="login" />
        </button>
      </section>
    </main>
  `;
}
