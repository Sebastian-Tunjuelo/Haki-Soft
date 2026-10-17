import Link from 'next/link';
import { mockTaskOrderCard, splitSingleBlockEscrow } from '@taskstream/shared-schemas';

const COMMUNITY_PEOPLE = [
  {
    name: 'Sara M.',
    role: 'UI / WebGL · Bogotá 🇨🇴',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Carlos V.',
    role: 'Cliente FinTech · CDMX 🇲🇽',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Valeria G.',
    role: 'Artista 3D · Medellín 🇨🇴',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Mateo R.',
    role: 'Full-Stack · Buenos Aires 🇦🇷',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Camila P.',
    role: 'Product Lead · São Paulo 🇧🇷',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Diego L.',
    role: 'Arquitecto IA · Santiago 🇨🇱',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Lucía F.',
    role: 'Redactora Técnica · Lima 🇵🇪',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
  },
] as const;

const STEP_PEOPLE = {
  step1: [
    {
      name: 'Valeria G.',
      role: 'Publica servicio 3D · 🇨🇴',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Carlos V.',
      role: 'Publica encargo $480 · 🇲🇽',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
  ],
  step2: [
    {
      name: 'Camila P.',
      role: 'Fondea 100% GNAP · 🇧🇷',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Mateo R.',
      role: 'Inicia entrega 7d · 🇦🇷',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  ],
  step3: [
    {
      name: 'Sara M.',
      role: 'Recibe 96% en 4s · 🇨🇴',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Diego L.',
      role: 'Aprueba en visor IA · 🇨🇱',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    },
  ],
} as const;

const VERIFIED_PEOPLE_REVIEWS = [
  {
    name: 'Carlos Villalobos',
    role: 'Director FinTech · Ciudad de México 🇲🇽',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    quote:
      'Publicamos el rediseño de nuestra plataforma y en minutos teníamos custodia GNAP activa. Al aprobar en el visor protegido, el 96% llegó al instante.',
    amount: '$510.00 USD liquidados',
  },
  {
    name: 'Valeria Gómez',
    role: 'Especialista 3D & Shaders · Medellín 🇨🇴',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    quote:
      'Con mi misma cuenta contrato locución para mis demos y cobro mis proyectos WebGL en segundos directo a mi billetera Open Payments.',
    amount: '$480.00 USD recibidos (96%)',
  },
  {
    name: 'Camila Pereira',
    role: 'Product Lead · São Paulo 🇧🇷',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    quote:
      'El Consejero de IA verificó todos los entregables técnicos antes de liberar el pago. Cero fricción cambiaria entre Brasil, México y Colombia.',
    amount: '$680.00 USD en custodia',
  },
] as const;

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
          <h3 className="ld-h3 kinetic-heading">
            De freelancers independientes a equipos que publican y contratan con una sola cuenta
          </h3>
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
            <h2 className="ld-h2 kinetic-heading">
              Cada usuario construye su confianza en la custodia antes de entregar o recibir el trabajo.
            </h2>
            <p className="ld-muted ld-mt">
              Publica un encargo como Cliente o aplica a una actividad como Freelancer desde tu misma cuenta unificada.
              El monto entra a custodia Open Payments: si no hay entrega, reembolso 100%. Si hay acuerdo, liquidación
              atómica 96% Freelancer / 4% Meridia.
            </p>
          </div>
          <div className="card ld-card">
            <div className="ld-li">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={COMMUNITY_PEOPLE[1].photo}
                  alt={COMMUNITY_PEOPLE[1].name}
                  className="ld-person-photo"
                  style={{ width: 46, height: 46, borderRadius: 14 }}
                />
                <img
                  src={COMMUNITY_PEOPLE[0].photo}
                  alt={COMMUNITY_PEOPLE[0].name}
                  className="ld-person-photo"
                  style={{ width: 46, height: 46, borderRadius: 14, marginLeft: -12 }}
                />
              </div>
              <div>
                <b>Orden #MRD-204 · Custodia Activa (Carlos V. → Sara M.)</b>
                <div className="ld-muted ld-sm">Escrow · GNAP · Open Payments</div>
                <div className="ld-muted ld-sm tabular-num">
                  ${total} → Freelancer ${seller} (96%) · Meridia ${fee} (4%)
                </div>
              </div>
            </div>
            <span className="ld-pill">Custodia 100%</span>
            <span className="ld-pill">Visor Protegido</span>
            <span className="ld-pill ld-pill--accent">
              <b>96/4</b> invariante
            </span>
          </div>
        </div>
      </section>

      {/* How it works — Con fotografías reales de personas y barra de progreso ScrollTrigger */}
      <section id="how" className="ld-section ld-section--soft">
        <div className="ld-inner">
          <div className="ld-center">
            <span className="ld-eyebrow">Cómo funciona MERIDIA</span>
            <h2 className="ld-h2 kinetic-heading">De la actividad publicada al desembolso, en tres pasos.</h2>
            <p className="ld-muted" style={{ maxWidth: '58ch', margin: '8px auto 0' }}>
              Personas reales operando en toda América con una única cuenta para contratar talento o prestar servicios.
            </p>
          </div>

          <div className="how-progress-track" aria-hidden="true">
            <div className="how-progress-fill" />
          </div>

          <div className="ld-g3 ld-mt-lg">
            <article className="card ld-card ld-step">
              <div className="ld-people-row">
                {STEP_PEOPLE.step1.map((person) => (
                  <div key={person.name} className="ld-person-badge">
                    <img src={person.photo} alt={person.name} className="ld-person-photo" loading="lazy" />
                    <div className="ld-person-info">
                      <strong>{person.name}</strong>
                      <span>{person.role}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ld-step__n">PASO 01</div>
              <h3 className="ld-h3 kinetic-heading">Publica o aplica</h3>
              <p className="ld-muted">
                Con tu cuenta unificada puedes publicar una actividad con presupuesto inicial o postularte a encargos abiertos en el Marketplace.
              </p>
            </article>

            <article className="card ld-card ld-step">
              <div className="ld-people-row">
                {STEP_PEOPLE.step2.map((person) => (
                  <div key={person.name} className="ld-person-badge">
                    <img src={person.photo} alt={person.name} className="ld-person-photo" loading="lazy" />
                    <div className="ld-person-info">
                      <strong>{person.name}</strong>
                      <span>{person.role}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ld-step__n">PASO 02</div>
              <h3 className="ld-h3 kinetic-heading">Acuerdo y custodia 100%</h3>
              <p className="ld-muted">
                Propuesta ≤ presupuesto del Cliente o contratación directa. El Cliente fondea el 100% en custodia GNAP y arrancan los relojes.
              </p>
            </article>

            <article className="card ld-card ld-step">
              <div className="ld-people-row">
                {STEP_PEOPLE.step3.map((person) => (
                  <div key={person.name} className="ld-person-badge">
                    <img src={person.photo} alt={person.name} className="ld-person-photo" loading="lazy" />
                    <div className="ld-person-info">
                      <strong>{person.name}</strong>
                      <span>{person.role}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ld-step__n">PASO 03</div>
              <h3 className="ld-h3 kinetic-heading">Revisión IA y liquidación 96/4</h3>
              <p className="ld-muted">
                Visor protegido, consejero IA en imagen y texto y hasta 2 correcciones. Al aprobarse: 96% Freelancer / 4% Meridia.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Features + Reseñas con Personas Reales */}
      <section id="reviews" className="ld-section">
        <div className="ld-inner">
          <div className="ld-center">
            <span className="ld-eyebrow">Arquitectura Financiera &amp; Comunidad</span>
            <h2 className="ld-h2 kinetic-heading">Cómo MERIDIA protege el trabajo y el capital</h2>
          </div>

          <div className="ld-feat ld-mt-lg">
            <div className="card ld-card">
              <h3 className="ld-h3 kinetic-heading">Custodia Open Payments</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>100% en custodia única</b> · el Freelancer tiene garantía total antes de iniciar
                </li>
                <li>
                  <b>Reembolso 100%</b> · automático al Cliente si vence el plazo sin entrega
                </li>
              </ul>
            </div>
            <div className="card ld-card">
              <h3 className="ld-h3 kinetic-heading">Invariante 96% / 4%</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>Math.floor(total × 0.04)</b> · comisión transparente del protocolo
                </li>
                <li>
                  <b>96% íntegro al Freelancer</b> · directo a su billetera verificada
                </li>
              </ul>
            </div>
            <div className="card ld-card">
              <h3 className="ld-h3 kinetic-heading">Consejero de IA (Imagen y Texto)</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>Auditoría consultiva</b> · evalúa criterios obligatorios sin bloquear fondos
                </li>
                <li>
                  <b>Visor protegido</b> · previsualización con marca de agua hasta liberar el pago
                </li>
              </ul>
            </div>
            <div className="card ld-card">
              <h3 className="ld-h3 kinetic-heading">Relojes Independientes</h3>
              <ul className="ld-feat-list">
                <li>
                  <b>7d · 24h · +7d · 32h · 30m</b> · cada etapa con su propio temporizador determinista
                </li>
                <li>
                  <b>Máx. 2 correcciones</b> · y 1 extensión única de +7 días acordada
                </li>
              </ul>
            </div>
          </div>

          {/* Tarjetas de Personas Reales de la Comunidad Meridia */}
          <div className="ld-g3 ld-mt-lg">
            {VERIFIED_PEOPLE_REVIEWS.map((rev) => (
              <article key={rev.name} className="card ld-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <img
                    src={rev.photo}
                    alt={rev.name}
                    className="ld-person-photo"
                    style={{ width: 48, height: 48 }}
                    loading="lazy"
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: 14.5, color: 'var(--text-primary)' }}>
                      {rev.name}
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rev.role}</span>
                  </div>
                </div>
                <p className="ld-muted" style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 12px' }}>
                  &ldquo;{rev.quote}&rdquo;
                </p>
                <span className="ld-pill ld-pill--accent tabular-num">{rev.amount}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="ld-section ld-section--soft">
        <div className="ld-inner">
          <div className="ld-center">
            <h2 className="ld-h2 kinetic-heading">Economía transparente para toda tu actividad.</h2>
          </div>
          <div className="ld-g3 ld-mt-lg">
            <div className="card ld-card ld-price">
              <div className="ld-muted">Cuando publicas y contratas</div>
              <div className="ld-price__big">100% en custodia</div>
              <p className="ld-muted">
                Depositas el presupuesto acordado. Si no hay entrega a tiempo, recuperas el 100% sin fricción.
              </p>
              <p className="ld-mt">
                <Link href="/marketplace" className="btn btn-amber">
                  Publica ya tu actividad
                </Link>
              </p>
            </div>
            <div className="card ld-card ld-price">
              <div className="ld-muted">Cuando prestas tus servicios</div>
              <div className="ld-price__big">96% neto</div>
              <p className="ld-muted">
                Recibes el 96% directo en tu billetera Open Payments tras la aprobación o ventana final.
              </p>
              <p className="ld-mt">
                <Link href="/marketplace" className="btn btn-emerald">
                  Aplicar a trabajos
                </Link>
              </p>
            </div>
            <div className="card ld-card ld-price">
              <div className="ld-muted">Protocolo · MERIDIA</div>
              <div className="ld-price__big">4% comisión</div>
              <p className="ld-muted">
                Tarifa plana sobre el bloque custodiado. Sin costos de suscripción ni cargos ocultos.
              </p>
              <p className="ld-mt">
                <a href="#faq" className="btn btn-outline">
                  Ver preguntas frecuentes
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="ld-section">
        <div className="ld-inner">
          <div className="ld-center">
            <h2 className="ld-h2 kinetic-heading">Plataformas tradicionales vs MERIDIA</h2>
            <p className="ld-muted ld-mt ld-mb">
              Compara cómo se protegen tus entregas y tu liquidez en toda América.
            </p>
          </div>
          <div className="ld-scroll">
            <table className="ld-table">
              <thead>
                <tr>
                  <th />
                  <th>Tradicional</th>
                  <th>MERIDIA (Open Payments)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Custodia</td>
                  <td>Retenciones de 14 a 21 días</td>
                  <td>100% en custodia GNAP con liquidación en segundos</td>
                </tr>
                <tr>
                  <td>Comisión</td>
                  <td>15% al 20% + cargos de retiro</td>
                  <td>4% fijo · 96% directo al Freelancer</td>
                </tr>
                <tr>
                  <td>Plazos</td>
                  <td>Acuerdos ambiguos en chat</td>
                  <td>Relojes deterministas 7d / 24h / +7d / 32h / 30m</td>
                </tr>
                <tr>
                  <td>Revisión</td>
                  <td>Archivos sin protección</td>
                  <td>Visor Protegido + Consejero IA (Imagen y Texto)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="ld-section ld-section--soft">
        <div className="ld-inner ld-faq">
          <div className="ld-center">
            <h2 className="ld-h2 kinetic-heading">Preguntas frecuentes sobre MERIDIA</h2>
          </div>
          <details className="ld-details">
            <summary>¿Cuánto cobra MERIDIA por cada trabajo?</summary>
            <p>
              Únicamente el 4% del monto en custodia cuando la orden se liquida con éxito. El Freelancer recibe el 96%
              íntegro en su billetera Open Payments.
            </p>
          </details>
          <details className="ld-details">
            <summary>¿Necesito dos cuentas distintas para contratar y para trabajar como Freelancer?</summary>
            <p>
              No. En MERIDIA todos los usuarios tienen una cuenta unificada con su billetera verificada: puedes publicar
              encargos como Cliente y postularte o vender servicios como Freelancer directamente desde el Marketplace sin
              cambiar de modo ni de sesión.
            </p>
          </details>
          <details className="ld-details">
            <summary>¿La IA aprueba o rechaza el pago por su cuenta?</summary>
            <p>
              No. El Consejero de IA analiza entregables de imagen y texto frente a los criterios obligatorios y emite
              una recomendación consultiva. La decisión la toma el Cliente dentro de su ventana de 32 horas.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}

export function LandingAvatarStrip() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 18 }}>
      <div className="ld-strip">
        {COMMUNITY_PEOPLE.map((person, i) => (
          <img
            key={person.name}
            src={person.photo}
            alt={person.name}
            title={`${person.name} · ${person.role}`}
            className="ld-strip__avatar"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              objectFit: 'cover',
              marginLeft: i === 0 ? 0 : -10,
              border: '2px solid var(--surface-solid)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>+1,240 profesionales y clientes</strong> operando en tiempo real
      </span>
    </div>
  );
}

