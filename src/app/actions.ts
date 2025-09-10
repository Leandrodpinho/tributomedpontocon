"use server";

import { z } from "zod";
import { generateTaxScenarios, type GenerateTaxScenariosOutput } from "@/ai/flows/generate-tax-scenarios";

export interface AnalysisState {
  aiResponse?: GenerateTaxScenariosOutput;
  webhookResponse?: unknown;
  error?: string;
  isLoading?: boolean;
}

const formSchema = z.object({
  clientType: z.enum([
    "Novo aberturas de empresa",
    "Transferências de contabilidade",
  ]),
  clientData: z
    .string()
    .optional(),
  attachment: z
    .instanceof(File)
    .optional(),
}).refine(
  (data) => {
    const hasClientData = data.clientData && data.clientData.trim().length >= 10;
    const hasAttachment = data.attachment && data.attachment.size > 0;
    return hasClientData || hasAttachment;
  },
  {
    message: "Por favor, forneça as informações financeiras ou anexe um documento para análise.",
    path: ["clientData"], // Where to show the error
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
  const validatedFields = formSchema.safeParse({
    clientType: formData.get("clientType"),
    clientData: formData.get("clientData"),
    attachment: formData.get("attachment"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.clientData?.[0] || 'Erro de validação.',
      isLoading: false,
    };
  }

  const { clientType, clientData, attachment } = validatedFields.data;

  try {
    let attachedDocuments: string | undefined = undefined;
    if (attachment && attachment.size > 0) {
      attachedDocuments = await fileToDataURI(attachment);
    }
    
    // Concurrently call AI and webhook
    const [aiResponse, webhookResponse] = await Promise.all([
      generateTaxScenarios({ clientType, clientData, attachedDocuments }),
      fetch("http://localhost:5678/webhook-test/Tributo%20Med.con", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientType, clientData }),
      }),
    ]);
    
    let webhookData: unknown;
    if (webhookResponse.ok) {
      webhookData = await webhookResponse.json();
    } else {
      webhookData = {
        error: `Webhook failed with status ${webhookResponse.status}`,
        details: await webhookResponse.text(),
      }
    }

    return {
      aiResponse,
      webhookResponse: webhookData,
      isLoading: false,
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return {
      error: `Falha ao processar a análise: ${errorMessage}`,
      isLoading: false,
    };
  }
}
