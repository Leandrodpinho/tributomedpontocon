import {
  extractTextFromDocument,
  ExtractTextFromDocumentInput,
  ExtractTextFromDocumentOutput,
} from '../extract-text-from-document';
import { ai } from '@/ai/genkit';

// Mock do Genkit AI
jest.mock('@/ai/genkit', () => {
  const originalGenkit = jest.requireActual('genkit');
  return {
    ai: {
      ...originalGenkit.ai,
      definePrompt: jest.fn(() => {
        return jest.fn(async input => {
          return {
            output: {
              extractedText: `Texto extraído simulado de: ${input.document.substring(0, 30)}...`,
            } as ExtractTextFromDocumentOutput,
          };
        });
      }),
      defineFlow: jest.fn((_, handler) => {
        return jest.fn(async input => handler(input));
      }),
    },
  };
});

describe('extractTextFromDocument', () => {
  it('deve extrair texto de um documento Base64', async () => {
    const mockInput: ExtractTextFromDocumentInput = {
      document:
        'data:application/pdf;base64,JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwvTGluZWFyaXplZCAxL0wgNTY1Mi9PIDE0L0UgMzYwMC9OIDIvVCA1MTYzPj4KZW5kb2JqC',
      documentType: 'pdf',
    };

    const expectedOutput: ExtractTextFromDocumentOutput = {
      extractedText: `Texto extraído simulado de: ${mockInput.document.substring(0, 30)}...`,
    };

    const result = await extractTextFromDocument(mockInput);

    expect(result).toEqual(expectedOutput);
    expect(ai.definePrompt).toHaveBeenCalledWith(expect.objectContaining({ name: 'textExtractionPrompt' }));
    expect(ai.defineFlow).toHaveBeenCalledWith(expect.objectContaining({ name: 'extractTextFromDocumentFlow' }), expect.any(Function));
  });

  it('deve lidar com um documento vazio ou inválido', async () => {
    const mockInput: ExtractTextFromDocumentInput = {
      document: 'data:image/png;base64,', // Base64 vazio
      documentType: 'image',
    };

    const expectedOutput: ExtractTextFromDocumentOutput = {
      extractedText: `Texto extraído simulado de: ${mockInput.document.substring(0, 30)}...`,
    };

    const result = await extractTextFromDocument(mockInput);

    expect(result).toEqual(expectedOutput);
  });
});
