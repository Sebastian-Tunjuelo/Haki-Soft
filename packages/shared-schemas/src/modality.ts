const IMAGE_MEDIA = 'IMAGE_RASTER_VECTOR';
const TEXT_MEDIA = 'DOCUMENT_TEXT';

/** Solo imagen y texto entran al Consejero de IA en el MVP (CONTEXT.md §6.1). */
export function resolveMvpAiAuditableModality(
  mediaType: string,
): 'IMAGE' | 'TEXT' | null {
  if (mediaType === IMAGE_MEDIA) return 'IMAGE';
  if (mediaType === TEXT_MEDIA) return 'TEXT';
  return null;
}
