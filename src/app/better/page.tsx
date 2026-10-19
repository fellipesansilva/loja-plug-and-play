import { addons, money, plans } from "@/site/better/plans";
import {
  BRAND,
  COMPARE,
  CONTACT_HANDLE,
  CONTACT_URL,
  DEMOS,
  DEMOS_INTRO,
  FAQ,
  FOOTER,
  FOUNDERS,
  HERO,
  HOW,
  NAV,
  PLANS_INTRO,
  PREVIEW_BANNER,
  WHATSAPP_CTA,
} from "@/site/better/content";

// Página estática e de servidor: sem JavaScript de cliente próprio (as Dúvidas usam <details> nativo).

/** Todo contato desta prévia abre o Instagram da Better em outra aba. */
const external = { href: CONTACT_URL, target: "_blank", rel: "noopener" } as const;

/** Logo de 44 px: WebP de 96 px, com o PNG de reserva. Decorativo (alt vazio): o nome "Better Studio" já está no texto ao lado, no cabeçalho e no rodapé. */
function Logo() {
  return (
    <picture>
      <source srcSet="/images/better/logo-96.webp" type="image/webp" />
      <img className="better-logo" src="/images/better/logo.png" alt="" width={44} height={44} decoding="async" />
    </picture>
  );
}

export default function BetterPage() {
  return (
    <>
      <div className="better-banner">{PREVIEW_BANNER}</div>

      <header className="better-header">
        <div className="better-wrap">
          <a href="#" className="better-brand">
            <Logo />
            <span className="better-brand-name">{BRAND}</span>
          </a>
          <nav className="better-nav" aria-label="Principal">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
            <a className="better-nav-cta" {...external}>
              {WHATSAPP_CTA}
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="better-hero">
          <div className="better-wrap">
            <div className="better-hero-text">
              <span className="better-hero-tag">{HERO.tag}</span>
              <h1 className="better-h1">{HERO.title}</h1>
              <p className="better-hero-lead">{HERO.lead}</p>
              <div className="better-hero-actions">
                <a className="better-btn better-btn--accent" href="#demos">
                  {HERO.primaryCta}
                </a>
                <a className="better-btn better-btn--ghost" {...external}>
                  {WHATSAPP_CTA}
                </a>
              </div>
              <span className="better-hero-note">{HERO.note}</span>
            </div>
            <div className="better-phones" aria-hidden="true">
              <div className="better-phone better-phone--trama">
                <div className="better-phone-bar" />
                <div className="better-phone-brand">TRAMA</div>
                <div className="better-phone-hero-trama" />
                <div className="better-phone-grid">
                  <span />
                  <span />
                </div>
              </div>
              <div className="better-phone better-phone--forno">
                <div className="better-phone-bar" />
                <div className="better-phone-brand">
                  forno<span>.</span>da vila
                </div>
                <div className="better-phone-hero-forno" />
                <div className="better-phone-list">
                  <span />
                  <span />
                </div>
              </div>
              <div className="better-phone better-phone--orbita">
                <div className="better-phone-brand">órbita</div>
                <div className="better-phone-arc" />
                <div className="better-phone-pill" />
              </div>
            </div>
          </div>
        </section>

        <section id="demos" className="better-section--soft">
          <div className="better-wrap">
            <div className="better-head better-head--wide">
              <h2 className="better-h2">{DEMOS_INTRO.title}</h2>
              <p className="better-lead">{DEMOS_INTRO.text}</p>
            </div>
            <div className="better-demos">
              {DEMOS.map((d) => (
                <a key={d.slug} className="better-demo" href={`/${d.slug}`}>
                  <div className={`better-demo-art better-demo-art--${d.slug}`} aria-hidden="true">
                    {d.art}
                  </div>
                  <div className="better-demo-body">
                    <span className="better-demo-kind">{d.kind}</span>
                    <span className="better-demo-name">{d.name}</span>
                    <span className="better-demo-text">{d.text}</span>
                    <span className="better-demo-open">{DEMOS_INTRO.open}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="como" className="better-section">
          <div className="better-wrap">
            <h2 className="better-h2">{HOW.title}</h2>
            <ol className="better-steps">
              {HOW.steps.map((s, i) => (
                <li key={s.title} className={`better-step${i === HOW.steps.length - 1 ? " better-step--last" : ""}`}>
                  <span className="better-step-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="better-step-when">{s.when}</span>
                  <h3 className="better-h3">{s.title}</h3>
                  <p className="better-step-text">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="better-section--soft better-section--table">
          <div className="better-wrap">
            <h2 className="better-h2">{COMPARE.title}</h2>
            <div className="better-table-scroll">
              <table className="better-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="better-sr">Critério</span>
                    </th>
                    <th scope="col" className="better-table-us">
                      {COMPARE.us}
                    </th>
                    <th scope="col">{COMPARE.them}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.rows.map((r) => (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      <td className="better-table-us">{r.us}</td>
                      <td className="better-table-them">{r.them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="planos" className="better-section better-section--plans">
          <div className="better-wrap">
            <div className="better-head">
              <h2 className="better-h2">{PLANS_INTRO.title}</h2>
              <p className="better-lead">{PLANS_INTRO.text}</p>
            </div>
            <div className="better-plans">
              {plans.map((p) => (
                <div key={p.id} className={`better-plan${p.badge ? " better-plan--featured" : ""}`}>
                  {p.badge && <span className="better-plan-badge">{p.badge}</span>}
                  <span className="better-plan-name">{p.name}</span>
                  <span className="better-plan-tagline">{p.tagline}</span>
                  <span className="better-plan-price">
                    <span className="better-plan-from">{p.priceLabel}</span>
                    <span className="better-plan-value">
                      {money(p.price)}
                      {p.priceSuffix && <small>{p.priceSuffix}</small>}
                    </span>
                    <span className="better-plan-note">{p.note}</span>
                  </span>
                  <ul className="better-plan-list">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <a className={`better-btn ${p.badge ? "better-btn--solid" : "better-btn--outline"}`} {...external}>
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>
            <div className="better-addons">
              {addons.map((a) => (
                <div key={a.name} className="better-addon">
                  <strong>{a.name}</strong>
                  <span>{a.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="better-founders">
          <div className="better-founders-box">
            <div className="better-founders-text">
              <span className="better-founders-title">{FOUNDERS.title}</span>
              <span className="better-founders-sub">{FOUNDERS.text}</span>
            </div>
            <a className="better-btn better-btn--navy" {...external}>
              {FOUNDERS.cta}
            </a>
          </div>
        </section>

        <section id="duvidas" className="better-section--soft better-section--narrow">
          <div className="better-wrap">
            <h2 className="better-h2">{FAQ.title}</h2>
            <div className="better-faq">
              {FAQ.items.map((item, i) => (
                <details key={item.q} open={i === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="better-footer">
        <div className="better-wrap">
          <span className="better-footer-brand">
            <Logo />
            <span>
              <span className="better-footer-name">{BRAND}</span> · {FOOTER.cnpj}
            </span>
          </span>
          <span className="better-footer-links">
            <a {...external}>{CONTACT_HANDLE}</a>
            <span>{FOOTER.privacy}</span>
          </span>
        </div>
      </footer>
    </>
  );
}
