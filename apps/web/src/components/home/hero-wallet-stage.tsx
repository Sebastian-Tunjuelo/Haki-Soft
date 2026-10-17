'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  TimerReset,
  Bot,
} from 'lucide-react';
import { useRef } from 'react';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const FEATURES = [
  {
    id: 'secure',
    title: 'Custodia 100% en bloque',
    detail: 'El Cliente deposita una vez; GNAP protege los fondos',
    icon: ShieldCheck,
    tone: 'volt' as const,
  },
  {
    id: 'fast',
    title: 'Liquidación en segundos',
    detail: '96% directo al Freelancer sin esperas de 14 días',
    icon: Zap,
    tone: 'tide' as const,
  },
  {
    id: 'auto',
    title: 'Relojes deterministas',
    detail: 'Plazos claros: 7d entrega · 32h revisión · 30m final',
    icon: TimerReset,
    tone: 'volt' as const,
  },
  {
    id: 'ai',
    title: 'Consejero IA (Imagen/Texto)',
    detail: 'Auditoría consultiva antes de liberar la custodia',
    icon: Bot,
    tone: 'tide' as const,
  },
];

/**
 * Hero Stage: Prisma Meridiano + Billetera de Custodia 96/4 con inclinación 3D y ScrollTrigger scrub.
 */
export function HeroWalletStage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const wallet = root.querySelector<HTMLElement>('.hw-wallet');
      const glow = root.querySelector('.hw-glow');
      const chips = root.querySelectorAll('.hw-chip');
      const features = root.querySelectorAll('.hw-feature');

      gsap.set([wallet, ...features, ...chips], { opacity: 0 });
      gsap.set(features, { y: 10 });
      gsap.set(wallet, { x: 0, y: 12, rotateY: -16, rotateX: 8, transformPerspective: 900 });

      if (reduce) {
        gsap.set([wallet, ...features, ...chips], {
          opacity: 1,
          x: 0,
          y: 0,
          rotateY: 0,
          rotateX: 0,
          clearProps: 'transform',
        });
        return;
      }

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .to(glow, { opacity: 1, duration: 0.5 }, 0)
        .to(features, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }, 0.05)
        .to(wallet, { opacity: 1, y: 0, duration: 0.55 }, 0.12)
        .to(chips, { opacity: 1, stagger: 0.06, duration: 0.3 }, 0.3);

      gsap.fromTo(
        wallet,
        { rotateY: -16, rotateX: 7 },
        {
          rotateY: 16,
          rotateX: 3,
          duration: 3.6,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          delay: 0.55,
        },
      );

      gsap.to(wallet, {
        y: '+=6',
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.55,
      });

      gsap.to(glow, {
        opacity: 0.78,
        scale: 1.08,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.55,
      });

      const cycle = gsap.timeline({ repeat: -1, delay: 0.9 });
      features.forEach((el, i) => {
        const t = i * 2;
        cycle
          .call(() => el.classList.add('is-active'), undefined, t)
          .call(() => el.classList.remove('is-active'), undefined, t + 1.5);
      });

      gsap.to(root.querySelectorAll('.hw-float'), {
        y: '-=5',
        duration: 2,
        stagger: { each: 0.3, yoyo: true, repeat: -1 },
        ease: 'sine.inOut',
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="hw-stage" aria-label="Prisma Meridiano y Billetera de custodia en movimiento">
      <div className="hw-glow" aria-hidden="true" />
      <div className="hw-grid" aria-hidden="true" />

      <div className="hw-badge">
        <span className="hw-badge__dot" />
        MERIDIA · Custodia Open Payments en vivo
      </div>

      <div className="hw-features">
        {FEATURES.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.id} className={`hw-feature hw-feature--${item.tone}`}>
              <span className="hw-feature__icon">
                <Icon size={15} />
              </span>
              <div className="hw-feature__copy">
                <p className="hw-feature__title">{item.title}</p>
                <p className="hw-feature__detail">{item.detail}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hw-track">
        <span className="hw-float hw-float--a" aria-hidden="true">
          96% FREELANCER
        </span>
        <span className="hw-float hw-float--b" aria-hidden="true">
          4% MERIDIA
        </span>
        <span className="hw-float hw-float--c" aria-hidden="true">
          GNAP · ILP
        </span>

        <div className="hw-wallet" role="img" aria-label="Billetera MERIDIA con fondos en custodia">
          <div className="hw-wallet__shine" aria-hidden="true" />
          <div className="hw-wallet__top">
            <span className="hw-wallet__mark" style={{ background: 'transparent' }}>
              <MeridiaPrismLogo size={32} />
            </span>
            <span className="hw-wallet__chip">CUSTODIA 96/4</span>
          </div>
          <p className="hw-wallet__label">Bloque Único en Custodia</p>
          <p className="hw-wallet__amount tabular-num">
            $450<span>.00 USD</span>
          </p>
          <div className="hw-wallet__row tabular-num">
            <span>Freelancer 96% ($432)</span>
            <span className="hw-wallet__volt">Meridia 4% ($18)</span>
          </div>
          <div className="hw-wallet__bar" aria-hidden="true">
            <i style={{ width: '96%' }} />
          </div>
          <div className="hw-wallet__footer">
            <Sparkles size={12} />
            Liquidación atómica al aprobar entrega
          </div>
        </div>
      </div>

      <div className="hw-chips" aria-hidden="true">
        <span className="hw-chip">USD · COP · MXN · BRL · CAD</span>
        <span className="hw-chip hw-chip--tide">Reembolso 100% garantizado</span>
        <span className="hw-chip">Visor Protegido</span>
      </div>
    </div>
  );
}
