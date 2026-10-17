'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { ArrowLeft, Percent, Shield, Wallet } from 'lucide-react';
import { ThemeToggle } from '@/src/components/theme-toggle';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';

const WorkflowStage = dynamic(
  () => import('./workflow-stage').then((module) => module.WorkflowStage),
  { ssr: false },
);

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

const REST_RING = 0.18;
const REST_GLOW = 0;
const HOVER_RING = 0.4;
const HOVER_GLOW = 0.12;

interface AuthShellProps {
  title: string;
  lead: string;
  children: ReactNode;
}

/**
 * El diagrama vive en el panel izquierdo. Si falla el render, el formulario sigue usable.
 */
class WorkflowBackdrop extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('El escenario del login no se pudo dibujar.', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  size: number;
  color: string;
}

const SPARK_COLORS = ['#E5A93C', '#10B981'] as const;
const SPARK_MAX = 8;

/**
 * Destellos cortos al mover el puntero. El canvas no recibe eventos.
 * Con prefers-reduced-motion no se dibuja nada.
 */
function LoginSparks({ hostRef }: { hostRef: React.RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let sparks: Spark[] = [];
    let frame = 0;
    let lastStamp = 0;
    let cssWidth = 1;
    let cssHeight = 1;
    let primed = false;
    let lastX = 0;
    let lastY = 0;
    let lastSpawn = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const stop = () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
      sparks = [];
      context.clearRect(0, 0, cssWidth, cssHeight);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - lastStamp) / 1000);
      lastStamp = now;
      context.clearRect(0, 0, cssWidth, cssHeight);

      const alive: Spark[] = [];
      for (const spark of sparks) {
        const age = (now - spark.born) / spark.life;
        if (age >= 1) continue;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        const alpha = (1 - age) * (1 - age);
        context.globalAlpha = alpha * 0.28;
        context.fillStyle = spark.color;
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size * 2.1, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = alpha * 0.9;
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        context.fill();
        alive.push(spark);
      }
      context.globalAlpha = 1;
      sparks = alive;

      if (sparks.length > 0) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const kick = () => {
      if (frame !== 0) return;
      lastStamp = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const spawn = (x: number, y: number) => {
      if (sparks.length >= SPARK_MAX) sparks.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 16;
      const color = SPARK_COLORS[Math.random() < 0.55 ? 0 : 1] ?? SPARK_COLORS[0];
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        born: performance.now(),
        life: 280 + Math.random() * 200,
        size: 1 + Math.random() * 1.6,
        color,
      });
    };

    const onMove = (event: PointerEvent) => {
      if (reduce.matches) {
        stop();
        return;
      }
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (!primed) {
        primed = true;
        lastX = x;
        lastY = y;
        return;
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const distance = Math.hypot(dx, dy);
      if (distance < 34) return;
      const now = performance.now();
      if (now - lastSpawn < 90) return;
      lastSpawn = now;
      const nx = dx / distance;
      const ny = dy / distance;
      const trail = 7 + Math.random() * 8;
      spawn(x - nx * trail, y - ny * trail);
      if (Math.random() < 0.22 && sparks.length < SPARK_MAX) {
        spawn(x - nx * trail + (Math.random() - 0.5) * 7, y - ny * trail + (Math.random() - 0.5) * 7);
      }
      lastX = x;
      lastY = y;
      kick();
    };

    const onReduce = () => {
      if (reduce.matches) stop();
    };
    const onHide = () => {
      if (document.hidden) stop();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener('pointermove', onMove);
    reduce.addEventListener('change', onReduce);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      stop();
      observer.disconnect();
      host.removeEventListener('pointermove', onMove);
      reduce.removeEventListener('change', onReduce);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [hostRef]);

  return <canvas ref={canvasRef} className="auth-sparks" aria-hidden="true" />;
}

export function AuthShell({ title, lead, children }: AuthShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const card = cardRef.current;
      if (!card) return;

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        card.dataset.enter = 'static';
        return;
      }

      card.dataset.enter = 'play';
      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.68,
          ease: 'power2.out',
          clearProps: 'transform',
        },
      );

      if (!contextSafe) return;

      const releaseGlow = contextSafe(() => {
        gsap.set(card, { clearProps: '--auth-ring,--auth-glow' });
      });
      const glow = (ring: number, glowAmount: number, clear: boolean) => {
        gsap.to(card, {
          '--auth-ring': ring,
          '--auth-glow': glowAmount,
          duration: clear ? 0.5 : 0.42,
          ease: 'power1.out',
          overwrite: 'auto',
          onComplete: clear ? releaseGlow : undefined,
        });
      };

      const onEnter = contextSafe(() => {
        glow(HOVER_RING, HOVER_GLOW, false);
      });
      const onLeave = contextSafe(() => {
        glow(REST_RING, REST_GLOW, true);
      });

      card.addEventListener('pointerenter', onEnter);
      card.addEventListener('pointerleave', onLeave);
      return () => {
        card.removeEventListener('pointerenter', onEnter);
        card.removeEventListener('pointerleave', onLeave);
      };
    },
    { scope: shellRef },
  );

  return (
    <div className="auth-shell" ref={shellRef}>
      <div className="auth-grid">
        <aside className="auth-pitch" aria-label="Presentación de MERIDIA">
          <Link href="/" className="auth-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al inicio
          </Link>

          <div className="auth-pitch__intro">
            <p className="auth-pitch__brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MeridiaPrismLogo size={34} showWordmark />
            </p>
            <h1 className="auth-pitch__headline">
              Gestiona encargos y cobros sin fricción
            </h1>
            <p className="auth-pitch__text">
              Entra al panel para publicar como Cliente, prestar servicios como Freelancer y liberar pagos con custodia Open
              Payments en toda América.
            </p>
          </div>

          <div className="auth-product">
            <div className="auth-product__metrics" aria-hidden="true">
              <article className="auth-metric">
                <span className="auth-metric__icon">
                  <Shield size={16} />
                </span>
                <div>
                  <p className="auth-metric__label">En custodia</p>
                  <p className="auth-metric__value">
                    $12.4k <span>USD</span>
                  </p>
                  <p className="auth-metric__hint">Escrow activo</p>
                </div>
              </article>
              <article className="auth-metric">
                <span className="auth-metric__icon auth-metric__icon--tide">
                  <Wallet size={16} />
                </span>
                <div>
                  <p className="auth-metric__label">Liquidación</p>
                  <p className="auth-metric__value">
                    96% <span>Freelancer</span>
                  </p>
                  <p className="auth-metric__hint">Open Payments</p>
                </div>
              </article>
              <article className="auth-metric">
                <span className="auth-metric__icon">
                  <Percent size={16} />
                </span>
                <div>
                  <p className="auth-metric__label">Comisión</p>
                  <p className="auth-metric__value">
                    4% <span>plana</span>
                  </p>
                  <p className="auth-metric__hint">Protocolo Meridia</p>
                </div>
              </article>
            </div>

            <div className="auth-showcase">
              <div className="auth-showcase__chrome">
                <span className="auth-showcase__dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="auth-showcase__label">Flujo de custodia MERIDIA</span>
                <span className="auth-showcase__live">En vivo</span>
              </div>
              <div className="auth-showcase__stage">
                <WorkflowBackdrop>
                  <WorkflowStage />
                </WorkflowBackdrop>
              </div>
            </div>

            <p className="auth-product__caption">
              Del encargo al pago: bloqueo, entrega, revisión IA y liberación 96/4 en un solo
              circuito.
            </p>
          </div>

          <p className="auth-pitch__foot">
            <span className="auth-pitch__mark" aria-hidden="true" style={{ background: 'transparent' }}>
              <MeridiaPrismLogo size={24} />
            </span>
            MERIDIA · Interledger · América continental
          </p>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel__theme">
            <ThemeToggle />
          </div>
          <section
            ref={cardRef}
            className="auth-card"
            data-enter="hold"
            aria-labelledby="auth-title"
            data-lenis-prevent=""
          >
            <div className="auth-card__glow" aria-hidden="true" />
            <div
              className="auth-card__mark"
              aria-hidden="true"
              style={{ background: 'var(--soft)', border: '1px solid var(--border-hi)' }}
            >
              <MeridiaPrismLogo size={40} />
            </div>
            <h2 id="auth-title" className="auth-title">
              {title}
            </h2>
            <p className="auth-lead">{lead}</p>
            {children}
          </section>
        </div>
      </div>
      <LoginSparks hostRef={shellRef} />
    </div>
  );
}
