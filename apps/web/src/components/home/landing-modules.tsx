import type { CSSProperties } from 'react';
import Link from 'next/link';
import { mockTaskOrderCard, splitSingleBlockEscrow } from '@taskstream/shared-schemas';

const AVATAR_TONES = [
  { a: '#e05f0a', b: '#f2b27a' },
  { a: '#342f6b', b: '#6f69c9' },
  { a: '#556599', b: '#9fb0e6' },
  { a: '#516715', b: '#a6c24d' },
  { a: '#e7995c', b: '#f6d3b0' },
  { a: '#7a3b6f', b: '#d88fcb' },
  { a: '#1f6f78', b: '#79d2d8' },
] as const;

function AvatarPh({
  a,
  b,
  className = '',
  style,
}: {
  a: string;
  b: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`ld-ph ${className}`}
      style={{ ['--a' as string]: a, ['--b' as string]: b, ...style }}
      aria-hidden
    />
  );
}

export function LandingModules() {
  const order = mockTaskOrderCard();
  const split = splitSingleBlockEscrow(order.paymentTerms.totalAmountUSDInCents);
  const total = (order.paymentTerms.totalAmountUSDInCents / 100).toFixed(2);
  const seller = (split.freelancerPayoutUSDInCents / 100).toFixed(2);
  const fee = (split.platformFeeUSDInCents / 100).toFixed(2);

  return (
    <div className="ld">
      {/* Trust strip */}
      <section className="ld-section ld-section--tight">
        <div className="ld-inner ld-center">
          <p className="ld-muted">Diseñado para el marketplace de 6 categorías del MVP</p>
          <h3 className="ld-h3">De freelancers independientes a equipos que publican y contratan</h3>
          <div className="ld-logos">
            <span>Marketing</span>
            <span>Diseño</span>
            <span>Código</span>
            <span>Redacción</span>
            <span>Video</span>
            <span>Audio</span>
          </div>
        </div>
      </section>

      {/* First impression / value */}
      <section className="ld-section">
        <div className="ld-inner ld-g2">
          <div>
            <span className="ld-eyebrow">La primera impresión del pago</span>
            <h2 className="ld-h2">
              Cada Buyer y Seller forma su confianza en la custodia antes de entregar el trabajo.
            </h2>
            <p className="ld-muted ld-mt">
              Publica un Gig, negocia a la baja o contrata a precio fijo. El monto entra a escrow Open
              Payments: si no hay entrega, reembolso 100%. Si hay acuerdo, liquidación 96% / 4%.
            </p>
          </div>
          <div className="card ld-card">
            <div className="ld-li">
              <AvatarPh a="#342f6b" b="#8a84e0" />
              <div>
                <b>Orden demo</b>
                <div className="ld-muted ld-sm">Escrow · GNAP · Open Payments</div>
                <div className="ld-muted ld-sm">
                  ${total} → Seller ${seller} · Plataforma ${fee}
                </div>
              </div>
            </div>
            <span className="ld-pill">Custodia</span>
            <span className="ld-pill">Preview</span>
            <span className="ld-pill ld-pill--accent">
              <b>96/4</b> invariante
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="ld-section ld-section--soft">
        <div className="ld-inner">
          <div className="ld-center">
            <span className="ld-eyebrow">Cómo funciona</span>
            <h2 className="ld-h2">De la publicación al desembolso, en tres pasos.</h2>
          </div>
          <div className="ld-g3 ld-mt-lg">
            <article className="card ld-card ld-step">
              <div className="ld-mini">
                {AVATAR_TONES.slice(0, 4).map((t, i) => (
                  <AvatarPh key={i} a={t.a} b={t.b} className="ld-ph--sq" />
                ))}
              </div>
              <div className="ld-step__n">PASO 01</div>
              <h3 className="ld-h3">Publica o contrata</h3>
              <p className="ld-muted">
                Seller: Gig a precio fijo. Buyer: tablón con tope. Seis categorías, plazos de 1 a 7 días.
              </p>
            </article>
            <article className="card ld-card ld-step">
              <div className="ld-mini">
                {AVATAR_TONES.slice(1, 5).map((t, i) => (
                  <AvatarPh key={i} a={t.a} b={t.b} className="ld-ph--sq" />
                ))}
              </div>
              <div className="ld-step__n">PASO 02</div>
              <h3 className="ld-h3">Acuerdo y fondeo</h3>
              <p className="ld-muted">
                Oferta ≤ tope o hire fijo. El Buyer fondea el 100% en escrow. Arrancan los relojes.
              </p>
            </article>
            <article className="card ld-card ld-step">
              <div className="ld-mini">
                {AVATAR_TONES.slice(2, 6).map((t, i) => (
                  <AvatarPh key={i} a={t.a} b={t.b} className="ld-ph--sq" />
                ))}
              </div>
              <div className="ld-step__n">PASO 03</div>
              <h3 className="ld-h3">Revisión y liquidación</h3>
              <p className="ld-muted">
                Preview protegido, IA en imagen/texto, hasta 2 correcciones. Luego 96% Seller / 4%
                plataforma.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Gallery / examples */}
      <section id="reviews" className="ld-section">
        <div className="ld-inner ld-center">
          <span className="ld-eyebrow">Flujo real</span>
          <h2 className="ld-h2">Marketplace → escrow → workspace</h2>
          <p className="ld-muted ld-mt">
            Catálogo, contratación, custodia y chat de entrega en un solo circuito.
          </p>
          <div className="ld-ba ld-mt-lg">
            <AvatarPh a="#9a9a9a" b="#d0d0d0" className="ld-ph--portrait" />
            <AvatarPh a="#342f6b" b="#6f69c9" className="ld-ph--portrait" />
            <AvatarPh a="#e05f0a" b="#f2b27a" className="ld-ph--portrait" />
            <AvatarPh a="#556599" b="#9fb0e6" className="ld-ph--portrait" />
            <AvatarPh a="#516715" b="#a6c24d" className="ld-ph--portrait" />
          </div>
          <p className="ld-muted ld-sm ld-mt">Publicación → acuerdo → custodia → entrega → liquidación</p>
        </div>
      </section>

      {/* Features */}
      <section className="ld-section ld-section--soft">
        <div className="ld-inner">
          <div className="ld-center">
            <span className="ld-eyebrow">Capacidades</span>
            <h2 className="ld-h2">Cómo TaskStream protege el trabajo y el dinero</h2>
          </div>
          <div className="ld-feat ld-mt-lg">
            <div className="card ld-card">
              <h3 className="ld-h3">Custodia Open Payments</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>100% en escrow</b> · el Seller no cobra hasta liberar
                </li>
                <li>
                  <b>Reembolso 100%</b> · si vence sin entrega o falla la extensión
                </li>
              </ul>
            </div>
            <div className="card ld-card">
              <h3 className="ld-h3">Invariante 96% / 4%</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>Math.floor(total × 0.04)</b> · comisión exacta
                </li>
                <li>
                  <b>Remanente al Seller</b> · sin comisiones ocultas
                </li>
              </ul>
            </div>
            <div className="card ld-card">
              <h3 className="ld-h3">Consejero de IA (MVP)</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>Solo imagen y texto</b> · informe consultivo, no bloquea pago
                </li>
                <li>
                  <b>Preview protegido</b> · original bloqueado hasta la ventana final
                </li>
              </ul>
            </div>
            <div className="card ld-card">
              <h3 className="ld-h3">Relojes independientes</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>7d · 24h · +7d · 32h · 30m</b> · cada job por su cuenta
                </li>
                <li>
                  <b>Máx. 2 correcciones</b> · extensión única por orden
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — 3 cards like Headshotly, TaskStream economics */}
      <section id="pricing" className="ld-section">
        <div className="ld-inner">
          <div className="ld-center">
            <h2 className="ld-h2">Hecho para un encargo. O para todo el equipo.</h2>
          </div>
          <div className="ld-g3 ld-mt-lg">
            <div className="card ld-card ld-price">
              <div className="ld-muted">Buyer · quien contrata</div>
              <div className="ld-price__big">100% en escrow</div>
              <p className="ld-muted">
                Depositas el monto acordado. Si no hay entrega a tiempo, recuperas el 100%.
              </p>
              <p className="ld-mt">
                <Link href="/marketplace" className="btn btn-primary">
                  Ir al marketplace
                </Link>
              </p>
            </div>
            <div className="card ld-card ld-price">
              <div className="ld-muted">Seller · quien entrega</div>
              <div className="ld-price__big">96% neto</div>
              <p className="ld-muted">
                Cobras el 96% en tu billetera verificada tras aceptación o ventana final.
              </p>
              <p className="ld-mt">
                <Link href="/sign-up" className="btn btn-outline">
                  Crear cuenta Seller
                </Link>
              </p>
            </div>
            <div className="card ld-card ld-price">
              <div className="ld-muted">Plataforma · TaskStream</div>
              <div className="ld-price__big">4% comisión</div>
              <p className="ld-muted">
                Fee fijo sobre el total custodiado. Misma regla en cada liquidación dual.
              </p>
              <p className="ld-mt">
                <a href="#faq" className="btn btn-outline">
                  Ver FAQ
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Satisfaction band */}
      <section className="ld-section ld-section--flush-top">
        <div className="ld-inner">
          <div className="ld-band">
            <span className="ld-eyebrow">Invariante financiera</span>
            <h2 className="ld-h2 ld-band__title">
              96% Seller · 4% plataforma, respaldado por el contrato Zod del MVP.
            </h2>
            <p className="ld-band__sub">
              Sin suscripción. Custodia única. Reembolso 100% cuando las reglas lo exigen.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="ld-section">
        <div className="ld-inner">
          <div className="ld-center">
            <span className="ld-eyebrow">Historias de uso</span>
            <h2 className="ld-h2">Así lo describen Buyer y Seller.</h2>
          </div>
          <div className="ld-g3 ld-mt-lg">
            <article className="card ld-card ld-quote">
              <h3 className="ld-h3">
                “El escrow me quitó el miedo de pagar antes de ver la entrega.”
              </h3>
              <p className="ld-muted">Preview protegido y plazos claros. Sin waits de 14 días.</p>
              <div className="ld-li ld-mt">
                <AvatarPh a="#342f6b" b="#8a84e0" style={{ width: 46, height: 46 }} />
                <div>
                  <b>Alex Morgan</b>
                  <div className="ld-muted ld-sm">Buyer · Marketing digital</div>
                </div>
              </div>
            </article>
            <article className="card ld-card ld-quote">
              <h3 className="ld-h3">“Publiqué el Gig a precio fijo y cobré el 96% sin pelear el fee.”</h3>
              <p className="ld-muted">Wallet verificada una sola vez. Liquidación dual automática.</p>
              <div className="ld-li ld-mt">
                <AvatarPh a="#e05f0a" b="#f2b27a" style={{ width: 46, height: 46 }} />
                <div>
                  <b>Jordan Lee</b>
                  <div className="ld-muted ld-sm">Seller · Diseño gráfico</div>
                </div>
              </div>
            </article>
            <article className="card ld-card ld-quote">
              <h3 className="ld-h3">“Negociamos a la baja dentro del tope y el fondeo fue inmediato.”</h3>
              <p className="ld-muted">Sala de ofertas + hire. Luego workspace con el plazo de 7 días.</p>
              <div className="ld-li ld-mt">
                <AvatarPh a="#1f6f78" b="#79d2d8" style={{ width: 46, height: 46 }} />
                <div>
                  <b>Sam Rivera</b>
                  <div className="ld-muted ld-sm">Buyer · Producto</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="ld-section ld-section--soft">
        <div className="ld-inner">
          <div className="ld-center">
            <h2 className="ld-h2">Freelance tradicional vs TaskStream</h2>
            <p className="ld-muted ld-mt ld-mb">
              Ambos te llevan a un entregable. Piden cosas distintas del dinero y del riesgo.
            </p>
          </div>
          <div className="ld-scroll">
            <table className="ld-table">
              <thead>
                <tr>
                  <th />
                  <th>Tradicional</th>
                  <th>TaskStream AI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pago</td>
                  <td>Adelanto o confianza</td>
                  <td>100% en escrow Open Payments</td>
                </tr>
                <tr>
                  <td>Comisión</td>
                  <td>Opaca / variable</td>
                  <td>4% fijo · 96% Seller</td>
                </tr>
                <tr>
                  <td>Plazos</td>
                  <td>Chat informal</td>
                  <td>Relojes 7d / 32h / 30m</td>
                </tr>
                <tr>
                  <td>Revisión</td>
                  <td>Archivo crudo</td>
                  <td>Protected Preview + IA imagen/texto</td>
                </tr>
                <tr>
                  <td>Disputa</td>
                  <td>Plataforma opaca</td>
                  <td>Arbitraje binario justificado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="ld-section">
        <div className="ld-inner ld-faq">
          <div className="ld-center">
            <h2 className="ld-h2">Preguntas frecuentes</h2>
          </div>
          <details className="ld-details">
            <summary>¿Cuánto cobra TaskStream?</summary>
            <p>
              El 4% del monto custodiado en cada liquidación exitosa. El Seller recibe el 96%. No hay
              suscripción en el MVP.
            </p>
          </details>
          <details className="ld-details">
            <summary>¿Hay suscripción?</summary>
            <p>No. Buyer y Seller operan con cuenta local, wallet verificada y fee por orden.</p>
          </details>
          <details className="ld-details">
            <summary>¿Cómo funciona el escrow?</summary>
            <p>
              Tras el acuerdo, el Buyer fondea el 100%. El dinero no sale hasta aceptación, timeout de
              revisión o resolución administrativa.
            </p>
          </details>
          <details className="ld-details">
            <summary>¿La IA aprueba o bloquea el pago?</summary>
            <p>
              No. En el MVP el consejero solo audita imagen y texto de forma consultiva. El Buyer decide.
            </p>
          </details>
          <details className="ld-details">
            <summary>¿Qué pasa si el Seller no entrega?</summary>
            <p>
              Si vence el plazo inicial sin extensión aprobada, reembolso automático del 100% al Buyer.
            </p>
          </details>
          <details className="ld-details">
            <summary>¿Necesito una billetera?</summary>
            <p>
              Sí, una wallet Interledger verificada por GNAP. Una sola activa por cuenta, usable en
              Buyer y Seller mode.
            </p>
          </details>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ld-section ld-section--flush-top">
        <div className="ld-inner">
          <div className="ld-final ld-center">
            <h2 className="ld-h2">Empieza a contratar o cobrar con custodia hoy.</h2>
            <p className="ld-muted ld-mt">
              Verifica tu billetera, elige Buyer o Seller y entra al marketplace de 6 categorías.
            </p>
            <div className="ld-cta ld-mt-lg">
              <Link href="/sign-up" className="btn btn-primary">
                Crear cuenta
              </Link>
              <Link href="/marketplace" className="btn btn-outline">
                Ver marketplace
              </Link>
            </div>
            <p className="ld-muted ld-sm ld-mt">Sin suscripción · Escrow 100% · Liquidación 96/4</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LandingAvatarStrip() {
  return (
    <div className="ld-strip" aria-hidden>
      {AVATAR_TONES.map((t, i) => (
        <AvatarPh key={i} a={t.a} b={t.b} />
      ))}
    </div>
  );
}
