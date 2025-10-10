'use server';

/**
 * @fileOverview Extracts text content from documents (imagens ou PDFs).
 *
 * - extractTextFromDocument - A function that extracts textual data.
 * - ExtractTextFromDocumentInput - The input type for the function.
 * - ExtractTextFromDocumentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {SUPPORTED_DOCUMENT_TYPES} from './document-utils';

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
  input: {schema: ExtractTextFromDocumentInputSchema},
  output: {schema: ExtractTextFromDocumentOutputSchema},
  prompt: `Você recebe um documento em formato {{#if documentType}}{{documentType}}{{else}}desconhecido{{/if}} codificado em base64.

Quando o documento for uma imagem, transcreva o conteúdo mantendo números e colunas sempre que possível.
Quando o documento for um PDF, leia todas as páginas e devolva os dados em texto corrido, listando tabelas linha a linha.

Retorne apenas o texto extraído, sem comentários adicionais.

Documento: {{media url=document}}`,
});

const extractTextFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractTextFromDocumentFlow',
    inputSchema: ExtractTextFromDocumentInputSchema,
    outputSchema: ExtractTextFromDocumentOutputSchema,
  },
  async input => {
    const {output} = await textExtractionPrompt(input);
    return output!;
  }
);
