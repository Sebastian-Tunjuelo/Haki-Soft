import { describe, expect, it } from 'vitest';
import { assertDeliverablePrecheck, CreateDeliverableUploadSchema } from './deliverables';

describe('SPEC-07 assertDeliverablePrecheck (RF-05)', () => {
  it('rechaza archivo vacío', () => {
    const result = assertDeliverablePrecheck({ fileSizeBytes: 0, extensionAllowed: true });
    expect(result.nonEmptyFile).toBe(false);
    expect(result.failureReasons).toContain('EMPTY_DELIVERABLE');
  });

  it('rechaza extensión no permitida', () => {
    const result = assertDeliverablePrecheck({ fileSizeBytes: 120, extensionAllowed: false });
    expect(result.extensionAllowed).toBe(false);
    expect(result.failureReasons).toContain('EXTENSION_NOT_ALLOWED');
  });

  it('acepta archivo no vacío con extensión válida', () => {
    const result = assertDeliverablePrecheck({ fileSizeBytes: 2048, extensionAllowed: true });
    expect(result.nonEmptyFile).toBe(true);
    expect(result.extensionAllowed).toBe(true);
    expect(result.failureReasons).toEqual([]);
  });

  it('valida CreateDeliverableUploadSchema', () => {
    const parsed = CreateDeliverableUploadSchema.safeParse({
      taskId: '11111111-1111-4111-8111-111111111111',
      revisionNumber: 0,
      fileName: 'logo.png',
      mimeType: 'image/png',
      fileExtension: '.png',
    });
    expect(parsed.success).toBe(true);
  });
});
