'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'ts-theme:v1';

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(STORAGE_KEY, mode);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const sunRef = useRef<SVGSVGElement>(null);
  const moonRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const next = readTheme();
    applyTheme(next);
    setTheme(next);
    setReady(true);
  }, []);

  const { contextSafe } = useGSAP({ scope: btnRef });

  useEffect(() => {
    if (!ready || !knobRef.current) return;
    const isDark = theme === 'dark';
    gsap.set(knobRef.current, { x: isDark ? 30 : 0 });
    if (sunRef.current && moonRef.current) {
      gsap.set(sunRef.current, {
        scale: isDark ? 0.35 : 1,
        opacity: isDark ? 0 : 1,
        rotate: isDark ? -90 : 0,
      });
      gsap.set(moonRef.current, {
        scale: isDark ? 1 : 0.35,
        opacity: isDark ? 1 : 0,
        rotate: isDark ? 0 : 90,
      });
    }
  }, [ready]);

  const animateSwitch = contextSafe((nextMode: ThemeMode) => {
    const isDark = nextMode === 'dark';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (knobRef.current) gsap.set(knobRef.current, { x: isDark ? 30 : 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });

    if (knobRef.current) {
      tl.to(
        knobRef.current,
        {
          x: isDark ? 30 : 0,
          rotate: isDark ? 180 : 0,
          duration: 0.56,
          ease: 'back.out(1.7)',
        },
        0,
      );
    }

    if (sunRef.current && moonRef.current) {
      tl.to(
        sunRef.current,
        {
          scale: isDark ? 0.25 : 1,
          opacity: isDark ? 0 : 1,
          rotate: isDark ? -120 : 0,
          duration: 0.42,
          ease: 'power3.out',
        },
        0,
      ).to(
        moonRef.current,
        {
          scale: isDark ? 1 : 0.25,
          opacity: isDark ? 1 : 0,
          rotate: isDark ? 0 : 120,
          duration: 0.45,
          ease: 'back.out(1.6)',
        },
        0.04,
      );
    }

    const sparks = btnRef.current?.querySelectorAll('.theme-toggle__spark');
    if (sparks && sparks.length > 0) {
      tl.fromTo(
        sparks,
        { scale: 0, opacity: 1 },
        {
          scale: 1.55,
          opacity: 0,
          duration: 0.52,
          stagger: 0.04,
          ease: 'power2.out',
        },
        0.05,
      );
    }
  });

  const toggle = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
    animateSwitch(next);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      className={`theme-toggle theme-toggle-orbital ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Cambiar a modo claro (Sol)' : 'Cambiar a modo oscuro (Luna)'}
      disabled={!ready}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__spark theme-toggle__spark--1" />
        <span className="theme-toggle__spark theme-toggle__spark--2" />
        <span className="theme-toggle__spark theme-toggle__spark--3" />
      </span>

      <span ref={knobRef} className="theme-toggle__knob" aria-hidden="true">
        {/* Sol Dorado (Light Mode) */}
        <svg
          ref={sunRef}
          className="theme-toggle__icon theme-toggle__icon--sun"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="4.6" fill="currentColor" />
          <path
            d="M12 2V4.5M12 19.5V22M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M2 12H4.5M19.5 12H22M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>

        {/* Luna Creciente Esmeralda/Obsidiana (Dark Mode) */}
        <svg
          ref={moonRef}
          className="theme-toggle__icon theme-toggle__icon--moon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M20.4 14.6A8.5 8.5 0 0 1 9.4 3.6a8.5 8.5 0 1 0 11 11Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="17.5" cy="6.5" r="1.2" fill="var(--volt)" />
        </svg>
      </span>
    </button>
  );
}
