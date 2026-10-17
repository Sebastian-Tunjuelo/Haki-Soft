import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'storage', 'deliverables');
const RASTER_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
/** Límite para embeber el original en el SVG de preview (MVP local sin sharp). */
const MAX_EMBED_BYTES = 4 * 1024 * 1024;

export function ensureDeliverableStorage(): void {
  mkdirSync(ROOT, { recursive: true });
}

export function buildOriginalKey(taskId: string, revision: number, fileExtension: string): string {
  const ext = fileExtension.startsWith('.') ? fileExtension : `.${fileExtension}`;
  return `originals/${taskId}/${revision}/${randomUUID()}${ext}`.replace(/\\/g, '/');
}

export function buildPreviewKey(taskId: string, revision: number): string {
  return `previews/${taskId}/${revision}/${randomUUID()}.svg`.replace(/\\/g, '/');
}

export function writeObject(key: string, bytes: Buffer): void {
  ensureDeliverableStorage();
  const absolute = join(ROOT, key);
  mkdirSync(join(absolute, '..'), { recursive: true });
  writeFileSync(absolute, bytes);
}

export function readObject(key: string): Buffer | null {
  const absolute = join(ROOT, key);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute);
}

export function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Preview protegido: para imágenes raster embebe el original (base64) bajo marca de agua.
 * Sin sharp en el MVP local — el SVG acota visualmente a ~960×640.
 */
export function buildWatermarkedSvgPreview(input: {
  fileName: string;
  mediaType: string;
  revisionNumber: number;
  originalBytes?: Buffer | null;
  mimeType?: string;
}): Buffer {
  const safeName = input.fileName.replace(/[<>&"]/g, '');
  const mime = (input.mimeType ?? '').toLowerCase();
  const canEmbed =
    Boolean(input.originalBytes?.length) &&
    RASTER_MIME.has(mime) &&
    (input.originalBytes?.length ?? 0) <= MAX_EMBED_BYTES;

  if (canEmbed && input.originalBytes) {
    const dataUri = `data:${mime};base64,${input.originalBytes.toString('base64')}`;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="960" height="640" viewBox="0 0 960 640">
  <defs>
    <clipPath id="frame"><rect x="0" y="0" width="960" height="640" rx="0"/></clipPath>
  </defs>
  <rect width="960" height="640" fill="#0b1220"/>
  <image href="${dataUri}" xlink:href="${dataUri}" x="0" y="0" width="960" height="640"
         preserveAspectRatio="xMidYMid meet" clip-path="url(#frame)"/>
  <rect width="960" height="640" fill="rgba(15,23,42,0.18)"/>
  <text x="480" y="300" text-anchor="middle" fill="#fbbf24" font-family="Segoe UI, Arial, sans-serif"
        font-size="36" font-weight="700" opacity="0.72" transform="rotate(-22 480 320)">
    TaskStream AI · WATERMARK
  </text>
  <text x="480" y="350" text-anchor="middle" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif"
        font-size="20" opacity="0.65" transform="rotate(-22 480 320)">
    PREVIEW · NO DESCARGABLE
  </text>
  <rect x="0" y="0" width="960" height="52" fill="rgba(15,23,42,0.78)"/>
  <text x="24" y="34" fill="#93c5fd" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700">
    TaskStream AI — Protected Preview · ${safeName} · rev ${input.revisionNumber}
  </text>
  <rect x="0" y="598" width="960" height="42" fill="rgba(15,23,42,0.78)"/>
  <text x="24" y="626" fill="#94a3b8" font-family="Segoe UI, Arial, sans-serif" font-size="13">
    Original bloqueado durante IN_REVIEW. Vista con marca de agua (SPEC-07).
  </text>
</svg>`;
    return Buffer.from(svg, 'utf8');
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="960" height="640" fill="url(#bg)"/>
  <text x="40" y="72" fill="#93c5fd" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700">
    TaskStream AI — Protected Preview
  </text>
  <text x="40" y="120" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="16">
    Archivo: ${safeName}
  </text>
  <text x="40" y="152" fill="#94a3b8" font-family="Segoe UI, Arial, sans-serif" font-size="14">
    Tipo: ${input.mediaType} · Revisión ${input.revisionNumber}
  </text>
  <text x="40" y="220" fill="#fbbf24" font-family="Segoe UI, Arial, sans-serif" font-size="20" opacity="0.85"
        transform="rotate(-18 280 300)">
    WATERMARK · NO DESCARGABLE
  </text>
  <text x="40" y="580" fill="#64748b" font-family="Segoe UI, Arial, sans-serif" font-size="13">
    Este formato no embebe vista previa visual en el MVP local (o el archivo supera 4 MB).
  </text>
</svg>`;
  return Buffer.from(svg, 'utf8');
}
