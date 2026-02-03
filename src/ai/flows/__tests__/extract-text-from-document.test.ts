
import {
  extractTextFromDocument,
  ExtractTextFromDocumentInput,
} from '../extract-text-from-document';

// Mock internal dependencies
jest.mock('../local-extractor', () => ({
  extractTextFromPdfBuffer: jest.fn().mockResolvedValue('Texto extraído do PDF localmente'),
}));

jest.mock('node:fs/promises', () => ({
  mkdtemp: jest.fn().mockResolvedValue('/tmp/mock-ocr'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  rm: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('node:child_process', () => ({
  execFile: jest.fn((cmd, args, cb) => {
    cb(null, { stdout: 'Texto extraído via OCR Tesseract' }, '');
  }),
}));

describe('extractTextFromDocument', () => {
  it('deve extrair texto de um documento PDF usando extrator local', async () => {
    const mockInput: ExtractTextFromDocumentInput = {
      document: 'data:application/pdf;base64,JVBERi0xLjMK...',
      documentType: 'pdf',
    };

    const result = await extractTextFromDocument(mockInput);

    expect(result.extractedText).toContain('Texto extraído do PDF localmente');
  });

  it('deve extrair texto de uma imagem usando Tesseract', async () => {
    const mockInput: ExtractTextFromDocumentInput = {
      document: 'data:image/png;base64,iVBORw0KGgo...',
      documentType: 'image',
    };

    const result = await extractTextFromDocument(mockInput);

    // The implementation cleans the text. 'Texto extraído via OCR Tesseract' -> 'Texto extraído via OCR Tesseract'
    expect(result.extractedText).toContain('Texto extraído via OCR Tesseract');
  });
});
