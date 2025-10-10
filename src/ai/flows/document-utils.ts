export const SUPPORTED_DOCUMENT_TYPES = ['image', 'pdf'] as const;
export type SupportedDocumentType = (typeof SUPPORTED_DOCUMENT_TYPES)[number];

export function inferDocumentType(mimeType: string | undefined): SupportedDocumentType {
  if (!mimeType) {
    return 'image';
  }
  return mimeType.toLowerCase().includes('pdf') ? 'pdf' : 'image';
}
