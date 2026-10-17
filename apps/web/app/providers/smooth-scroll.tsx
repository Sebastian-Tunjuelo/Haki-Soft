'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Registro global idempotente de plugins de GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface SmoothScrollContextValue {
  lenis: Lenis | null;
  isReducedMotion: boolean;
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean; duration?: number }) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  lenis: null,
  isReducedMotion: false,
  scrollTo: () => {},
});

export function useSmoothScroll(): SmoothScrollContextValue {
  return useContext(SmoothScrollContext);
}

// Guard de módulo para prevenir doble instanciación del ticker o lenis en la misma ruta
let activeLenisSingleton: Lenis | null = null;
let activeTickerCallback: ((time: number) => void) | null = null;

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si estamos en entorno servidor, salir inmediatamente
    if (typeof window === 'undefined') return;

    // Comprobar preferencia de accesibilidad de movimiento reducido
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReduced = mediaQuery.matches;
    setIsReducedMotion(prefersReduced);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Si ya existe una instancia activa (SCROLL_PROVIDER_DUPLICATED), la reutilizamos
    if (activeLenisSingleton) {
      setLenisInstance(activeLenisSingleton);
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange);
      };
    }

    // Inicializar Lenis respetando prefers-reduced-motion
    const lenis = new Lenis({
      duration: prefersReduced ? 0.01 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !prefersReduced,
      touchMultiplier: 1.5,
    });

    activeLenisSingleton = lenis;
    setLenisInstance(lenis);

    // Invariante 2 de SPEC-03:
    // Lenis avisa a ScrollTrigger en cada scroll
    const handleScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on('scroll', handleScroll);

    // El ticker de GSAP empuja a Lenis con lagSmoothing(0)
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    activeTickerCallback = tickerCallback;

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Refrescar ScrollTrigger tras inicializar
    ScrollTrigger.refresh();

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);

      if (activeTickerCallback) {
        gsap.ticker.remove(activeTickerCallback);
        activeTickerCallback = null;
      }

      lenis.off('scroll', handleScroll);
      lenis.destroy();
      activeLenisSingleton = null;

      // Invariante 4: Limpiar triggers huérfanos al desmontar
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const scrollTo = (
    target: string | number | HTMLElement,
    options?: { offset?: number; immediate?: boolean; duration?: number }
  ) => {
    if (lenisInstance) {
      lenisInstance.scrollTo(target, options);
    } else if (typeof window !== 'undefined') {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: options?.immediate ? 'auto' : 'smooth' });
      } else if (typeof target === 'string') {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth' });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth' });
      }
    }
  };

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisInstance, isReducedMotion, scrollTo }}>
      <div ref={containerRef} className="smooth-scroll-wrapper" style={{ width: '100%', minHeight: '100%' }}>
        {children}
      </div>
    </SmoothScrollContext.Provider>
  );
}
