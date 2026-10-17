'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Shield, Sparkles, Activity } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Función pura y determinista para verificar soporte nativo de WebGL
 * Previene el fallo `WEBGL_UNAVAILABLE` antes de montar el `<Canvas>`.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Núcleo 3D de Custodia Escrow y Canales Interledger
 * INVARIANTE CRÍTICA (SPEC-03 §2.3 / RF-03):
 * La animación en scroll muta directamente `useRef` de THREE.Group / Mesh.
 * CERO llamadas a useState dentro del callback de scroll o requestAnimationFrame.
 */
function EscrowVaultCore({
  groupRef,
  isReducedMotion,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  isReducedMotion: boolean;
}) {
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const secondaryRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Micro-rotación idle continua en frameloop a 60–120 FPS sin tocar estado React
  useFrame((_, delta) => {
    if (isReducedMotion) return;

    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y += delta * 0.35;
      innerMeshRef.current.rotation.x += delta * 0.15;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.25;
      outerRingRef.current.rotation.x -= delta * 0.12;
    }
    if (secondaryRingRef.current) {
      secondaryRingRef.current.rotation.y -= delta * 0.3;
      secondaryRingRef.current.rotation.z += delta * 0.18;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.08;
    }
  });

  // Generar nube de partículas interledger estática en memoria
  const particlesGeometry = useMemo(() => {
    const count = 48;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 2.2 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Luz focal interna */}
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#00f0ff" distance={6} />

      {/* Flotador suave para sensación de custodia ingrávida */}
      <Float speed={isReducedMotion ? 0 : 2} rotationIntensity={isReducedMotion ? 0 : 0.4} floatIntensity={isReducedMotion ? 0 : 0.6}>
        {/* Núcleo Criptográfico Central (Icosaedro facetado translúcido) */}
        <mesh ref={innerMeshRef}>
          <icosahedronGeometry args={[1.15, 0]} />
          <meshPhysicalMaterial
            color="#0b172a"
            emissive="#0284c7"
            emissiveIntensity={0.65}
            roughness={0.15}
            metalness={0.85}
            transmission={0.4}
            thickness={1.2}
            transparent
            opacity={0.92}
            wireframe={false}
          />
        </mesh>

        {/* Wireframe holográfico de seguridad sobre el núcleo */}
        <mesh>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.35} />
        </mesh>

        {/* Anillo Orbital Primario: Protocolo Interledger y Open Payments */}
        <mesh ref={outerRingRef} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.85, 0.035, 16, 64]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={1.2}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Anillo Orbital Secundario: Invariante 96% Freelancer / 4% Plataforma */}
        <mesh ref={secondaryRingRef} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
          <torusGeometry args={[2.1, 0.025, 16, 64]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.9}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Constelación de Nodos Interledger flotantes */}
        <points ref={particlesRef} geometry={particlesGeometry}>
          <pointsMaterial size={0.06} color="#7dd3fc" transparent opacity={0.85} sizeAttenuation />
        </points>
      </Float>
    </group>
  );
}

/**
 * Fallback HTML estático y accesible cuando WebGL no está disponible
 * (RF-06 / WEBGL_UNAVAILABLE).
 */
export function HeroWebGLFallback() {
  return (
    <div
      className="card"
      style={{
        minHeight: 440,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: 40,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.6) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand-blue)',
          marginBottom: 20,
        }}
      >
        <Shield size={32} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>
        Bóveda Criptográfica en Escrow
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 20 }}>
        Garantía de custodia de fondos al 100% en Open Payments. Desembolso dual automatizado (96% Freelancer / 4% TaskStream) con plazos inmutables.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="badge badge-buyer">
          <Activity size={13} style={{ marginRight: 6 }} />
          Modo Estático Activo (WebGL no requerido)
        </span>
        <span className="badge badge-verified">
          <Sparkles size={13} style={{ marginRight: 6 }} />
          100% Accesible
        </span>
      </div>
    </div>
  );
}

export interface HeroSceneProps {
  /**
   * Identificador opcional para pruebas y vinculación con ScrollTrigger
   */
  containerId?: string;
  /**
   * Forzar modo de movimiento reducido para pruebas
   */
  forceReducedMotion?: boolean;
}

/**
 * Componente Principal de la Escena Hero 3D vinculada al Scroll
 * Responsabilidad de Rol: FE-2 (T-F1-FE2-02)
 */
export default function HeroScene({ containerId = 'hero-3d-section', forceReducedMotion }: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Verificación en cliente de WebGL y accesibilidad
  useEffect(() => {
    const webglSupported = isWebGLAvailable();
    setHasWebGL(webglSupported);

    if (forceReducedMotion !== undefined) {
      setIsReducedMotion(forceReducedMotion);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [forceReducedMotion]);

  // Invariante 3 de SPEC-03 / RF-03:
  // useGSAP vincula ScrollTrigger directamente sobre refs de THREE sin re-renders en React
  useGSAP(
    () => {
      if (!hasWebGL || isReducedMotion || !groupRef.current || !containerRef.current) {
        return;
      }

      // Animación vinculada al scroll con scrub progresivo
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top+=80',
          end: 'bottom top',
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // Muta directamente los vectores de Three.js (CERO llamadas a setState)
      tl.to(
        groupRef.current.rotation,
        {
          x: Math.PI * 1.2,
          y: Math.PI * 2.2,
          z: Math.PI * 0.4,
          ease: 'none',
        },
        0
      );

      tl.to(
        groupRef.current.position,
        {
          y: -0.4,
          z: 0.8,
          ease: 'none',
        },
        0
      );

      tl.to(
        groupRef.current.scale,
        {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          ease: 'none',
        },
        0
      );
    },
    { scope: containerRef, dependencies: [hasWebGL, isReducedMotion] }
  );

  // Estado previo a la comprobación de cliente o sin WebGL
  if (hasWebGL === false) {
    return <HeroWebGLFallback />;
  }

  return (
    <div
      id={containerId}
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '480px',
        minHeight: '480px',
        overflow: 'hidden',
        borderRadius: 16,
        background: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.08) 0%, rgba(10, 15, 30, 0) 70%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Indicador contextual de telemetría y FPS (RF-04) */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          fontSize: 11,
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: isReducedMotion ? '#f59e0b' : '#10b981',
            boxShadow: isReducedMotion ? '0 0 6px #f59e0b' : '0 0 6px #10b981',
          }}
        />
        <span>{isReducedMotion ? 'Frame 0 (Motion Reduced)' : '60–120 FPS · ScrollTrigger'}</span>
      </div>

      {hasWebGL && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true,
          }}
          dpr={[1, 2]} // Soporte optimizado para pantallas Retina / 120Hz
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, -5, -5]} intensity={0.6} color="#00f0ff" />
          <EscrowVaultCore groupRef={groupRef} isReducedMotion={isReducedMotion} />
        </Canvas>
      )}
    </div>
  );
}
