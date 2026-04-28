const featureSignals = [
  {
    title: "Registre tudo em um só lugar",
    text: "comida, água, treino e plano em uma rotina só",
  },
  {
    title: "Veja seu dia em tempo real",
    text: "o que já entrou, o que falta e o próximo passo",
  },
  {
    title: "Mantenha a consistência",
    text: "menos esquecimento, mais clareza para seguir",
  },
];

const landingSections = [
  {
    id: "comida",
    eyebrow: "Comida",
    number: "01",
    title: "Entenda suas calorias sem planilha.",
    body:
      "Registre refeições, acompanhe o que já entrou e veja quanto ainda resta no dia sem fazer conta de cabeça.",
    bullets: ["registre refeições", "veja o restante", "decida a próxima refeição"],
    metric: "903",
    unit: "kcal livres",
    accent: "food",
  },
  {
    id: "agua",
    eyebrow: "Água",
    number: "02",
    title: "Saiba quanto falta sem pensar duas vezes.",
    body:
      "O MOS! mostra a meta, o total registrado e quanto ainda falta para você fechar o dia com clareza.",
    bullets: ["registro em um toque", "meta visível", "leitura rápida do progresso"],
    metric: "550",
    unit: "ml faltando",
    accent: "water",
  },
  {
    id: "treino",
    eyebrow: "Treino",
    number: "03",
    title: "Seu treino salvo e pronto para executar.",
    body:
      "Abra a rotina do dia, veja o que fazer e registre a sessão quando terminar. Sem ficar pulando entre mensagens, PDF e notas.",
    bullets: ["treino do dia", "execução guiada", "sessão registrada"],
    metric: "1",
    unit: "sessão pendente",
    accent: "training",
  },
  {
    id: "plano",
    eyebrow: "Plano",
    number: "04",
    title: "Um roteiro claro para seguir o que já foi definido.",
    body:
      "Plano alimentar, horários e suplementos ficam organizados em um painel simples para você só seguir e adaptar quando precisar.",
    bullets: ["refeições por horário", "suplementação", "trocas e ajustes"],
    metric: "4",
    unit: "blocos no roteiro",
    accent: "plan",
  },
];

const faqItems = [
  {
    question: "O MOS! substitui nutricionista ou personal?",
    answer:
      "Não. O MOS! organiza o que já foi definido por você ou por um profissional. Ele ajuda a executar melhor o dia.",
  },
  {
    question: "Consigo usar para comida, água, treino e plano no mesmo app?",
    answer:
      "Sim. Esse é o ponto principal do MOS!: juntar tudo em um painel só, sem depender de vários aplicativos ou anotações espalhadas.",
  },
  {
    question: "O que eu vejo quando abro o app?",
    answer:
      "Você vê o estado do dia, o que já foi registrado, o que falta e qual é a próxima ação mais útil naquele momento.",
  },
];

function LandingPhoneMock({ html, Icon }) {
  return html`
    <div className="mos-landing-phone-shell" aria-hidden="true">
      <div className="mos-landing-phone-notch"></div>
      <div className="mos-landing-phone-screen">
        <div className="mos-landing-phone-topbar">
          <span>20:28</span>
          <span>5G</span>
        </div>
        <div className="mos-landing-phone-panel">
          <div className="mos-landing-phone-header">
            <span className="mos-landing-phone-kicker">Painel do dia</span>
            <strong>2400</strong>
            <p>kcal livres hoje</p>
            <small>Sem dados do dia ainda</small>
          </div>
          <div className="mos-landing-phone-action">
            <span className="mos-landing-phone-action-icon"><${Icon} name="restaurant" className="text-[1rem]" /></span>
            <div>
              <span>Próxima ação</span>
              <strong>Registrar primeira refeição</strong>
              <small>Abra comida e marque o que já entrou.</small>
            </div>
          </div>
          <div className="mos-landing-phone-grid">
            <article className="mos-landing-mini-card mos-landing-mini-card--food">
              <span>Comida</span>
              <strong>Sem registro</strong>
              <small>0 de 2400 kcal</small>
            </article>
            <article className="mos-landing-mini-card mos-landing-mini-card--water">
              <span>Água</span>
              <strong>Faltam 3000 ml</strong>
              <small>0 de 3000 ml</small>
            </article>
            <article className="mos-landing-mini-card mos-landing-mini-card--training">
              <span>Treino</span>
              <strong>Pendente</strong>
              <small>Nenhum treino hoje</small>
            </article>
            <article className="mos-landing-mini-card mos-landing-mini-card--plan">
              <span>Plano</span>
              <strong>Sem plano</strong>
              <small>Defina um roteiro</small>
            </article>
          </div>
        </div>
        <div className="mos-landing-phone-nav">
          <span className="is-active">Início</span>
          <span>Comida</span>
          <span>Água</span>
          <span>Treino</span>
          <span>Plano</span>
        </div>
      </div>
    </div>
  `;
}

export function renderLandingScreen({ html, MosWordmark, Icon, onAccess }) {
  return html`
    <main className="mos-landing mos-landing--figma">
      <header className="mos-landing-nav">
        <a href="#inicio" className="mos-landing-brand" aria-label="MOS!">
          <${MosWordmark} className="mos-wordmark--landing-main" />
        </a>

        <nav className="mos-landing-nav-links" aria-label="Seções da landing">
          <a href="#inicio" className="is-active">Início</a>
          <a href="#comida">Comida</a>
          <a href="#agua">Água</a>
          <a href="#treino">Treino</a>
          <a href="#plano">Plano</a>
        </nav>

        <button className="mos-landing-nav-cta" onClick=${onAccess}>
          <span>Acessar o MOS!</span>
          <${Icon} name="arrow_forward" className="text-[1.1rem]" />
        </button>
      </header>

      <section id="inicio" className="mos-landing-hero">
        <div className="mos-landing-hero-copy">
          <span className="mos-landing-overline">Tudo em um só lugar</span>
          <h1>
            Sua rotina organizada.
            <br />
            Sua meta, mais perto.
          </h1>
          <p>
            Comida, água, treino e plano alimentar em um só lugar. O MOS! é o seu organizador pessoal
            simples de seguir. Sem planilha, sem troca de aplicativo, sem se perder no meio do dia.
          </p>
          <div className="mos-landing-hero-actions">
            <button className="mos-landing-primary-cta" onClick=${onAccess}>Começar agora</button>
            <a href="#como-funciona" className="mos-landing-secondary-cta">Ver como funciona</a>
          </div>
        </div>

        <div className="mos-landing-hero-visual">
          <div className="mos-landing-massive-word" aria-hidden="true">MOS!</div>
          <${LandingPhoneMock} html=${html} Icon=${Icon} />
        </div>
      </section>

      <section className="mos-landing-signal-band">
        ${featureSignals.map(
          (item) => html`
            <article className="mos-landing-signal-item" key=${item.title}>
              <h2>${item.title}</h2>
              <p>${item.text}</p>
            </article>
          `
        )}
      </section>

      <section id="como-funciona" className="mos-landing-problem">
        <div className="mos-landing-problem-inner">
          <span className="mos-landing-overline">Por que usar</span>
          <h2>Pare de se perder no meio do dia.</h2>
          <div className="mos-landing-problem-list">
            <p>Um app para comida.</p>
            <p>Outro para treino.</p>
            <p>Água na memória.</p>
            <p>Plano espalhado.</p>
          </div>
          <strong>O MOS! junta tudo.</strong>
          <span>Você abre e entende seu dia em segundos.</span>
        </div>
      </section>

      ${landingSections.map(
        (section, index) => html`
          <section id=${section.id} className=${`mos-landing-feature mos-landing-feature--${index % 2 ? "reverse" : "default"}`}>
            <div className="mos-landing-feature-copy">
              <span className="mos-landing-feature-kicker">${section.number} · ${section.eyebrow}</span>
              <h2>${section.title}</h2>
              <p>${section.body}</p>
              <ul>
                ${section.bullets.map((bullet) => html`<li key=${bullet}>${bullet}</li>`)}
              </ul>
              <button className="mos-landing-inline-cta" onClick=${onAccess}>
                <span>Usar o MOS!</span>
                <${Icon} name="arrow_forward" className="text-[1rem]" />
              </button>
            </div>
            <div className=${`mos-landing-feature-card mos-landing-feature-card--${section.accent}`}>
              <span className="mos-landing-feature-card-label">${section.eyebrow}</span>
              <strong>${section.metric}</strong>
              <small>${section.unit}</small>
            </div>
          </section>
        `
      )}

      <section className="mos-landing-brain">
        <div className="mos-landing-brain-inner">
          <span className="mos-landing-overline">Cérebro MOS!</span>
          <h2>Você registra. O MOS! organiza.</h2>
          <p>Ele lê o dia e mostra o próximo passo para você agir sem ficar pensando demais.</p>
          <div className="mos-landing-brain-points">
            <article>
              <strong>O que já foi feito</strong>
              <span>calorias, água e treino já registrados</span>
            </article>
            <article>
              <strong>O que falta</strong>
              <span>o que ainda precisa entrar para fechar o dia</span>
            </article>
            <article>
              <strong>O que vem agora</strong>
              <span>a ação mais útil no momento</span>
            </article>
          </div>
        </div>
      </section>

      <section className="mos-landing-faq" id="faq">
        <div className="mos-landing-faq-header">
          <span className="mos-landing-overline">FAQ</span>
          <h2>Dúvidas frequentes</h2>
        </div>
        <div className="mos-landing-faq-list">
          ${faqItems.map(
            (item) => html`
              <details className="mos-landing-faq-item" key=${item.question}>
                <summary>
                  <span>${item.question}</span>
                  <${Icon} name="expand_more" className="text-[1.25rem]" />
                </summary>
                <p>${item.answer}</p>
              </details>
            `
          )}
        </div>
      </section>

      <section className="mos-landing-contact" id="contato">
        <div className="mos-landing-contact-copy">
          <span className="mos-landing-overline">Contato</span>
          <h2>Ainda tem dúvidas?</h2>
          <p>Mande uma mensagem e a gente mostra como o MOS! pode organizar sua rotina.</p>
        </div>
        <form className="mos-landing-contact-form" onSubmit=${(event) => event.preventDefault()}>
          <input type="text" placeholder="Seu nome" aria-label="Seu nome" />
          <input type="email" placeholder="Seu e-mail" aria-label="Seu e-mail" />
          <textarea rows="4" placeholder="Como podemos ajudar?" aria-label="Como podemos ajudar?"></textarea>
          <button type="submit">Enviar mensagem</button>
        </form>
      </section>

      <section className="mos-landing-final-cta" id="cta-final">
        <div className="mos-landing-final-word" aria-hidden="true">MOS!</div>
        <div className="mos-landing-final-copy">
          <h2>Menos dúvida. Mais ação.</h2>
          <p>Comece agora e organize seu dia em poucos segundos.</p>
          <button className="mos-landing-final-button" onClick=${onAccess}>Acessar o MOS!</button>
        </div>
      </section>

      <footer className="mos-landing-footer">
        <div>
          <${MosWordmark} className="mos-wordmark--landing-footer" />
          <p>Comida, água, treino e plano. Tudo em um só lugar.</p>
        </div>
        <div className="mos-landing-footer-links">
          <a href="#faq">FAQ</a>
          <a href="#contato">Contato</a>
          <button onClick=${onAccess}>Entrar no app</button>
        </div>
      </footer>
    </main>
  `;
}
