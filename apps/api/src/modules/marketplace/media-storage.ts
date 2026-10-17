import { mkdirSync, writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT = join(process.cwd(), 'storage', 'marketplace');

export function ensureMarketplaceStorageDir(): void {
  mkdirSync(ROOT, { recursive: true });
}

export function writeMarketplaceMediaFile(input: {
  entityType: string;
  entityId: string;
  mimeType: string;
  bytes: Buffer;
}): { storagePath: string; absolutePath: string } {
  ensureMarketplaceStorageDir();
  const ext =
    input.mimeType === 'image/png' ? 'png' : input.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${randomUUID()}.${ext}`;
  const relative = join(input.entityType.toLowerCase(), input.entityId, fileName);
  const absolutePath = join(ROOT, relative);
  mkdirSync(join(ROOT, input.entityType.toLowerCase(), input.entityId), { recursive: true });
  writeFileSync(absolutePath, input.bytes);
  return { storagePath: relative.replace(/\\/g, '/'), absolutePath };
}

export function readMarketplaceMediaFile(storagePath: string): Buffer | null {
  if (storagePath.startsWith('memory://')) return null;
  const absolutePath = join(ROOT, storagePath);
  if (!existsSync(absolutePath)) return null;
  return readFileSync(absolutePath);
}

export function deleteMarketplaceMediaFile(storagePath: string): void {
  if (storagePath.startsWith('memory://')) return;
  const absolutePath = join(ROOT, storagePath);
  if (existsSync(absolutePath)) unlinkSync(absolutePath);
}
