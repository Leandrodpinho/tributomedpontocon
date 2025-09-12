import { extractTextFromImage, ExtractTextFromImageInput, ExtractTextFromImageOutput } from '../extract-text-from-image';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock do Genkit AI
jest.mock('@/ai/genkit', () => {
  const originalGenkit = jest.requireActual('genkit');
  return {
    ai: {
      ...originalGenkit.ai, // Mantém outras propriedades de 'ai' se existirem
      definePrompt: jest.fn((config) => {
        return jest.fn(async (input) => {
          // Simula a saída do prompt
          return {
            output: {
              extractedText: `Texto extraído simulado de: ${input.document.substring(0, 30)}...`,
            } as ExtractTextFromImageOutput,
          };
        });
      }),
      defineFlow: jest.fn((config, handler) => {
        // Retorna uma função que simula o fluxo
        return jest.fn(async (input) => {
          return handler(input);
        });
      }),
    },
  };
});

// Mock do Genkit AI
jest.mock('@/ai/genkit', () => {
  const originalGenkit = jest.requireActual('genkit');
  return {
    ai: {
      ...originalGenkit.ai, // Mantém outras propriedades de 'ai' se existirem
      definePrompt: jest.fn((config) => {
        return jest.fn(async (input) => {
          // Simula a saída do prompt
          return {
            output: {
              extractedText: `Texto extraído simulado de: ${input.document.substring(0, 30)}...`,
            } as ExtractTextFromImageOutput,
          };
        });
      }),
      defineFlow: jest.fn((config, handler) => {
        // Retorna uma função que simula o fluxo
        return jest.fn(async (input) => {
          return handler(input);
        });
      }),
    },
  };
});

describe('extractTextFromImage', () => {
  it('deve extrair texto de um documento Base64', async () => {
    const mockInput: ExtractTextFromImageInput = {
      document: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Um pixel PNG transparente
    };

    const expectedOutput: ExtractTextFromImageOutput = {
      extractedText: `Texto extraído simulado de: ${mockInput.document.substring(0, 30)}...`,
    };

    const result = await extractTextFromImage(mockInput);

    expect(result).toEqual(expectedOutput);
    expect(ai.definePrompt).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'textExtractionPrompt' })
    );
    expect(ai.defineFlow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'extractTextFromImageFlow' }),
      expect.any(Function)
    );
  });

  it('deve lidar com um documento vazio ou inválido', async () => {
    const mockInput: ExtractTextFromImageInput = {
      document: 'data:image/png;base64,', // Base64 vazio
    };

    const expectedOutput: ExtractTextFromImageOutput = {
      extractedText: `Texto extraído simulado de: ${mockInput.document.substring(0, 30)}...`,
    };

    const result = await extractTextFromImage(mockInput);

    expect(result).toEqual(expectedOutput);
  });
});