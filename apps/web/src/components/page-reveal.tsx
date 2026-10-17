'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, type ReactNode } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type PageRevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Entrada compartida (fade + lift) + subrayado animado en títulos + ScrollTrigger cinético.
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
        gsap.set(root.querySelectorAll('.ts-reveal, .js-scroll-card, .js-scroll-heading, .js-person-pop'), {
          clearProps: 'all',
          opacity: 1,
          y: 0,
          scale: 1,
        });
        titles.forEach((el) => el.classList.add('is-underlined'));
        return;
      }

      const items = root.querySelectorAll('.ts-reveal');
      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.58,
            stagger: 0.08,
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

      gsap.delayedCall(0.35, () => {
        titles.forEach((el) => el.classList.add('is-underlined'));
      });

      // ScrollTrigger: Kinetic Headings (grow and lift when entering viewport)
      const scrollHeadings = root.querySelectorAll('.js-scroll-heading, .ld-h2, .ld-price__big');
      scrollHeadings.forEach((heading) => {
        gsap.fromTo(
          heading,
          { opacity: 0.25, y: 24, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: heading,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      });

      // ScrollTrigger: Cards & Step Modules
      const scrollCards = root.querySelectorAll('.ld-card, .inicio-jpg-mini-card, .meridia-user-stat');
      scrollCards.forEach((card, idx) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 28, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            delay: (idx % 3) * 0.06,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      });

      // ScrollTrigger: Real People Portraits pop-in with spring
      const peopleNodes = root.querySelectorAll('.ld-person-badge, .ld-strip__avatar');
      if (peopleNodes.length) {
        peopleNodes.forEach((node, idx) => {
          gsap.fromTo(
            node,
            { opacity: 0, scale: 0.78, y: 12 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.48,
              delay: (idx % 5) * 0.05,
              ease: 'back.out(1.8)',
              scrollTrigger: {
                trigger: node,
                start: 'top 92%',
                toggleActions: 'play none none reverse',
              },
            },
          );
        });
      }

      // ScrollTrigger: Barra de progreso en "Cómo funciona MERIDIA" (#how)
      const howSection = root.querySelector('#how');
      const howProgress = root.querySelector('.how-progress-fill');
      if (howSection && howProgress) {
        gsap.fromTo(
          howProgress,
          { scaleX: 0.08 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: howSection,
              start: 'top 78%',
              end: 'bottom 55%',
              scrub: 0.5,
            },
          },
        );
      }
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}

