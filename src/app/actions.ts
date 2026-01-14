
"use server";

import { generateTaxScenarios } from "@/ai/flows/generate-tax-scenarios";
import { calculateIRPFImpact } from "@/ai/flows/calculate-irpf-impact";
import type { CalculateIRPFImpactInput } from "@/ai/flows/calculate-irpf-impact";
import type { GenerateTaxScenariosOutput } from "@/ai/flows/types";
import { extractTextFromDocument } from "@/ai/flows/extract-text-from-document";
import { inferDocumentType } from "@/ai/flows/document-utils";
import htmlToDocx from "html-to-docx";
import type { IrpfImpact } from "@/types/irpf";
import { persistAnalysisRecord } from "@/lib/firebase-admin";
import { generateImpactReport } from "@/lib/reform-impact-calculator";
import type { SavedTaxAnalysis } from "@/types/reform-impact";

export interface AnalysisState {
  aiResponse: GenerateTaxScenariosOutput | null;
  transcribedText: string | null;
  irpfImpacts: Record<string, IrpfImpact> | null;
  webhookResponse: string | null;
  error: string | null;
  historyRecordId: string | null;
  historyError: string | null;
  initialParameters?: {
    monthlyRevenue: number;
    payrollExpenses?: number;
    issRate?: number;
    numberOfPartners?: number;
    realProfitMargin?: number;
    isHospitalEquivalent?: boolean;
    isUniprofessionalSociety?: boolean;
  };
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

const WEBHOOK_URL = ""; // (process.env.WEBHOOK_URL ?? process.env.NEXT_PUBLIC_WEBHOOK_URL ?? "").trim();
const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

type ProcessedAttachment = {
  name: string;
  type: string;
  size: number;
  dataUri: string;
  extractedText: string;
};

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
  const numberOfPartners = formData.get("numberOfPartners") as string | null;
  const realProfitMargin = formData.get("realProfitMargin") as string | null;

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
  const numberOfPartnersNum = numberOfPartners ? parseInt(numberOfPartners, 10) : undefined;
  const realProfitMarginNum = parseDecimal(realProfitMargin);
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
        historyRecordId: null,
        historyError: null,
      };
    }

    if (!hasClientData && !hasAttachments) {
      return {
        aiResponse: null,
        transcribedText: null,
        irpfImpacts: null,
        webhookResponse: null,
        error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
        historyRecordId: null,
        historyError: null,
      };
    }

    if (hasAttachments) {
      const oversizedFile = validFiles.find(file => file.size > MAX_ATTACHMENT_BYTES);
      if (oversizedFile) {
        return {
          aiResponse: null,
          transcribedText: null,
          irpfImpacts: null,
          webhookResponse: null,
          error: `O arquivo "${oversizedFile.name}" ultrapassa o limite de ${(MAX_ATTACHMENT_BYTES / (1024 * 1024)).toFixed(0)} MB. Reduza o tamanho antes de reenviar.`,
          historyRecordId: null,
          historyError: null,
        };
      }

      const unsupportedFile = validFiles.find(file => file.type && !ALLOWED_ATTACHMENT_TYPES.has(file.type));
      if (unsupportedFile) {
        return {
          aiResponse: null,
          transcribedText: null,
          irpfImpacts: null,
          webhookResponse: null,
          error: `O tipo de arquivo "${unsupportedFile.name}" (${unsupportedFile.type || "desconhecido"}) não é suportado. Envie PDF, imagens (JPEG/PNG/HEIC), planilhas XLSX ou CSV.`,
          historyRecordId: null,
          historyError: null,
        };
      }
    }

    // 2. Process attachments by extracting text from each one
    let allDocumentsText = "";
    let processedAttachments: ProcessedAttachment[] = [];
    if (hasAttachments) {
      const attachmentsPromises = validFiles.map(async file => {
        const safeType = file.type || "application/octet-stream";
        try {
          const dataUri = await fileToDataURI(file);
          let extractedText: string;

          try {
            const result = await extractTextFromDocument({
              document: dataUri,
              documentType: inferDocumentType(safeType),
            });
            extractedText = result.extractedText;
          } catch (extractionError) {
            console.error(`Failed to extract text from file: ${file.name}`, extractionError);
            extractedText = `[Erro ao processar o arquivo: ${file.name}]`;
          }

          return {
            name: file.name,
            type: safeType,
            size: file.size,
            dataUri,
            extractedText,
          } satisfies ProcessedAttachment;
        } catch (conversionError) {
          console.error(`Failed to read file: ${file.name}`, conversionError);
          return {
            name: file.name,
            type: safeType,
            size: file.size,
            dataUri: "",
            extractedText: `[Erro ao ler o arquivo: ${file.name}]`,
          } satisfies ProcessedAttachment;
        }
      });

      processedAttachments = await Promise.all(attachmentsPromises);
      allDocumentsText = processedAttachments
        .map(attachment => attachment.extractedText)
        .filter(text => text && text.trim().length > 0)
        .join("\n\n---\n\n");
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
      attachments: processedAttachments.map(attachment => ({
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        ...(attachment.dataUri ? { dataUri: attachment.dataUri } : {}),
      })),
    };

    const webhookPromise: Promise<string | null> = WEBHOOK_URL
      ? (async () => {
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
      })()
      : Promise.resolve(null);

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

    const persistenceResult = await persistAnalysisRecord({
      payload: {
        clientType,
        companyName: companyName ?? null,
        cnpj: cnpj ?? null,
        monthlyRevenue: monthlyRevenueNum ?? null,
        ...(rbt12Num !== undefined && { rbt12: rbt12Num }),
        ...(fs12Num !== undefined && { fs12: fs12Num }),
        ...(payrollExpensesNum !== undefined && { payrollExpenses: payrollExpensesNum }),
        ...(issRateNum !== undefined && { issRate: issRateNum }),
        cnaes: parsedCnaes ?? [],
        isHospitalEquivalent,
        isUniprofessionalSociety,
        clientData: clientData ?? "",
        negotiationTranscript: negotiationTranscript ?? "",
        documentsAsText: allDocumentsText,
        sentAt: new Date().toISOString(),
        webhookUrl: WEBHOOK_URL || null,
      },
      attachments: processedAttachments.map(attachment => ({
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
      })),
      aiResponse: serializableResponse,
      irpfImpacts,
      webhookResponse,
    });

    // ✨ NOVO: Calcular impacto da Reforma Tributária
    try {
      if (serializableResponse?.scenarios && serializableResponse.scenarios.length > 0) {
        const reformImpact = generateImpactReport(
          serializableResponse.scenarios,
          {
            companyName: companyName ?? undefined,
            monthlyRevenue: monthlyRevenueNum!,
            regime: serializableResponse.scenarios[0]?.name,
            sector: 'Saúde', // Inferir do CNAE se possível
            cnaes: parsedCnaes,
          }
        );

        // Salvar no localStorage (client-side será feito via useEffect)
        const savedAnalysis: SavedTaxAnalysis = {
          timestamp: new Date(),
          clientData: {
            companyName: companyName ?? undefined,
            monthlyRevenue: monthlyRevenueNum!,
            regime: serializableResponse.scenarios[0]?.name,
            cnaes: parsedCnaes,
          },
          scenarios: serializableResponse.scenarios,
          reformImpact,
        };

        // Retornar dados para serem salvos no client-side
        (serializableResponse as any).reformImpact = reformImpact;
      }
    } catch (reformError) {
      console.error('Erro ao calcular impacto da reforma:', reformError);
      // Não falhar a análise principal se houver erro no cálculo da reforma
    }

    return {
      aiResponse: serializableResponse,
      transcribedText: serializableResponse?.transcribedText ?? allDocumentsText,
      irpfImpacts,
      webhookResponse,
      error: null,
      historyRecordId: persistenceResult.saved ? persistenceResult.documentId : null,
      historyError: persistenceResult.saved ? null : (persistenceResult.error ?? null),
      initialParameters: {
        monthlyRevenue: monthlyRevenueNum,
        payrollExpenses: payrollExpensesNum,
        issRate: issRateNum,
        numberOfPartners: numberOfPartnersNum,
        realProfitMargin: realProfitMarginNum,
        isHospitalEquivalent,
        isUniprofessionalSociety
      }
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
      historyRecordId: null,
      historyError: null,
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
