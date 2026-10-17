import React, { useId } from 'react';

export interface MeridiaPrismLogoProps {
  size?: number;
  showWordmark?: boolean;
  showSubmark?: boolean;
  className?: string;
}

/**
 * Logo Oficial Único: "El Prisma Meridiano" (MERIDIA)
 * Basado en el prisma piramidal cristalino de `meridia-rec-custodia-light.jpg`:
 * - Pirámide cristalina facetada con aristas de obsidiana y platino adaptativas a Light/Dark Mode.
 * - Haz de luz entrante superior (100% Bloque Único en Custodia) que atraviesa el eje meridiano central.
 * - Refracción dual exacta:
 *   · Faceta Derecha / Haz 96% (Esmeralda Interledger `--tide` #0D9488 / #10B981) -> Freelancer.
 *   · Faceta Izquierda / Haz 4% (Ámbar Solar `--volt` #D99B26 / #E5A93C) -> Protocolo Meridia.
 */
export function MeridiaPrismLogo({
  size = 38,
  showWordmark = false,
  showSubmark = false,
  className = '',
}: MeridiaPrismLogoProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <span
      className={`meridia-brand-lockup ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showWordmark ? '0.72rem' : '0',
        verticalAlign: 'middle',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="meridia-prism-svg"
        aria-hidden="true"
      >
        <defs>
          {/* Halo de refracción exterior */}
          <radialGradient id={`prism-halo-${uid}`} cx="50%" cy="52%" r="50%">
            <stop offset="0%" stopColor="var(--tide)" stopOpacity="0.28" />
            <stop offset="55%" stopColor="var(--volt)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--tide)" stopOpacity="0" />
          </radialGradient>

          {/* Faceta Izquierda: Cristal Obsidiana / Platino con reflejo Ámbar Solar (4%) */}
          <linearGradient id={`facet-left-${uid}`} x1="12" y1="12" x2="34" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--prism-facet-top, #334155)" stopOpacity="0.95" />
            <stop offset="58%" stopColor="var(--prism-facet-mid, #1E293B)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="var(--volt)" stopOpacity="0.88" />
          </linearGradient>

          {/* Faceta Derecha: Cristal Refractivo con flujo Esmeralda Interledger (96%) */}
          <linearGradient id={`facet-right-${uid}`} x1="32" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--prism-facet-light, #E2E8F0)" stopOpacity="0.92" />
            <stop offset="45%" stopColor="var(--tide)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.96" />
          </linearGradient>

          {/* Base inferior del prisma */}
          <linearGradient id={`facet-base-${uid}`} x1="10" y1="48" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--volt)" stopOpacity="0.85" />
            <stop offset="50%" stopColor="var(--prism-core, #0F172A)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--tide)" stopOpacity="0.95" />
          </linearGradient>

          {/* Eje Meridiano Central (Laser de Custodia) */}
          <linearGradient id={`meridian-axis-${uid}`} x1="32" y1="4" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="var(--volt)" />
            <stop offset="100%" stopColor="var(--tide)" />
          </linearGradient>
        </defs>

        {/* Anillo de órbita / Halo sutil de custodia */}
        <circle cx="32" cy="34" r="28" fill={`url(#prism-halo-${uid})`} />
        <ellipse
          cx="32"
          cy="48"
          rx="24"
          ry="7.5"
          stroke="var(--border-hi)"
          strokeWidth="1.15"
          strokeDasharray="3 3"
          opacity="0.75"
        />

        {/* Haz entrante superior (100% Custodia) */}
        <path
          d="M19 6L32 23"
          stroke="var(--volt)"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Sombra de base del prisma */}
        <polygon
          points="32,57 10,48 54,48"
          fill={`url(#facet-base-${uid})`}
          stroke="var(--border-hi)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Faceta Piramidal Izquierda (4% Protocolo / Ámbar) */}
        <polygon
          points="32,9 10,48 32,56"
          fill={`url(#facet-left-${uid})`}
          stroke="var(--prism-stroke, rgba(255,255,255,0.45))"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />

        {/* Faceta Piramidal Derecha (96% Freelancer / Esmeralda) */}
        <polygon
          points="32,9 54,48 32,56"
          fill={`url(#facet-right-${uid})`}
          stroke="var(--prism-stroke, rgba(255,255,255,0.55))"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />

        {/* Faceta Interna de Refracción Cristalina (Corte Diamante) */}
        <polygon
          points="32,16 21,45 32,51 43,45"
          fill="rgba(255, 255, 255, 0.14)"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />

        {/* Haz Refractado Izquierdo (4% Comisión Ámbar Solar) */}
        <path
          d="M32 31L12 43"
          stroke="var(--volt)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Haz Refractado Derecho (96% Liquidación Esmeralda) */}
        <path
          d="M32 29L55 39"
          stroke="var(--tide)"
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          d="M32 33L52 45"
          stroke="#34D399"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Eje Meridiano Vertical Luminoso */}
        <line
          x1="32"
          y1="8"
          x2="32"
          y2="56"
          stroke={`url(#meridian-axis-${uid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Vértice Superior y Núcleo Fotónico */}
        <circle cx="32" cy="9" r="2.6" fill="#FFFFFF" stroke="var(--volt)" strokeWidth="1.2" />
        <circle cx="32" cy="30" r="3.2" fill="#FFFFFF" stroke="var(--tide)" strokeWidth="1.5" />
      </svg>

      {showWordmark ? (
        <span className="meridia-brand-text">
          <span className="meridia-brand-wordmark">MERIDIA</span>
          {showSubmark ? (
            <span className="meridia-brand-submark">OPEN PAYMENTS ESCROW · 96 / 4</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Ícono no genérico para acciones primarias ("Publica ya tu actividad" / "+ Publicar tarea")
 * Un prisma octaédrico con núcleo luminoso de emisión.
 */
export function PrismActionIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polygon
        points="12,2 21,12 12,22 3,12"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Ícono no genérico para conmutación de rol ("Modo Cliente / Freelancer")
 * Dos órbitas meridianas entrelazadas con nodos gemelos.
 */
export function DualOrbitIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="4.5"
        transform="rotate(-28 12 12)"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="4.5"
        transform="rotate(28 12 12)"
        stroke="currentColor"
        strokeWidth="1.75"
        opacity="0.75"
      />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <circle cx="19" cy="8.5" r="1.6" fill="currentColor" />
      <circle cx="5" cy="15.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Emblema 3D/SVG Original para el Panel de MODO CLIENTE:
 * Brújula Meridiana & Bóveda de Custodia Dorada (No un ícono genérico de bolsa de compras).
 */
export function ClientCompassEmblem({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="var(--volt-dim)"
        stroke="var(--volt)"
        strokeWidth="1.6"
      />
      <circle
        cx="32"
        cy="32"
        r="21"
        stroke="var(--volt)"
        strokeWidth="1.1"
        strokeDasharray="4 3"
        opacity="0.75"
      />
      <polygon
        points="32,10 40,28 54,32 40,36 32,54 24,36 10,32 24,28"
        fill="var(--volt)"
        fillOpacity="0.22"
        stroke="var(--volt)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <polygon points="32,14 37,32 32,50 27,32" fill="var(--volt)" />
      <circle cx="32" cy="32" r="4.5" fill="#FFFFFF" stroke="var(--volt-ink)" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * Emblema 3D/SVG Original para el Panel de MODO FREELANCER:
 * Nodo Orbital Esmeralda de Liquidación 96% (No un maletín genérico).
 */
export function FreelancerOrbitEmblem({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="var(--tide-dim)"
        stroke="var(--tide)"
        strokeWidth="1.6"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="23"
        ry="10"
        transform="rotate(-30 32 32)"
        stroke="var(--tide)"
        strokeWidth="1.6"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="23"
        ry="10"
        transform="rotate(30 32 32)"
        stroke="var(--tide)"
        strokeWidth="1.6"
        opacity="0.7"
      />
      <polygon
        points="32,15 46,32 32,49 18,32"
        fill="var(--tide)"
        fillOpacity="0.28"
        stroke="var(--tide)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="5" fill="#FFFFFF" stroke="var(--tide)" strokeWidth="2" />
      <circle cx="49" cy="22" r="3" fill="var(--tide)" />
      <circle cx="15" cy="42" r="3" fill="var(--volt)" />
    </svg>
  );
}
