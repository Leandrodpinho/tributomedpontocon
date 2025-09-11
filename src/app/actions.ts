"use server";

import { z } from "zod";
import { generateTaxScenarios, type GenerateTaxScenariosOutput } from "@/ai/flows/generate-tax-scenarios";

export interface AnalysisState {
  aiResponse: GenerateTaxScenariosOutput | null;
  transcribedText: string | null;
  error: string | null;
}

const formSchema = z.object({
  clientType: z.enum([
    "Novo aberturas de empresa",
    "Transferências de contabilidade",
  ]),
  clientData: z.string().optional(),
  payrollExpenses: z.string().optional(),
  issRate: z.string().optional(),
  attachments: z.array(z.string()).optional(), // Agora esperamos um array de strings (data URIs)
});

export type FormPayload = z.infer<typeof formSchema>;

export async function getAnalysis(
  prevState: AnalysisState,
  payload: FormPayload,
): Promise<AnalysisState> {
  try {
    const hasClientData = payload.clientData && payload.clientData.trim().length > 0;
    const hasAttachments = payload.attachments && payload.attachments.length > 0;

    if (!hasClientData && !hasAttachments) {
      return {
        aiResponse: null,
        transcribedText: null,
        error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
      };
    }

    const validatedFields = formSchema.safeParse(payload);

    if (!validatedFields.success) {
      return {
        aiResponse: null,
        transcribedText: null,
        error: "Erro de validação nos dados enviados.",
      };
    }

    const {
      clientType,
      clientData,
      payrollExpenses,
      issRate,
      attachments,
    } = validatedFields.data;

    const aiResponse = await generateTaxScenarios({
      clientType: clientType,
      clientData: clientData ?? "",
      payrollExpenses: payrollExpenses ?? "",
      issRate: issRate ?? "",
      attachedDocuments: attachments,
    });

    // 🔒 Garante que o retorno seja JSON puro e serializável
    const serializableResponse: GenerateTaxScenariosOutput = JSON.parse(
      JSON.stringify(aiResponse)
    );

    return {
      aiResponse: serializableResponse,
      transcribedText: serializableResponse?.transcribedText ?? null,
      error: null,
    };
  } catch (error) {
    console.error("Erro detalhado na Server Action:", error);
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