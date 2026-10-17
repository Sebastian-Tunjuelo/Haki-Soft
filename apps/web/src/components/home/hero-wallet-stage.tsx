'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  TimerReset,
  Bot,
  Wallet,
} from 'lucide-react';
import { useRef } from 'react';

const FEATURES = [
  {
    id: 'secure',
    title: 'Custodia segura',
    detail: 'Fondos bloqueados con GNAP hasta liberar',
    icon: ShieldCheck,
    tone: 'volt' as const,
  },
  {
    id: 'fast',
    title: 'Pago en minutos',
    detail: 'Sin esperar 14 días de clearing',
    icon: Zap,
    tone: 'tide' as const,
  },
  {
    id: 'auto',
    title: 'Liberación automática',
    detail: 'Tras aprobación o timeout, split 96/4',
    icon: TimerReset,
    tone: 'volt' as const,
  },
  {
    id: 'ai',
    title: 'Revisión con IA',
    detail: 'Chequeo de entrega en imagen y texto',
    icon: Bot,
    tone: 'tide' as const,
  },
];

/**
 * Hero: billetera con inclinación L↔R (rotateY); features arriba, sin tapar la card.
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
      // Inclinación inicial (no traslación horizontal)
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

      // Giro = inclinación L ↔ R (rotateY), sin mover de lado a lado
      gsap.fromTo(
        wallet,
        { rotateY: -18, rotateX: 7 },
        {
          rotateY: 18,
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
        opacity: 0.75,
        scale: 1.06,
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
    <div ref={rootRef} className="hw-stage" aria-label="Billetera de custodia en movimiento">
      <div className="hw-glow" aria-hidden="true" />
      <div className="hw-grid" aria-hidden="true" />

      <div className="hw-badge">
        <span className="hw-badge__dot" />
        Open Payments · en vivo
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
          IA
        </span>
        <span className="hw-float hw-float--b" aria-hidden="true">
          GNAP
        </span>
        <span className="hw-float hw-float--c" aria-hidden="true">
          ILP
        </span>

        <div className="hw-wallet" role="img" aria-label="Billetera TaskStream con fondos en custodia">
          <div className="hw-wallet__shine" aria-hidden="true" />
          <div className="hw-wallet__top">
            <span className="hw-wallet__mark">
              <Wallet size={16} />
            </span>
            <span className="hw-wallet__chip">ESCROW</span>
          </div>
          <p className="hw-wallet__label">En custodia</p>
          <p className="hw-wallet__amount">
            $12<span>.40</span>k
          </p>
          <div className="hw-wallet__row">
            <span>Seller 96%</span>
            <span className="hw-wallet__volt">Fee 4%</span>
          </div>
          <div className="hw-wallet__bar" aria-hidden="true">
            <i style={{ width: '96%' }} />
          </div>
          <div className="hw-wallet__footer">
            <Sparkles size={12} />
            Liberación al aprobar entrega
          </div>
        </div>
      </div>

      <div className="hw-chips" aria-hidden="true">
        <span className="hw-chip">Seguridad criptográfica</span>
        <span className="hw-chip hw-chip--tide">Pagos automáticos</span>
        <span className="hw-chip">Sin 14 días</span>
      </div>
    </div>
  );
}
