export function renderLandingScreen({ html, MosWordmark, onAccess, onOpenDemo }) {
  return html`
    <main className="mos-temp-landing">
      <style>
        ${`
          .mos-temp-landing {
            min-height: 100vh;
            background: #DAFF00;
            color: #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 20px;
            box-sizing: border-box;
          }

          .mos-temp-landing *,
          .mos-temp-landing *::before,
          .mos-temp-landing *::after {
            box-sizing: border-box;
          }

          .mos-temp-landing__wrap {
            width: 100%;
            max-width: 520px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 28px;
          }

          .mos-temp-landing__brand {
            display: flex;
            justify-content: center;
          }

          .mos-temp-landing__brand .mos-wordmark--landing-main,
          .mos-temp-landing__brand .mos-wordmark {
            color: #000000;
          }

          .mos-temp-landing__actions {
            width: 100%;
            display: grid;
            gap: 14px;
          }

          .mos-temp-landing__button {
            appearance: none;
            border: 2px solid #000000;
            border-radius: 999px;
            min-height: 58px;
            width: 100%;
            padding: 0 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #000000;
            color: #DAFF00;
            font: inherit;
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            cursor: pointer;
            transition: transform 160ms ease, background-color 160ms ease, color 160ms ease;
          }

          .mos-temp-landing__button:hover {
            transform: translateY(-1px);
          }

          .mos-temp-landing__button--secondary {
            background: #ffffff;
            color: #000000;
          }

          .mos-temp-landing__button--secondary:hover {
            background: #f5f5f5;
          }

          @media (max-width: 640px) {
            .mos-temp-landing {
              padding: 24px 16px;
            }

            .mos-temp-landing__wrap {
              gap: 22px;
            }

            .mos-temp-landing__button {
              min-height: 54px;
              font-size: 0.96rem;
            }
          }
        `}
      </style>

      <div className="mos-temp-landing__wrap">
        <div className="mos-temp-landing__brand">
          <${MosWordmark} className="mos-wordmark--landing-main" />
        </div>

        <div className="mos-temp-landing__actions">
          <button
            type="button"
            className="mos-temp-landing__button"
            onClick=${onAccess}
          >
            app
          </button>

          <button
            type="button"
            className="mos-temp-landing__button mos-temp-landing__button--secondary"
            onClick=${onOpenDemo}
          >
            demo
          </button>
        </div>
      </div>
    </main>
  `;
}
