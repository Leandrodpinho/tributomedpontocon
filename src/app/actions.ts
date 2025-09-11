"use server";

import { z } from "zod";
import { generateTaxScenarios, type GenerateTaxScenariosOutput } from "@/ai/flows/generate-tax-scenarios";

export interface AnalysisState {
  aiResponse: GenerateTaxScenariosOutput | null;
  transcribedText: string | null;
  error: string | null;
}

// ⚠️ No ambiente de servidor, não existe `File` do navegador.
// Por isso troquei a validação para garantir que os attachments venham como objetos válidos.
const fileSchema = z.any();

const formSchema = z.object({
  clientType: z.enum([
    "Novo aberturas de empresa",
    "Transferências de contabilidade",
  ]),
  clientData: z.string().optional(),
  payrollExpenses: z.string().optional(),
  issRate: z.string().optional(),
  attachments: z.array(fileSchema).optional(),
});

// Converte arquivos em Base64 (data URI)
async function fileToDataURI(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function getAnalysis(
  prevState: AnalysisState,
  formData: FormData
): Promise<AnalysisState> {
  try {
    const attachments = formData
      .getAll("attachments")
      .filter(f => f instanceof File && f.size > 0) as File[];

    const clientData = formData.get("clientData") as string | null;
    const payrollExpenses = formData.get("payrollExpenses") as string | null;
    const issRate = formData.get("issRate") as string | null;
    const clientType = formData.get("clientType");

    const hasClientData = clientData && clientData.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if (!hasClientData && !hasAttachments) {
      return {
        aiResponse: null,
        transcribedText: null,
        error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
      };
    }

    const validatedFields = formSchema.safeParse({
      clientType: clientType,
      clientData: clientData,
      payrollExpenses: payrollExpenses,
      issRate: issRate,
      attachments: hasAttachments ? attachments : [],
    });

    if (!validatedFields.success) {
      const errorMessage =
        validatedFields.error.flatten().fieldErrors.attachments?.[0] ||
        "Erro de validação nos campos.";
      return {
        aiResponse: null,
        transcribedText: null,
        error: errorMessage,
      };
    }

    const {
      clientType: validClientType,
      clientData: validClientData,
      payrollExpenses: validPayrollExpenses,
      issRate: validIssRate,
      attachments: validAttachments,
    } = validatedFields.data;

    let attachedDocuments: string[] | null = null;
    if (validAttachments && validAttachments.length > 0) {
      attachedDocuments = await Promise.all(
        (validAttachments as File[]).map(fileToDataURI)
      );
    }

    const aiResponse = await generateTaxScenarios({
      clientType: validClientType,
      clientData: validClientData ?? "",
      payrollExpenses: validPayrollExpenses ?? "",
      issRate: validIssRate ?? "",
      attachedDocuments,
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
