import { z } from 'zod';
import { DeliverableMediaTypeEnum } from './schemas';

export const CreateDeliverableUploadSchema = z.object({
  taskId: z.string().uuid(),
  revisionNumber: z.number().int().min(0).max(2),
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(1).max(120),
  fileExtension: z.string().min(1).max(12),
});

export const CreateDeliverableUploadResultSchema = z.object({
  deliverableId: z.string().uuid(),
  uploadUrl: z.string().min(1),
  originalObjectKey: z.string().min(1),
  revisionNumber: z.number().int().min(0).max(2),
});

export const DeliverablePreviewViewSchema = z.object({
  deliverableId: z.string().uuid(),
  revisionNumber: z.number().int().min(0).max(2),
  previewUrl: z.string().min(1),
  originalAvailable: z.boolean(),
  mediaType: DeliverableMediaTypeEnum,
  previewStatus: z.enum(['PENDING_PROCESSING', 'READY', 'FAILED']),
  fileName: z.string().min(1).max(255),
});

export const DeliverableOriginalViewSchema = z.object({
  deliverableId: z.string().uuid(),
  downloadUrl: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
});

export const DeliverableCompleteResultSchema = z.object({
  deliverableId: z.string().uuid(),
  previewStatus: z.enum(['PENDING_PROCESSING', 'READY', 'FAILED']),
  lifecycleStatus: z.string().min(1),
});

export function assertDeliverablePrecheck(input: {
  fileSizeBytes: number;
  extensionAllowed: boolean;
}): {
  nonEmptyFile: boolean;
  extensionAllowed: boolean;
  failureReasons: string[];
} {
  const nonEmptyFile = input.fileSizeBytes > 0;
  const failureReasons: string[] = [];
  if (!nonEmptyFile) failureReasons.push('EMPTY_DELIVERABLE');
  if (!input.extensionAllowed) failureReasons.push('EXTENSION_NOT_ALLOWED');
  return {
    nonEmptyFile,
    extensionAllowed: input.extensionAllowed,
    failureReasons,
  };
}

export type CreateDeliverableUploadInput = z.infer<typeof CreateDeliverableUploadSchema>;
export type CreateDeliverableUploadResult = z.infer<typeof CreateDeliverableUploadResultSchema>;
export type DeliverablePreviewView = z.infer<typeof DeliverablePreviewViewSchema>;
export type DeliverableOriginalView = z.infer<typeof DeliverableOriginalViewSchema>;
export type DeliverableCompleteResult = z.infer<typeof DeliverableCompleteResultSchema>;
