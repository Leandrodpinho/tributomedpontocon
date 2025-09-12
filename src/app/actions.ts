
"use server";

import { generateTaxScenarios, type GenerateTaxScenariosOutput } from "@/ai/flows/generate-tax-scenarios";
import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
import htmlToDocx from 'html-to-docx';

export interface AnalysisState {
  aiResponse: GenerateTaxScenariosOutput | null;
  transcribedText: string | null;
  error: string | null;
}

// Helper function to convert a File to a data URI
const fileToDataURI = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
};

export async function getAnalysis(
  prevState: AnalysisState,
  formData: FormData,
): Promise<AnalysisState> {
  const clientData = formData.get("clientData") as string | null;
  const attachmentFiles = formData.getAll("attachments") as File[];
  const payrollExpenses = formData.get("payrollExpenses") as string | null;
  const issRate = formData.get("issRate") as string | null;
  const clientType = formData.get("clientType") as "Novo aberturas de empresa" | "Transferências de contabilidade";
  const companyName = formData.get("companyName") as string | null;
  const cnpj = formData.get("cnpj") as string | null;

  const payrollExpensesNum = payrollExpenses ? parseFloat(payrollExpenses) : undefined;
  const issRateNum = issRate ? parseFloat(issRate) : undefined;


  try {
    // 1. Validate input: ensure at least some data is present
    const validFiles = attachmentFiles.filter((file) => file && file.size > 0);
    const hasClientData = clientData && clientData.trim().length > 0;
    const hasAttachments = validFiles.length > 0;

    if (!hasClientData && !hasAttachments) {
      return {
        aiResponse: null,
        transcribedText: null,
        error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
      };
    }
    
    // 2. Process attachments by extracting text from each one
    let allDocumentsText = "";
    if (hasAttachments) {
      const textExtractionPromises = validFiles.map(async (file) => {
        try {
          const dataUri = await fileToDataURI(file);
          const result = await extractTextFromImage({ document: dataUri });
          return result.extractedText;
        } catch (e) {
          console.error(`Failed to extract text from file: ${file.name}`, e);
          return `[Erro ao processar o arquivo: ${file.name}]`;
        }
      });

      const extractedTexts = await Promise.all(textExtractionPromises);
      allDocumentsText = extractedTexts.join("\n\n---\n\n");
    }

    // 3. Call the main AI flow with all data consolidated
    const aiResponse = await generateTaxScenarios({
      clientType: clientType,
      companyName: companyName ?? "",
      cnpj: cnpj ?? "",
      clientData: clientData ?? "",
      payrollExpenses: payrollExpensesNum, // Usar o número convertido
      issRate: issRateNum, // Usar o número convertido
      documentsAsText: allDocumentsText,
    });
    
    // 4. Guarantees that the return is pure, serializable JSON
    const serializableResponse: GenerateTaxScenariosOutput = JSON.parse(
      JSON.stringify(aiResponse)
    );

    return {
      aiResponse: serializableResponse,
      transcribedText: serializableResponse?.transcribedText ?? allDocumentsText,
      error: null,
    };

  } catch (error) {
    console.error("Detailed error in Server Action:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro desconhecido no servidor.";
    
    // 5. Ensure the error return path is also a simple, serializable object
    return {
      aiResponse: null,
      transcribedText: null,
      error: `Falha ao processar a análise: ${errorMessage}`,
    };
  }
}

export async function generateDocx(htmlContent: string): Promise<{ docx: string | null, error: string | null }> {
  try {
    const fileBuffer = await htmlToDocx(htmlContent, undefined, {
      font: 'Arial',
      fontSize: 12,
    });
    
    // Converter ArrayBuffer para Buffer antes de chamar toString('base64')
    const buffer = Buffer.from(fileBuffer as ArrayBuffer); // Cast para ArrayBuffer
    return { docx: buffer.toString('base64'), error: null };
  } catch (error) {
    console.error("Error generating DOCX:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return { docx: null, error: `Falha ao gerar o arquivo DOCX: ${errorMessage}` };
  }
}
