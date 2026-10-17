import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { buildAiAdvisorInput } from './ai-advisor.runner';
import type { StoredDeliverable, StoredOrderForDeliverable } from './deliverables.types';
import { writeObject } from './object-storage';

function solidRgbPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const [r, g, b] = rgb;
  const raw = Buffer.alloc((1 + width * 3) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const compressed = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const chunk = (type: string, data: Buffer) => {
    const typeBuf = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    let c = 0xffffffff;
    const body = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < body.length; i++) {
      c ^= body[i]!;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  };
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

describe('buildAiAdvisorInput — IMAGE payload', () => {
  it('embebe data URL desde storage y lee dimensiones PNG (sin URL remota)', () => {
    const taskId = randomUUID();
    const deliverableId = randomUUID();
    const key = `originals/${taskId}/0/${deliverableId}.png`;
    const png = solidRgbPng(16, 16, [200, 10, 10]);
    writeObject(key, png);

    const order: StoredOrderForDeliverable = {
      taskId,
      buyerId: randomUUID(),
      sellerId: randomUUID(),
      lifecycleStatus: 'IN_REVIEW',
      expectedMediaType: 'IMAGE_RASTER_VECTOR',
      category: 'GRAPHICS_AND_DESIGN',
      scopeDescription: 'Logo rojo',
      acceptanceCriteria: [
        { criterionId: 'dominant-red', description: 'Rojo dominante', isMandatory: true },
      ],
      allowedExtensions: ['.png'],
      title: 'Logo',
      buyerDisplayName: 'Buyer',
      sellerDisplayName: 'Seller',
      totalAmountUSDInCents: 1000,
      fundsLockedAt: new Date(),
      initialDeliveryDays: 7,
    };

    const deliverable: StoredDeliverable = {
      id: deliverableId,
      taskOrderId: taskId,
      revisionNumber: 0,
      originalR2Key: key,
      previewR2Key: null,
      fileName: 'logo.png',
      mimeType: 'image/png',
      fileExtension: '.png',
      fileSizeBytes: png.length,
      sha256Checksum: 'a'.repeat(64),
      previewStatus: 'READY',
      mediaType: 'IMAGE_RASTER_VECTOR',
      contentUploaded: true,
      submittedAt: new Date(),
      reviewDecision: 'PENDING_REVIEW',
      reviewDecidedAt: null,
      buyerRevisionNotes: null,
    };

    const input = buildAiAdvisorInput({ order, deliverable });
    expect(input).not.toBeNull();
    expect(input!.auditableModality).toBe('IMAGE');
    expect(input!.deliverableArtifact.imageSignedUrlOrBase64?.startsWith('data:image/png;base64,')).toBe(
      true,
    );
    expect(input!.deliverableArtifact.imageSignedUrlOrBase64?.startsWith('http')).toBe(false);
    expect(input!.deliverableArtifact.imageDimensions).toEqual({ widthPx: 16, heightPx: 16 });
  });
});
