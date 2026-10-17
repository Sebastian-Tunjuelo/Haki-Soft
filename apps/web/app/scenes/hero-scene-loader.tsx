'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Shield, Sparkles } from 'lucide-react';
import type { HeroSceneProps } from './hero-scene';

/**
 * Placeholder reservado durante la descarga del chunk 3D de WebGL
 * Previene el Cumulative Layout Shift (CLS) manteniendo exactamente la misma altura (480px).
 */
export function HeroScenePlaceholder() {
  return (
    <div
      style={{
        width: '100%',
        height: '480px',
        minHeight: '480px',
        borderRadius: 16,
        background: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.05) 0%, rgba(10, 15, 30, 0.4) 70%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: 'var(--text-secondary)',
      }}
      aria-label="Cargando entorno 3D de custodia"
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '1px dashed rgba(56, 189, 248, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand-blue)',
          animation: 'pulse 2.5s infinite ease-in-out',
        }}
      >
        <Shield size={28} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} style={{ color: 'var(--brand-blue)' }} />
          <span>Cargando escena de custodia 3D...</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Dynamic Import aislado en cliente (Invariante 1 y 2 de SPEC-03 / RF-02)
 * CERO evaluación de Three.js / WebGL en el proceso Node de Next.js SSR.
 */
const DynamicHeroScene = dynamic<HeroSceneProps>(
  () => import('./hero-scene'),
  {
    ssr: false,
    loading: () => <HeroScenePlaceholder />,
  }
);

export function HeroSceneLoader(props: HeroSceneProps) {
  return <DynamicHeroScene {...props} />;
}

export default HeroSceneLoader;
