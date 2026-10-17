/**
 * Fondo del login. Relato ilustrativo: no mueve dinero.
 * Siete nodos sobre un circuito orgánico (no un rectángulo),
 * con tramos que se detienen en el borde de cada órbita.
 */

import {
  ClipboardList,
  FileText,
  HandCoins,
  LockKeyhole,
  Sparkles,
  UserCheck,
  UserPen,
  type LucideIcon,
} from 'lucide-react';

export type WorkflowNodeKind =
  | 'tarea'
  | 'custodia'
  | 'ejecucion'
  | 'revision-ia'
  | 'informe'
  | 'aprobacion'
  | 'liberado';

/** Amarillo de trabajo (`volt`) o cian de valor (`tide`). El negro es el fondo. */
export type WorkflowTone = 'volt' | 'tide';

export type WorkflowSide = 'top' | 'right' | 'bottom' | 'left';

export type WorkflowLabel = 'above' | 'below' | 'left' | 'right';

export interface WorkflowNode {
  id: WorkflowNodeKind;
  /** Una o dos palabras, siempre visibles. */
  title: string;
  /** Frase corta bajo el título. */
  detail: string;
  icon: LucideIcon;
  tone: WorkflowTone;
  /** Fracción 0..1 a lo largo del circuito (antes del gap). */
  t: number;
  label: WorkflowLabel;
}

export interface TrackHole {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PlacedWorkflowNode {
  id: WorkflowNodeKind;
  title: string;
  detail: string;
  icon: LucideIcon;
  tone: WorkflowTone;
  side: WorkflowSide;
  x: number;
  y: number;
  label: WorkflowLabel;
}

export interface PlacedWorkflowEdge {
  from: WorkflowNodeKind;
  to: WorkflowNodeKind;
  d: string;
  tone: WorkflowTone;
}

export interface TrackLayout {
  width: number;
  height: number;
  orb: number;
  track: string;
  /** Tramos del circuito con hueco en cada nodo (halo / pista base). */
  trackGaps: readonly string[];
  nodes: readonly PlacedWorkflowNode[];
  edges: readonly PlacedWorkflowEdge[];
  loop: PlacedWorkflowEdge;
  centerLabel: { x: number; y: number; lines: readonly string[] };
}

export const STEP_DURATION_MS = 3000;
export const FINAL_STEP_DURATION_MS = 4600;
/** Fracción del paso a partir de la cual el punto viaja hacia el nodo siguiente. */
export const HANDOFF_START = 0.42;

export const WORKFLOW_NODES: readonly WorkflowNode[] = [
  {
    id: 'tarea',
    title: 'Tarea',
    detail: 'Acuerdo cerrado',
    icon: ClipboardList,
    tone: 'volt',
    t: 0.04,
    label: 'above',
  },
  {
    id: 'custodia',
    title: 'Custodia',
    detail: 'Fondos bloqueados',
    icon: LockKeyhole,
    tone: 'tide',
    t: 0.18,
    label: 'above',
  },
  {
    id: 'ejecucion',
    title: 'Ejecución',
    detail: 'Trabajo en curso',
    icon: UserPen,
    tone: 'volt',
    t: 0.32,
    label: 'right',
  },
  {
    id: 'revision-ia',
    title: 'Revisión IA',
    detail: 'Chequeo entrega',
    icon: Sparkles,
    tone: 'volt',
    t: 0.48,
    label: 'right',
  },
  {
    id: 'informe',
    title: 'Informe',
    detail: 'Criterios revisados',
    icon: FileText,
    tone: 'volt',
    t: 0.64,
    label: 'below',
  },
  {
    id: 'aprobacion',
    title: 'Aprobación',
    detail: 'Buyer confirma',
    icon: UserCheck,
    tone: 'tide',
    t: 0.78,
    label: 'below',
  },
  {
    id: 'liberado',
    title: 'Liberado',
    detail: 'Pago al seller',
    icon: HandCoins,
    tone: 'tide',
    t: 0.92,
    label: 'left',
  },
];

interface Pt {
  x: number;
  y: number;
}

function px(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/**
 * Circuito orgánico: hexágono suave con lados arqueados (no un rectángulo).
 * Los ancla están en fracciones del perímetro y se deforman con el lienzo.
 */
function organicAnchors(cx: number, cy: number, rx: number, ry: number): Pt[] {
  // Circuito facetado, contenido: deja margen para título + descripción.
  const raw: Array<[number, number]> = [
    [-0.52, -0.78],
    [0.58, -0.92],
    [1.05, 0.12],
    [0.32, 0.82],
    [-0.48, 0.92],
    [-1.05, 0.08],
  ];
  return raw.map(([nx, ny]) => ({
    x: cx + nx * rx,
    y: cy + ny * ry,
  }));
}

function buildOrganicPath(anchors: readonly Pt[]): { d: string; samples: Pt[]; lengths: number[]; total: number } {
  const n = anchors.length;
  const samples: Pt[] = [];
  const lengths: number[] = [0];
  let total = 0;

  // Controles: curva hacia afuera entre anclas consecutivas.
  const segments: Array<{ p0: Pt; p1: Pt; p2: Pt; p3: Pt }> = [];
  for (let i = 0; i < n; i += 1) {
    const p0 = anchors[i]!;
    const p3 = anchors[(i + 1) % n]!;
    const prev = anchors[(i - 1 + n) % n]!;
    const next = anchors[(i + 2) % n]!;
    const tension = 0.09;
    const p1 = {
      x: p0.x + (p3.x - prev.x) * tension,
      y: p0.y + (p3.y - prev.y) * tension,
    };
    const p2 = {
      x: p3.x - (next.x - p0.x) * tension,
      y: p3.y - (next.y - p0.y) * tension,
    };
    segments.push({ p0, p1, p2, p3 });
  }

  const steps = 18;
  for (const seg of segments) {
    for (let s = 1; s <= steps; s += 1) {
      const point = cubic(seg.p0, seg.p1, seg.p2, seg.p3, s / steps);
      const prev = samples[samples.length - 1];
      if (prev) {
        total += dist(prev, point);
        lengths.push(total);
      } else {
        lengths.push(0);
      }
      samples.push(point);
    }
  }

  // Cierra el muestreo al primer punto.
  if (samples.length > 0) {
    const first = samples[0]!;
    const last = samples[samples.length - 1]!;
    total += dist(last, first);
    lengths.push(total);
    samples.push({ ...first });
  }

  let d = '';
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i]!;
    if (i === 0) d += `M ${px(seg.p0.x)} ${px(seg.p0.y)}`;
    d += ` C ${px(seg.p1.x)} ${px(seg.p1.y)} ${px(seg.p2.x)} ${px(seg.p2.y)} ${px(seg.p3.x)} ${px(seg.p3.y)}`;
  }
  d += ' Z';

  return { d, samples, lengths, total };
}

function pointAtLength(samples: readonly Pt[], lengths: readonly number[], total: number, distance: number): Pt {
  if (samples.length === 0 || total <= 0) return { x: 0, y: 0 };
  const target = ((distance % total) + total) % total;
  let lo = 0;
  let hi = lengths.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if ((lengths[mid] ?? 0) < target) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const a = samples[i - 1]!;
  const b = samples[i] ?? a;
  const la = lengths[i - 1] ?? 0;
  const lb = lengths[i] ?? la;
  const span = Math.max(1e-6, lb - la);
  const t = (target - la) / span;
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function slicePolyline(
  samples: readonly Pt[],
  lengths: readonly number[],
  total: number,
  from: number,
  to: number,
): string {
  let start = ((from % total) + total) % total;
  let end = ((to % total) + total) % total;
  let span = end - start;
  if (span <= 1) span += total;
  end = start + span;

  const origin = pointAtLength(samples, lengths, total, start);
  let d = `M ${px(origin.x)} ${px(origin.y)}`;
  const step = Math.max(4, total / 80);
  for (let cursor = start + step; cursor < end - 0.5; cursor += step) {
    const p = pointAtLength(samples, lengths, total, cursor);
    d += ` L ${px(p.x)} ${px(p.y)}`;
  }
  const tip = pointAtLength(samples, lengths, total, end);
  d += ` L ${px(tip.x)} ${px(tip.y)}`;
  return d;
}

function sideFromLabel(label: WorkflowLabel): WorkflowSide {
  if (label === 'above') return 'top';
  if (label === 'below') return 'bottom';
  if (label === 'left') return 'left';
  return 'right';
}

/**
 * Circuito centrado y contenido. Los tramos se cortan en el radio de cada órbita.
 * `hole` se ignora en el showcase (el diagrama ya no rodea la card).
 */
export function layoutTrack(width: number, height: number, _hole: TrackHole | null): TrackLayout {
  // Margen amplio: título + detalle no se recortan contra el marco.
  const padX = Math.max(108, Math.min(142, width * 0.18));
  const padY = Math.max(68, Math.min(96, height * 0.21));
  const cx = width / 2;
  const cy = height / 2 + 2;
  const rx = Math.max(80, (width - padX * 2) / 2);
  const ry = Math.max(58, (height - padY * 2) / 2);
  const orb = Math.min(38, Math.max(30, Math.min(rx, ry) * 0.16));
  // Hueco mayor que el radio + halo del trazo para que la línea no “atraviese” el círculo.
  const gap = orb * 0.92;

  const anchors = organicAnchors(cx, cy, rx, ry);
  const { d: track, samples, lengths, total } = buildOrganicPath(anchors);

  const placed = WORKFLOW_NODES.map((node) => {
    const distance = node.t * total;
    const point = pointAtLength(samples, lengths, total, distance);
    return {
      id: node.id,
      title: node.title,
      detail: node.detail,
      icon: node.icon,
      tone: node.tone,
      side: sideFromLabel(node.label),
      x: point.x,
      y: point.y,
      distance,
      label: node.label,
    };
  });

  const edges: PlacedWorkflowEdge[] = [];
  const trackGaps: string[] = [];

  for (let index = 0; index < placed.length; index += 1) {
    const from = placed[index]!;
    const to = placed[(index + 1) % placed.length]!;
    let fromDist = from.distance + gap;
    let toDist = to.distance - gap;
    if (toDist <= fromDist) toDist += total;

    const segment = slicePolyline(samples, lengths, total, fromDist, toDist);
    trackGaps.push(segment);

    if (index < placed.length - 1) {
      edges.push({
        from: from.id,
        to: to.id,
        d: segment,
        tone: to.tone,
      });
    }
  }

  const first = placed[0]!;
  const last = placed[placed.length - 1]!;

  return {
    width,
    height,
    orb,
    track,
    trackGaps,
    nodes: placed.map(({ distance: _distance, ...node }) => node),
    edges,
    loop: {
      from: last.id,
      to: first.id,
      d: trackGaps[trackGaps.length - 1] ?? '',
      tone: first.tone,
    },
    centerLabel: {
      x: cx,
      y: cy,
      lines: ['De la tarea', 'al pago'],
    },
  };
}

export type NodeState = 'idle' | 'active' | 'done';

export function nodeStateFor(index: number, activeStep: number): NodeState {
  if (index === activeStep) return 'active';
  return index < activeStep ? 'done' : 'idle';
}
