"use server";

import { z } from "zod";
import { generateTaxScenarios, type GenerateTaxScenariosOutput } from "@/ai/flows/generate-tax-scenarios";

export interface AnalysisState {
  aiResponse?: GenerateTaxScenariosOutput;
  transcribedText?: string;
  webhookResponse?: string;
  error?: string;
}

const fileSchema = z.instanceof(File).refine(file => file.size > 0, { message: "O arquivo não pode estar vazio." });

const formSchema = z.object({
  clientType: z.enum([
    "Novo aberturas de empresa",
    "Transferências de contabilidade",
  ]),
  clientData: z
    .string()
    .optional(),
  attachments: z
    .array(fileSchema)
    .min(1, "Por favor, anexe pelo menos um arquivo.")
    .optional(),
}).refine(
  (data) => {
    const hasClientData = data.clientData && data.clientData.trim().length > 0;
    const hasAttachments = data.attachments && data.attachments.length > 0;
    return hasClientData || hasAttachments;
  },
  {
    message: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
    path: ["clientData"],
  }
);


async function fileToDataURI(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function getAnalysis(
  prevState: AnalysisState,
  formData: FormData
): Promise<AnalysisState> {
  const attachments = formData.getAll("attachments").filter(f => f instanceof File && f.size > 0) as File[];

  const validatedFields = formSchema.safeParse({
    clientType: formData.get("clientType"),
    clientData: formData.get("clientData"),
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessage = fieldErrors.clientData?.[0] || fieldErrors.attachments?.[0] || 'Erro de validação.';
    return {
      error: errorMessage,
    };
  }

  const { clientType, clientData, attachments: validAttachments } = validatedFields.data;

  try {
    let attachedDocuments: string[] | undefined = undefined;
    if (validAttachments && validAttachments.length > 0) {
       attachedDocuments = await Promise.all(validAttachments.map(fileToDataURI));
    }

    const aiResponse = await generateTaxScenarios({ clientType, clientData, attachedDocuments });

    return {
      aiResponse,
      transcribedText: aiResponse.transcribedText,
      webhookResponse: "A chamada ao webhook foi removida temporariamente.",
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return {
      error: `Falha ao processar a análise: ${errorMessage}`,
    };
  }
}
