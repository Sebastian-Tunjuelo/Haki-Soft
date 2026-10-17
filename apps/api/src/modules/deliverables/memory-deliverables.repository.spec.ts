import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { mockAiAdvisorReport } from '@taskstream/shared-schemas';
import { MemoryDeliverablesRepository } from './memory-deliverables.repository';

describe('MemoryDeliverablesRepository.saveAiReport', () => {
  it('segundo save del mismo deliverableId → ALREADY_EXISTS y find conserva el primero', async () => {
    const repo = new MemoryDeliverablesRepository();
    const taskId = randomUUID();
    const buyerId = randomUUID();
    const sellerId = randomUUID();
    const deliverableId = randomUUID();

    repo.seedOrder({
      taskId,
      buyerId,
      sellerId,
      lifecycleStatus: 'IN_REVIEW',
      expectedMediaType: 'DOCUMENT_TEXT',
      allowedExtensions: ['.md'],
    });

    await repo.createPending({
      id: deliverableId,
      taskOrderId: taskId,
      revisionNumber: 0,
      originalR2Key: `orig/${deliverableId}`,
      fileName: 'nota.md',
      mimeType: 'text/markdown',
      fileExtension: '.md',
      fileSizeBytes: 32,
      sha256Checksum: 'a'.repeat(64),
      mediaType: 'DOCUMENT_TEXT',
      previewStatus: 'READY',
    });

    const first = mockAiAdvisorReport({
      taskId,
      deliverableId,
      auditableModality: 'TEXT',
      advisoryScore: 81,
      advisoryLabel: 'HIGH_COMPLIANCE',
      executiveSummaryForBuyer: 'Primer informe persistido. La decisión de pago es del Buyer.',
    });
    const second = mockAiAdvisorReport({
      taskId,
      deliverableId,
      auditableModality: 'TEXT',
      advisoryScore: 10,
      advisoryLabel: 'LOW_COMPLIANCE',
      executiveSummaryForBuyer: 'Segundo intento que no debe reemplazar al primero.',
    });

    await expect(repo.saveAiReport(first)).resolves.toBe('OK');
    await expect(repo.saveAiReport(second)).resolves.toBe('ALREADY_EXISTS');

    const stored = await repo.findAiReport(deliverableId);
    expect(stored).not.toBeNull();
    expect(stored?.advisoryScore).toBe(81);
    expect(stored?.advisoryLabel).toBe('HIGH_COMPLIANCE');
    expect(stored?.executiveSummaryForBuyer).toContain('Primer informe');
  });
});
