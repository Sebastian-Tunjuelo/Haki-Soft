'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, type ReactNode } from 'react';

type PageRevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Entrada compartida (fade + lift) + subrayado animado en títulos.
 * Respeta prefers-reduced-motion.
 */
export function PageReveal({ children, className }: PageRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const titles = root.querySelectorAll('.ts-title, .ts-section__title, .ts-underline');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduce) {
        gsap.set(root.querySelectorAll('.ts-reveal'), { clearProps: 'all', opacity: 1, y: 0 });
        titles.forEach((el) => el.classList.add('is-underlined'));
        return;
      }

      const items = root.querySelectorAll('.ts-reveal');
      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.07,
            ease: 'power2.out',
            clearProps: 'transform',
            onComplete: () => {
              titles.forEach((el) => el.classList.add('is-underlined'));
            },
          },
        );
      } else {
        titles.forEach((el) => el.classList.add('is-underlined'));
      }

      // Subrayado también si el título aparece más tarde en el stagger
      gsap.delayedCall(0.35, () => {
        titles.forEach((el) => el.classList.add('is-underlined'));
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
