"use server";

import { z } from "zod";
import { generateTaxScenarios, type GenerateTaxScenariosOutput } from "@/ai/flows/generate-tax-scenarios";

export interface AnalysisState {
  aiResponse?: GenerateTaxScenariosOutput;
  transcribedText?: string;
  error?: string;
}

const fileSchema = z.instanceof(File).refine(file => file.size > 0, { message: "O arquivo não pode estar vazio." });

const formSchema = z.object({
  clientType: z.enum([
    "Novo aberturas de empresa",
    "Transferências de contabilidade",
  ]),
  clientData: z.string().optional(),
  payrollExpenses: z.string().optional(),
  attachments: z.array(fileSchema).optional(),
});


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
  const clientData = formData.get("clientData") as string;
  const payrollExpenses = formData.get("payrollExpenses") as string;
  const clientType = formData.get("clientType");


  const hasClientData = clientData && clientData.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;

  if (!hasClientData && !hasAttachments) {
    return {
       error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise."
    };
  }
  
  const validatedFields = formSchema.safeParse({
    clientType: clientType,
    clientData: clientData,
    payrollExpenses: payrollExpenses,
    attachments: hasAttachments ? attachments : undefined,
  });
  
  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.attachments?.[0] || 'Erro de validação nos campos.';
    return {
      error: errorMessage,
    };
  }

  const { 
    clientType: validClientType, 
    clientData: validClientData, 
    payrollExpenses: validPayrollExpenses,
    attachments: validAttachments 
  } = validatedFields.data;

  try {
    let attachedDocuments: string[] | undefined = undefined;
    if (validAttachments && validAttachments.length > 0) {
       attachedDocuments = await Promise.all(validAttachments.map(fileToDataURI));
    }

    const aiResponse = await generateTaxScenarios({ 
      clientType: validClientType, 
      clientData: validClientData, 
      payrollExpenses: validPayrollExpenses,
      attachedDocuments 
    });

    return {
      aiResponse,
      transcribedText: aiResponse.transcribedText,
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return {
      error: `Falha ao processar a análise: ${errorMessage}`,
    };
  }
}
