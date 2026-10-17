import { AiAdvisorError } from './errors';

export type AdvisorImagePayload = {
  mimeType: string;
  /** Base64 sin prefijo data: */
  base64: string;
};

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

/** Límite alineado al embed local de preview (evita payloads enormes hacia Groq). */
export const MAX_ADVISOR_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Extrae payload visual seguro: solo data URLs o base64 crudo.
 * Rechaza http(s) para no reenviar URLs privadas/firmadas a terceros.
 */
export function extractAdvisorImagePayload(params: {
  imageSignedUrlOrBase64?: string | null;
  mimeType: string;
}): AdvisorImagePayload | null {
  const raw = params.imageSignedUrlOrBase64?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    throw new AiAdvisorError(
      'AI_ADVISOR_INVALID_INPUT',
      'No se reenvían URLs remotas de imagen al proveedor; use data URL embebida desde storage local.',
    );
  }

  const dataUrl = /^data:([^;,]+);base64,(.+)$/is.exec(raw);
  if (dataUrl) {
    const mimeType = normalizeMime(dataUrl[1]);
    const base64 = dataUrl[2].replace(/\s+/g, '');
    assertDecodable(base64, mimeType);
    return { mimeType, base64 };
  }

  const mimeType = normalizeMime(params.mimeType);
  const base64 = raw.replace(/\s+/g, '');
  assertDecodable(base64, mimeType);
  return { mimeType, base64 };
}

function normalizeMime(mime: string): string {
  const m = mime.trim().toLowerCase();
  if (m === 'image/jpg') return 'image/jpeg';
  if (!ALLOWED_MIME.has(m)) {
    throw new AiAdvisorError(
      'AI_ADVISOR_INVALID_INPUT',
      `MIME de imagen no soportado para el consejero: ${mime}`,
    );
  }
  return m;
}

function assertDecodable(base64: string, mimeType: string): void {
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, 'base64');
  } catch {
    throw new AiAdvisorError('AI_ADVISOR_INVALID_INPUT', 'Payload de imagen base64 inválido.');
  }
  if (bytes.length === 0) {
    throw new AiAdvisorError('AI_ADVISOR_INVALID_INPUT', 'Payload de imagen vacío.');
  }
  if (bytes.length > MAX_ADVISOR_IMAGE_BYTES) {
    throw new AiAdvisorError(
      'AI_ADVISOR_INVALID_INPUT',
      `Imagen supera el máximo de ${MAX_ADVISOR_IMAGE_BYTES} bytes para el consejero.`,
    );
  }
  void mimeType;
}
