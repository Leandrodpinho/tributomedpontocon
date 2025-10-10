
"use server";

import { generateTaxScenarios } from "@/ai/flows/generate-tax-scenarios";
import { calculateIRPFImpact } from "@/ai/flows/calculate-irpf-impact";
import type { CalculateIRPFImpactInput } from "@/ai/flows/calculate-irpf-impact";
import type { GenerateTaxScenariosOutput } from "@/ai/flows/types";
import { extractTextFromDocument, inferDocumentType } from "@/ai/flows/extract-text-from-document";
import htmlToDocx from 'html-to-docx';
import type { IrpfImpact } from "@/types/irpf";

export interface AnalysisState {
  aiResponse: GenerateTaxScenariosOutput | null;
  transcribedText: string | null;
  irpfImpacts: Record<string, IrpfImpact> | null;
  webhookResponse: string | null;
  error: string | null;
}

type SupportedTaxRegime = CalculateIRPFImpactInput["taxRegime"];

const mapScenarioNameToTaxRegime = (name: string): SupportedTaxRegime | null => {
  const normalized = name.toLowerCase();
  if (normalized.includes("lucro real")) {
    return "Lucro Real";
  }
  if (normalized.includes("lucro presumido")) {
    return "Lucro Presumido";
  }
  if (normalized.includes("anexo iii")) {
    return "Simples Nacional Anexo III";
  }
  if (normalized.includes("anexo v")) {
    return "Simples Nacional Anexo V";
  }
  return null;
};

const WEBHOOK_URL = "https://n8n.mavenlabs.com.br/webhook-test/chatadv";

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
  const rbt12 = formData.get("rbt12") as string | null;
  const fs12 = formData.get("fs12") as string | null;
  const rawCnaes = formData.get("cnaes") as string | null;
  const isHospitalEquivalent = formData.get("isHospitalEquivalent") === "on";
  const isUniprofessionalSociety = formData.get("isUniprofessionalSociety") === "on";
  const clientType = formData.get("clientType") as "Novo aberturas de empresa" | "Transferências de contabilidade";
  const companyName = formData.get("companyName") as string | null;
  const cnpj = formData.get("cnpj") as string | null;
  const monthlyRevenue = formData.get("monthlyRevenue") as string | null;
  const negotiationTranscript = formData.get("negotiationTranscript") as string | null;

  const parseDecimal = (value: string | null) => {
    if (!value) return undefined;
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const monthlyRevenueNum = parseDecimal(monthlyRevenue);
  const payrollExpensesNum = parseDecimal(payrollExpenses);
  const issRateNum = parseDecimal(issRate);
  const rbt12Num = parseDecimal(rbt12) ?? (monthlyRevenueNum !== undefined ? monthlyRevenueNum * 12 : undefined);
  const fs12Num = parseDecimal(fs12);
  const parsedCnaes = rawCnaes
    ? rawCnaes
        .split(",")
        .map(code => code.trim())
        .filter(code => code.length > 0)
    : undefined;


  try {
    // 1. Validate input: ensure at least some data is present
    const validFiles = attachmentFiles.filter((file) => file && file.size > 0);
    const hasClientData =
      (clientData && clientData.trim().length > 0) ||
      (negotiationTranscript && negotiationTranscript.trim().length > 0);
    const hasAttachments = validFiles.length > 0;
    const hasMonthlyRevenue = typeof monthlyRevenueNum === "number" && monthlyRevenueNum > 0;

    if (!hasMonthlyRevenue) {
      return {
        aiResponse: null,
        transcribedText: null,
        irpfImpacts: null,
        webhookResponse: null,
        error: "Informe o faturamento mensal estimado para que possamos gerar os cenários tributários.",
      };
    }

    if (!hasClientData && !hasAttachments) {
      return {
        aiResponse: null,
        transcribedText: null,
        irpfImpacts: null,
        webhookResponse: null,
        error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
      };
    }
    
    // 2. Process attachments by extracting text from each one
    let allDocumentsText = "";
    if (hasAttachments) {
      const textExtractionPromises = validFiles.map(async (file) => {
        try {
          const dataUri = await fileToDataURI(file);
          const result = await extractTextFromDocument({
            document: dataUri,
            documentType: inferDocumentType(file.type),
          });
          return result.extractedText;
        } catch (e) {
          console.error(`Failed to extract text from file: ${file.name}`, e);
          return `[Erro ao processar o arquivo: ${file.name}]`;
        }
      });

      const extractedTexts = await Promise.all(textExtractionPromises);
      allDocumentsText = extractedTexts.join("\n\n---\n\n");
    }

    const normalizedClientDataParts: string[] = [];
    if (clientData && clientData.trim().length > 0) {
      normalizedClientDataParts.push(clientData.trim());
    }
    if (negotiationTranscript && negotiationTranscript.trim().length > 0) {
      normalizedClientDataParts.push(`Transcrição da negociação:\n${negotiationTranscript.trim()}`);
    }
    const normalizedClientData = normalizedClientDataParts.join("\n\n");

    const webhookPayload = {
      clientType,
      companyName,
      cnpj,
      monthlyRevenue: monthlyRevenueNum,
      rbt12: rbt12Num,
      fs12: fs12Num,
      payrollExpenses: payrollExpensesNum,
      issRate: issRateNum,
      cnaes: parsedCnaes,
      isHospitalEquivalent,
      isUniprofessionalSociety,
      clientData: clientData ?? "",
      negotiationTranscript: negotiationTranscript ?? "",
      documentsAsText: allDocumentsText,
      sentAt: new Date().toISOString(),
    };

    const webhookPromise: Promise<string | null> = (async () => {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type") ?? "";
        if (!response.ok) {
          return `Falha ao enviar dados ao webhook (${response.status} ${response.statusText}).`;
        }

        if (contentType.includes("application/json")) {
          const json = await response.json();
          return JSON.stringify(json, null, 2);
        }

        return await response.text();
      } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
        return error instanceof Error
          ? `Erro ao conectar ao webhook: ${error.message}`
          : "Erro desconhecido ao conectar ao webhook.";
      }
    })();

    // 3. Call the main AI flow with all data consolidated
    const aiResponse = await generateTaxScenarios({
      clientType: clientType,
      companyName: companyName ?? "",
      cnpj: cnpj ?? "",
      clientData: normalizedClientData,
      payrollExpenses: payrollExpensesNum, // Usar o número convertido
      issRate: issRateNum, // Usar o número convertido
      rbt12: rbt12Num,
      fs12: fs12Num,
      monthlyRevenue: monthlyRevenueNum,
      cnaes: parsedCnaes,
      isHospitalEquivalent,
      isUniprofessionalSociety,
      documentsAsText: allDocumentsText,
    });
    
    // 4. Guarantees that the return is pure, serializable JSON
    const serializableResponse: GenerateTaxScenariosOutput = JSON.parse(
      JSON.stringify(aiResponse)
    );

    let irpfImpacts: Record<string, IrpfImpact> | null = null;
    try {
      if (serializableResponse?.scenarios?.length) {
        const impactEntries = await Promise.all(
          serializableResponse.scenarios.map(async scenario => {
            const taxRegime = mapScenarioNameToTaxRegime(scenario.name);
            if (!taxRegime || !scenario.proLaboreAnalysis) {
              return null;
            }

            try {
              const impact = await calculateIRPFImpact({
                taxRegime,
                proLabore: scenario.proLaboreAnalysis.baseValue,
                profitDistribution: scenario.netProfitDistribution ?? 0,
                inssContribution: scenario.proLaboreAnalysis.inssValue ?? 0,
                clientRevenue: scenario.scenarioRevenue ?? monthlyRevenueNum ?? 0,
                payrollExpenses: payrollExpensesNum ?? 0,
              });
              return [scenario.name, impact as IrpfImpact] as const;
            } catch (impactError) {
              console.error(`Falha ao calcular IRPF para o cenário "${scenario.name}":`, impactError);
              return null;
            }
          })
        );

        const filteredEntries = impactEntries.filter(
          (entry): entry is [string, IrpfImpact] => Array.isArray(entry)
        );

        if (filteredEntries.length > 0) {
          irpfImpacts = Object.fromEntries(filteredEntries);
        }
      }
    } catch (impactError) {
      console.error("Erro geral ao calcular impactos de IRPF:", impactError);
    }

    const webhookResponse = await webhookPromise;

    return {
      aiResponse: serializableResponse,
      transcribedText: serializableResponse?.transcribedText ?? allDocumentsText,
      irpfImpacts,
      webhookResponse,
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
      irpfImpacts: null,
      webhookResponse: null,
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

    if (!(fileBuffer instanceof ArrayBuffer)) {
      throw new Error("A saída do gerador DOCX não é um ArrayBuffer válido.");
    }
    
    const buffer = Buffer.from(fileBuffer);
    return { docx: buffer.toString('base64'), error: null };
  } catch (error) {
    console.error("Error generating DOCX:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return { docx: null, error: `Falha ao gerar o arquivo DOCX: ${errorMessage}` };
  }
}
