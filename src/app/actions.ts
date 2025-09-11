"use server";

import { generateTaxScenarios, type GenerateTaxScenariosOutput } from "@/ai/flows/generate-tax-scenarios";

export interface AnalysisState {
  aiResponse: GenerateTaxScenariosOutput | null;
  transcribedText: string | null;
  error: string | null;
}

const fileToDataURI = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
};

export async function getAnalysis(
  prevState: AnalysisState,
  formData: FormData,
): Promise<AnalysisState> {
  try {
    const clientData = formData.get("clientData") as string | null;
    const attachmentFiles = formData.getAll("attachments") as File[];
    
    // Server-side conversion of files to data URIs
    const attachments = await Promise.all(
        attachmentFiles
          .filter((file) => file.size > 0)
          .map((file) => fileToDataURI(file))
      );

    const hasClientData = clientData && clientData.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if (!hasClientData && !hasAttachments) {
      return {
        aiResponse: null,
        transcribedText: null,
        error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
      };
    }

    const aiResponse = await generateTaxScenarios({
      clientType: (formData.get("clientType") as "Novo aberturas de empresa" | "Transferências de contabilidade"),
      clientData: clientData ?? "",
      payrollExpenses: (formData.get("payrollExpenses") as string) ?? "",
      issRate: (formData.get("issRate") as string) ?? "",
      attachedDocuments: attachments,
    });
    
    // Guarantees that the return is pure, serializable JSON
    const serializableResponse: GenerateTaxScenariosOutput = JSON.parse(
      JSON.stringify(aiResponse)
    );

    return {
      aiResponse: serializableResponse,
      transcribedText: serializableResponse?.transcribedText ?? null,
      error: null,
    };
  } catch (error) {
    console.error("Detailed error in Server Action:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro desconhecido no servidor.";
    return {
      aiResponse: null,
      transcribedText: null,
      error: `Falha ao processar a análise: ${errorMessage}`,
    };
  }
}
