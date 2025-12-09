'use server';

/**
 * @fileOverview Extracts text content from documents (imagens ou PDFs).
 *
 * - extractTextFromDocument - A function that extracts textual data.
 * - ExtractTextFromDocumentInput - The input type for the function.
 * - ExtractTextFromDocumentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SUPPORTED_DOCUMENT_TYPES } from './document-utils';

const ExtractTextFromDocumentInputSchema = z.object({
  document: z
    .string()
    .describe(
      "Documento codificado como data URI contendo o MIME Type na assinatura. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z
    .enum(SUPPORTED_DOCUMENT_TYPES)
    .optional()
    .describe('Tipo do documento enviado para orientar o prompt (image ou pdf).'),
});
export type ExtractTextFromDocumentInput = z.infer<typeof ExtractTextFromDocumentInputSchema>;

const ExtractTextFromDocumentOutputSchema = z.object({
  extractedText: z.string().describe('Conteúdo textual extraído do documento.'),
});
export type ExtractTextFromDocumentOutput = z.infer<typeof ExtractTextFromDocumentOutputSchema>;

export async function extractTextFromDocument(
  input: ExtractTextFromDocumentInput
): Promise<ExtractTextFromDocumentOutput> {
  return extractTextFromDocumentFlow(input);
}

const textExtractionPrompt = ai.definePrompt({
  name: 'textExtractionPrompt',
  input: { schema: ExtractTextFromDocumentInputSchema },
  output: { schema: ExtractTextFromDocumentOutputSchema },
  prompt: `Você recebe um documento em formato {{#if documentType}}{{documentType}}{{else}}desconhecido{{/if}} Documento: {{media url=document}}

**Contexto:** Você é um especialista em OCR contábil. O documento fornecido contém informações fiscais (DAS, Extratos do Simples, Declarações de IR ou Planilhas Financeiras).

**Instruções:**
1. **Identificação:** Identifique e transcreva com PROPRIEDADE MÁXIMA data fields como: CNPJ, Razão Social, Período de Apuração (Competência) e Valor da Receita Bruta.
2. **Tabelas:** Se for uma tabela (ex: PGDAS), mantenha a estrutura linha a linha.
3. **Números:** Atenção redobrada para diferenciar '0' de 'O', e '1' de 'I'. Formate números decimais com ponto ou vírgula conforme o original.
4. **Limpeza:** Ignore rodapés irrelevantes ou marcas d'água que não sejam dados financeiros.

Transcreva todo o texto legível abaixo:`,
});

const extractTextFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractTextFromDocumentFlow',
    inputSchema: ExtractTextFromDocumentInputSchema,
    outputSchema: ExtractTextFromDocumentOutputSchema,
  },
  async input => {
    const { output } = await textExtractionPrompt(input);
    return output!;
  }
);
