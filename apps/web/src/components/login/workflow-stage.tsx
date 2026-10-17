'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  FINAL_STEP_DURATION_MS,
  HANDOFF_START,
  STEP_DURATION_MS,
  WORKFLOW_NODES,
  layoutTrack,
  nodeStateFor,
  type PlacedWorkflowNode,
  type TrackHole,
  type TrackLayout,
} from './workflow-nodes';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

const LAST_STEP = Math.max(0, WORKFLOW_NODES.length - 1);
const SPARK_COUNT = 4;

type MotionMode = 'pending' | 'full' | 'reduced';
type VisualState = ReturnType<typeof nodeStateFor> | 'rest';

interface Frame {
  width: number;
  height: number;
  hole: TrackHole | null;
}

interface WorkflowStageProps {
  /** Fuerza el modo de movimiento reducido (pruebas o vistas estáticas). */
  reducedMotion?: boolean;
}

/**
 * Circuito del login. En el showcase ocupa un lienzo contenido;
 * las órbitas tapan el trazo y los tramos tienen hueco en cada nodo.
 */
export function WorkflowStage({ reducedMotion: forcedReduced }: WorkflowStageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [motion, setMotion] = useState<MotionMode>(
    forcedReduced === undefined ? 'pending' : forcedReduced ? 'reduced' : 'full',
  );
  const [step, setStep] = useState(0);
  const [frame, setFrame] = useState<Frame | null>(null);
  const playing = motion === 'full';
  const layout = frame ? layoutTrack(frame.width, frame.height, frame.hole) : null;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const bounds = root.getBoundingClientRect();
      const width = Math.round(bounds.width);
      const height = Math.round(bounds.height);
      if (width < 80 || height < 80) return;

      const contained = root.closest('.auth-showcase');
      const card = contained
        ? null
        : root.closest('.auth-shell')?.querySelector('.auth-card');
      let hole: TrackHole | null = null;
      if (card instanceof HTMLElement) {
        const box = card.getBoundingClientRect();
        hole = {
          left: Math.round(box.left - bounds.left),
          top: Math.round(box.top - bounds.top),
          right: Math.round(box.right - bounds.left),
          bottom: Math.round(box.bottom - bounds.top),
        };
      }

      setFrame((current) => {
        if (
          current &&
          current.width === width &&
          current.height === height &&
          current.hole?.left === hole?.left &&
          current.hole?.top === hole?.top &&
          current.hole?.right === hole?.right &&
          current.hole?.bottom === hole?.bottom
        ) {
          return current;
        }
        return { width, height, hole };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    const card = root.closest('.auth-shell')?.querySelector('.auth-card');
    if (card) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (forcedReduced !== undefined) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setMotion(query.matches ? 'reduced' : 'full');
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, { scope: rootRef, dependencies: [forcedReduced] });

  useGSAP(() => {
    if (motion !== 'full' || !layout) return;
    const root = rootRef.current;
    if (!root) return;

    const sparks = Array.from(root.querySelectorAll<SVGCircleElement>('[data-spark]'));
    const dashes = Array.from(root.querySelectorAll<SVGPathElement>('[data-dash]'));
    const aura = root.querySelector<HTMLElement>('[data-aura]');
    const progress = { value: 0 };

    dashes.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${Math.max(8, length * 0.08)} ${Math.max(14, length * 0.12)}`;
    });

    gsap.to(dashes, {
      strokeDashoffset: -120,
      duration: 4.8,
      ease: 'none',
      repeat: -1,
    });

    if (aura) {
      gsap.to(aura, {
        opacity: 0.55,
        scale: 1.06,
        duration: 2.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        transformOrigin: '50% 50%',
      });
    }

    const paint = (stepIndex: number) => {
      const edges = Array.from(root.querySelectorAll<SVGPathElement>('[data-edge]'));
      const loop = root.querySelector<SVGPathElement>('[data-loop]');
      const path = stepIndex === LAST_STEP ? loop : edges[stepIndex];
      const handoff = (progress.value - HANDOFF_START) / (1 - HANDOFF_START);
      const length = path?.getTotalLength() ?? 0;
      const isLoop = stepIndex === LAST_STEP;
      const tone = isLoop ? 'tide' : (layout.edges[stepIndex]?.tone ?? 'volt');

      sparks.forEach((dot, index) => {
        dot.setAttribute('data-tone', tone);
        const local = handoff - index * 0.14;
        if (!path || length === 0 || local <= 0 || local >= 1) {
          dot.setAttribute('opacity', '0');
          return;
        }
        const eased = local < 0.5 ? 2 * local * local : 1 - (-2 * local + 2) ** 2 / 2;
        const point = path.getPointAtLength(eased * length);
        dot.setAttribute('cx', point.x.toFixed(1));
        dot.setAttribute('cy', point.y.toFixed(1));
        const fade = Math.min(1, local * 6, (1 - local) * 6);
        dot.setAttribute('opacity', (fade * (isLoop ? 0.5 : 0.95)).toFixed(2));
      });
    };

    const timeline = gsap.timeline({ repeat: -1 });
    WORKFLOW_NODES.forEach((_, index) => {
      const duration = (index === LAST_STEP ? FINAL_STEP_DURATION_MS : STEP_DURATION_MS) / 1000;
      timeline.call(() => {
        progress.value = 0;
        setStep(index);
      });
      timeline.to(progress, {
        value: 1,
        duration,
        ease: 'none',
        onUpdate: () => paint(index),
      });
    });

    return () => {
      sparks.forEach((dot) => dot.setAttribute('opacity', '0'));
    };
  }, { scope: rootRef, dependencies: [motion, Boolean(layout)], revertOnUpdate: true });

  return (
    <>
      <span className="login-flow__anchor" aria-hidden="true" />
      <section
        ref={rootRef}
        className="login-flow"
        aria-hidden="true"
        data-motion={playing ? 'on' : 'off'}
        data-reduced={motion === 'reduced' ? 'true' : 'false'}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          ['--flow-orb' as string]: `${layout?.orb ?? 40}px`,
        }}
      >
        {layout ? <Track layout={layout} step={step} playing={playing} /> : null}
        <style>{LOGIN_FLOW_CSS}</style>
      </section>
    </>
  );
}

function loopState(playing: boolean, step: number): VisualState {
  if (!playing) return 'rest';
  return step === LAST_STEP ? 'active' : 'idle';
}

function Track({ layout, step, playing }: { layout: TrackLayout; step: number; playing: boolean }) {
  return (
    <>
      <div
        className="login-flow__aura"
        data-aura=""
        style={{
          left: `${layout.centerLabel.x}px`,
          top: `${layout.centerLabel.y}px`,
        }}
      />
      <svg
        className="login-flow__svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <defs>
          <linearGradient id="login-flow-tone" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={layout.width} y2={layout.height}>
            <stop offset="0%" stopColor="#4cd0ba" />
            <stop offset="42%" stopColor="#4cd0ba" />
            <stop offset="58%" stopColor="#e8c84a" />
            <stop offset="100%" stopColor="#e8c84a" />
          </linearGradient>
          <filter id="login-flow-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        {layout.trackGaps.map((d, index) => (
          <path
            key={`halo-${index}`}
            d={d}
            className="login-flow__halo"
            filter="url(#login-flow-glow)"
          />
        ))}
        {layout.trackGaps.map((d, index) => (
          <path key={`track-${index}`} d={d} className="login-flow__track" />
        ))}
        {layout.trackGaps.map((d, index) => (
          <path key={`dash-${index}`} d={d} className="login-flow__dash" data-dash="" />
        ))}
        <path
          d={layout.loop.d}
          className="login-flow__edge"
          data-loop=""
          data-tone={layout.loop.tone}
          data-state={loopState(playing, step)}
        />
        {layout.edges.map((edge, index) => (
          <path
            key={`${edge.from}-${edge.to}`}
            d={edge.d}
            className="login-flow__edge"
            data-edge=""
            data-tone={edge.tone}
            data-state={playing ? nodeStateFor(index, step) : 'rest'}
          />
        ))}
        {/* Disco opaco bajo cada órbita: el trazo nunca se ve atravesando el círculo. */}
        {layout.nodes.map((node) => (
          <circle
            key={`cap-${node.id}`}
            cx={node.x}
            cy={node.y}
            r={layout.orb * 0.72}
            className="login-flow__cap"
          />
        ))}
        {Array.from({ length: SPARK_COUNT }, (_, index) => (
          <circle
            key={index}
            data-spark=""
            r={index === 0 ? 4.2 : index === 1 ? 2.8 : 1.8}
            opacity={0}
            className="login-flow__spark"
          />
        ))}
      </svg>
      <div
        className="login-flow__center"
        style={{
          left: `${layout.centerLabel.x}px`,
          top: `${layout.centerLabel.y}px`,
        }}
      >
        {layout.centerLabel.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div className="login-flow__nodes">
        {layout.nodes.map((node, index) => (
          <FlowNode
            key={node.id}
            node={node}
            state={playing ? nodeStateFor(index, step) : 'rest'}
            index={index}
          />
        ))}
      </div>
    </>
  );
}

interface FlowNodeProps {
  node: PlacedWorkflowNode;
  state: VisualState;
  index: number;
}

function FlowNode({ node, state, index }: FlowNodeProps) {
  const Icon = node.icon;
  const style = {
    left: `${node.x}px`,
    top: `${node.y}px`,
    animationDelay: `${index * 0.18}s`,
  } as CSSProperties;

  return (
    <div
      className="login-flow__node"
      data-tone={node.tone}
      data-state={state}
      data-side={node.side}
      data-label={node.label}
      style={style}
    >
      <span className="login-flow__ring" aria-hidden="true" />
      <div className="login-flow__orb">
        <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <div className="login-flow__caption">
        <p className="login-flow__title">{node.title}</p>
        <p className="login-flow__detail">{node.detail}</p>
      </div>
    </div>
  );
}

const LOGIN_FLOW_CSS = `
.login-flow__anchor {
  display: block;
  min-width: 0;
  min-height: 0;
  pointer-events: none;
}

.login-flow {
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  background:
    radial-gradient(420px 160px at 50% 8%, rgba(var(--volt-rgb), 0.1), transparent 70%),
    radial-gradient(380px 150px at 50% 92%, rgba(var(--tide-rgb), 0.1), transparent 72%),
    var(--soft);
  color: var(--text-primary);
  font-family: var(--font-display, inherit);
}

.login-flow__aura {
  position: absolute;
  width: min(42%, 220px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(var(--volt-rgb), 0.14), transparent 62%),
    radial-gradient(circle, rgba(var(--tide-rgb), 0.12), transparent 78%);
  opacity: 0.4;
  filter: blur(2px);
}

.login-flow__svg,
.login-flow__nodes {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.login-flow__center {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  pointer-events: none;
  z-index: 1;
}

.login-flow__center span {
  font-size: clamp(12px, 1.5vw, 15px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--mist);
}

.login-flow__center span:last-child {
  background: linear-gradient(115deg, var(--tide), var(--volt));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-flow__halo,
.login-flow__track,
.login-flow__edge,
.login-flow__dash {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-flow__halo {
  stroke: url(#login-flow-tone);
  stroke-width: 7;
  opacity: 0.14;
}

.login-flow__cap {
  fill: var(--soft);
}

.login-flow__track {
  stroke: url(#login-flow-tone);
  stroke-width: 2.4;
  opacity: 0.78;
}

.login-flow__dash {
  stroke: var(--border);
  stroke-width: 1.2;
  opacity: 0.9;
}

.login-flow__edge {
  stroke-width: 3;
  opacity: 0;
  transition: opacity 0.45s ease, stroke-width 0.45s ease;
}

.login-flow__edge[data-tone='volt'] {
  stroke: var(--volt);
}

.login-flow__edge[data-tone='tide'] {
  stroke: var(--tide);
}

.login-flow__edge[data-state='done'] {
  opacity: 0.92;
}

.login-flow__edge[data-state='active'] {
  opacity: 1;
  stroke-width: 3.8;
}

.login-flow__edge[data-state='active'][data-tone='volt'] {
  filter: drop-shadow(0 0 4px rgba(var(--volt-rgb), 0.45));
}

.login-flow__edge[data-state='active'][data-tone='tide'] {
  filter: drop-shadow(0 0 4px rgba(var(--tide-rgb), 0.45));
}

.login-flow__spark {
  fill: var(--volt);
}

.login-flow__spark[data-tone='tide'] {
  fill: var(--tide);
}

.login-flow__node {
  position: absolute;
  width: var(--flow-orb, 40px);
  height: var(--flow-orb, 40px);
  transform: translate(-50%, -50%);
  z-index: 2;
}

.login-flow__ring {
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  border: 1px solid transparent;
  opacity: 0;
  pointer-events: none;
}

.login-flow__orb {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--surface);
  background-image:
    radial-gradient(circle at 50% 36%, rgba(var(--tide-rgb), 0.08), transparent 55%);
  transition: box-shadow 0.55s ease, transform 0.55s ease, color 0.55s ease;
}

.login-flow__orb::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: var(--surface);
  z-index: -1;
}

.login-flow__orb svg {
  width: 42%;
  height: 42%;
}

.login-flow__node[data-tone='volt'] .login-flow__orb {
  color: var(--volt);
  box-shadow:
    0 0 0 2px var(--soft),
    0 0 0 3px rgba(var(--volt-rgb), 0.55),
    0 0 12px 1px rgba(var(--volt-rgb), 0.22);
}

.login-flow__node[data-tone='tide'] .login-flow__orb {
  color: var(--tide);
  box-shadow:
    0 0 0 2px var(--soft),
    0 0 0 3px rgba(var(--tide-rgb), 0.55),
    0 0 12px 1px rgba(var(--tide-rgb), 0.22);
}

.login-flow__node[data-state='active'][data-tone='volt'] .login-flow__orb {
  color: var(--volt);
  box-shadow:
    0 0 0 2px var(--soft),
    0 0 0 3px rgba(var(--volt-rgb), 0.75),
    0 0 14px 2px rgba(var(--volt-rgb), 0.28);
  animation: login-flow-breathe 2.8s ease-in-out infinite;
}

.login-flow__node[data-state='active'][data-tone='tide'] .login-flow__orb {
  color: var(--tide);
  box-shadow:
    0 0 0 2px var(--soft),
    0 0 0 3px rgba(var(--tide-rgb), 0.75),
    0 0 14px 2px rgba(var(--tide-rgb), 0.28);
  animation: login-flow-breathe 2.8s ease-in-out infinite;
}

.login-flow__node[data-state='active'] .login-flow__ring {
  opacity: 1;
  border-color: currentColor;
  animation: login-flow-ring 2.4s ease-out infinite;
}

.login-flow__node[data-tone='volt'] .login-flow__ring {
  color: rgba(var(--volt-rgb), 0.5);
}

.login-flow__node[data-tone='tide'] .login-flow__ring {
  color: rgba(var(--tide-rgb), 0.5);
}

@keyframes login-flow-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

@keyframes login-flow-ring {
  0% { transform: scale(0.92); opacity: 0.7; }
  100% { transform: scale(1.45); opacity: 0; }
}

.login-flow__caption {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-width: 118px;
  pointer-events: none;
}

.login-flow__title {
  margin: 0;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.15;
  color: var(--text-primary);
}

.login-flow__detail {
  margin: 0;
  font-size: 10.5px;
  font-weight: 400;
  line-height: 1.2;
  color: var(--mist);
  white-space: nowrap;
}

.login-flow__node[data-label='above'] .login-flow__caption {
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  align-items: center;
  text-align: center;
}

.login-flow__node[data-label='below'] .login-flow__caption {
  left: 50%;
  top: calc(100% + 8px);
  transform: translateX(-50%);
  align-items: center;
  text-align: center;
}

.login-flow__node[data-label='left'] .login-flow__caption {
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  align-items: flex-end;
  text-align: right;
}

.login-flow__node[data-label='right'] .login-flow__caption {
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  align-items: flex-start;
  text-align: left;
}

.login-flow[data-motion='on'] .login-flow__node {
  animation: login-flow-enter 0.7s ease-out both;
}

@keyframes login-flow-enter {
  from { opacity: 0; transform: translate(-50%, -46%) scale(0.92); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.login-flow[data-motion='off'] .login-flow__orb,
.login-flow[data-motion='off'] .login-flow__ring,
.login-flow[data-reduced='true'] .login-flow__orb,
.login-flow[data-reduced='true'] .login-flow__ring {
  animation: none;
}

@media (max-width: 860px) {
  .login-flow__title {
    font-size: 12px;
  }

  .login-flow__detail {
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-flow *,
  .login-flow *::before,
  .login-flow *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;
