'use server';

/**
 * @fileOverview Extracts text content from documents (imagens ou PDFs).
 *
 * - extractTextFromDocument - A function that extracts textual data.
 * - ExtractTextFromDocumentInput - The input type for the function.
 * - ExtractTextFromDocumentOutput - The return type for the function.
 */

import { z } from 'zod';
import { SUPPORTED_DOCUMENT_TYPES } from './document-utils';
import { extractTextFromPdfBuffer } from './local-extractor';

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
  // Extract base64 data from data URI
  // Format: data:application/pdf;base64,.....
  const matches = input.document.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error("Invalid data URI format");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  let rawText = "";

  try {
    if (mimeType === 'application/pdf') {
      // Use our robust local extractor for PDFs
      rawText = await extractTextFromPdfBuffer(buffer);
    } else {
      // It's an image (png, jpeg, etc)
      // We can use the same ocrPdf function logic basically, or just tesseract CLI on the image buffer directly?
      // Since ocrPdf expects PDF buffer, let's reuse it? No, pdf2pic handles PDF.
      // For images, we can write to tmp file and run tesseract.
      // Or we can modify local-extractor to export an imageOCR function.
      // For now, let's assume the user mostly sends PDFs or we treat image upload in a similar way.
      // If input is image, we can just save it and run tesseract.
      // Let's import 'ocrPdf' but wait, ocrPdf is specific to PDF conversion.
      // Let's quickly add a generic image OCR support to local-extractor or here?
      // Given the complexity, let's stick to PDF optimization which was the main goal.
      // If image, we fallback to a simple tesseract execution.

      const { execFile } = require('node:child_process');
      const { promisify } = require('node:util');
      const fs = require('node:fs/promises');
      const os = require('node:os');
      const path = require('node:path');
      const execFileAsync = promisify(execFile);

      const uniqueId = Math.random().toString(36).substring(7);
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "img-ocr-" + uniqueId + "-"));
      const ext = mimeType.split('/')[1] || 'png';
      const tmpPath = path.join(tmpDir, `valid.${ext}`);

      await fs.writeFile(tmpPath, buffer);

      try {
        // Tesseract supports images natively
        const { stdout } = await execFileAsync("tesseract", [tmpPath, "stdout", "-l", "por"]);
        rawText = stdout;
      } catch (e) {
        console.error("Tesseract on image failed", e);
        rawText = "";
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    }
  } catch (e) {
    console.error("Local extraction failed:", e);
    rawText = "";
  }

  // Pós-processamento robusto (Regex) para limpar erros comuns de OCR
  const cleanedText = cleanOcrOutput(rawText || '');

  return { extractedText: cleanedText };
}

/**
 * Aplica correções regex específicas para textos financeiros/contábeis.
 */
function cleanOcrOutput(text: string): string {
  let cleaned = text;

  // 1. Corrige 'O' ou 'o' em lugar de '0' dentro de sequências numéricas (ex: 1O.00 -> 10.00)
  // Regex: Procura por dígitos, seguidos de O/o, seguidos de mais dígitos ou pontuação, isolados
  cleaned = cleaned.replace(/(\d)[Oo]([\d.,])/g, '$10$2');
  cleaned = cleaned.replace(/([.,])[Oo](\d)/g, '$10$2'); // ex: .O5 -> .05

  // 2. Corrige 'I' ou 'l' (L minúsculo) em lugar de '1'
  cleaned = cleaned.replace(/(\d)[Il]([\d.,])/g, '$11$2');
  cleaned = cleaned.replace(/R\$\s*[Il]/g, 'R$ 1'); // R$ l00 -> R$ 100

  // 3. Normaliza espaços em valores monetários (R$ 100 -> R$100 ou R$ 100 uniformizado)
  // Mas aqui o objetivo é só corrigir o OCR. Deixa formatação visual pra lá.

  // 4. Se houver "O,OO" isolado, vira "0,00"
  cleaned = cleaned.replace(/\bO,OO\b/g, '0,00');

  // 5. Tenta corrigir CNPJ mal formatado (ex: O0.000...)
  // Padrao CNPJ: \d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}
  // Se achar algo parecido com chars errados:

  // 6. Remover 'Scanned with CamScanner' ou similar se aparecer muito (opcional)

  return cleaned;
}
