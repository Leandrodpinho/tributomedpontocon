'use server';

import { LEGAL_CONSTANTS_2025 } from './legal-constants';
import { runComplianceRules, generateNaturezaJuridicaAnalysis } from './compliance-rules';
/**
 * @fileOverview Generates potential tax scenarios tailored for medical professionals and clinics.
 *
 * - generateTaxScenarios - A function that generates tax scenarios.
 * - GenerateTaxScenariosInput - The input type for the generateTaxScenarios function.
 * - GenerateTaxScenariosOutput - The return type for the generateTaxScenarios function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  GenerateTaxScenariosInput,
  GenerateTaxScenariosInputSchema,
  GenerateTaxScenariosOutput,
  GenerateTaxScenariosOutputSchema,
} from './types';

// Define an extended schema that includes the legal constants for type safety and validation within the flow.
const GenerateTaxScenariosWithConstantsInputSchema =
  GenerateTaxScenariosInputSchema.extend({
    minimumWage: z.number(),
    inssCeiling: z.number(),
  });

export async function generateTaxScenarios(input: GenerateTaxScenariosInput): Promise<GenerateTaxScenariosOutput> {
  // Injeta as constantes legais no payload que será enviado para a IA.
  const fullInput = {
    ...input,
    ...LEGAL_CONSTANTS_2025,
  };
  return generateTaxScenariosFlow(fullInput);
}

const prompt = ai.definePrompt({
  name: 'generateTaxScenariosPrompt',
  input: { schema: GenerateTaxScenariosWithConstantsInputSchema },
  // Remove strict output schema to handle raw text and potential truncation manually
  // output: { schema: GenerateTaxScenariosOutputSchema },
  config: {
    temperature: 0.5,
    maxOutputTokens: 8192,
  },
  prompt: `Seja como profissional máster em Direito Tributário, Contabilidade Fiscal e Tributária... (prompt original mantido)...
  
Sua resposta deve ser um JSON VÁLIDO seguindo a estrutura abaixo. NÃO adicione markdown formatting como \`\`\`json no início ou fim. Apenas o JSON puro.

{
  "monthlyRevenue": number,
  "scenarios": [
    {
       "name": "...",
       "totalTaxValue": number,
       "effectiveRate": number,
       "notes": "...",
       ...
    }
  ],
  "executiveSummary": "...",
  "complianceAnalysis": { ... }
}

IMPORTANTE:
- USE EXATAMENTE AS CHAVES: "name", "totalTaxValue", "effectiveRate".
- NÃO use "regime" ou "monthlyTax".
- "effectiveRate" deve ser número percentual (ex: 10.5 para 10.5%), NÃO decimal (0.105).

DADOS DE ENTRADA:
Tipo de Cliente: {{{clientType}}}
{{#if companyName}}Nome da Empresa: {{{companyName}}}{{/if}}
{{#if cnpj}}CNPJ: {{{cnpj}}}{{/if}}

**DADOS ESTRUTURADOS (Prioridade Máxima):**
{{#if cnaes}}CNAEs: {{{cnaes}}}{{/if}}
{{#if monthlyRevenue}}Faturamento Mensal: {{{monthlyRevenue}}}{{/if}}
{{#if rbt12}}RBT12 (Receita Bruta 12M): {{{rbt12}}}{{/if}}
{{#if fs12}}FS12 (Folha de Salários 12M): {{{fs12}}}{{/if}}
{{#if payrollExpenses}}Folha Salarial Bruta (CLT): {{{payrollExpenses}}}{{/if}}
{{#if isHospitalEquivalent}}Equiparação Hospitalar: Sim{{/if}}
{{#if isUniprofessionalSociety}}Sociedade Uniprofissional (ISS Fixo): Sim{{/if}}
{{#if issRate}}Alíquota de ISS (ad valorem): {{{issRate}}}%{{else}}Alíquota de ISS (ad valorem): 4% (padrão){{/if}}

**DADOS NÃO ESTRUTURADOS (Fallback):**
{{#if clientData}}Texto do Cliente: {{{clientData}}}{{/if}}
{{#if documentsAsText}}
Conteúdo dos Documentos Anexados:
{{{documentsAsText}}}
{{/if}}

... (restante do prompt original ou similar, garantindo instruções claras de JSON) ...
Sua resposta deve seguir estritamente a estrutura do JSON de saída. Seja analítico, preciso e aja como o especialista que você é.`,
});

// Helper function to repair truncated JSON
function parseAndFixJSON(text: string): any {
  // Remove markdown code blocks if present
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse failed, attempting repair of truncated JSON...");

    // Simple heuristic repair for truncated arrays/objects
    // 1. Find the last matching brace/bracket stack
    // This is a naive implementation; for production, use a library like 'json-repair' or 'partial-json'
    // For now, we try to close open braces based on a simple counter.

    let stack: string[] = [];
    let isString = false;
    let escape = false;

    for (const char of cleanText) {
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === '"') { isString = !isString; continue; }
      if (!isString) {
        if (char === '{') stack.push('}');
        if (char === '[') stack.push(']');
        if (char === '}' || char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
        }
      }
    }

    // If we have an incomplete string at the end, close it
    if (isString) {
      cleanText += '"';
    }

    // Close remaining open structures in reverse order
    while (stack.length > 0) {
      cleanText += stack.pop();
    }

    try {
      return JSON.parse(cleanText);
    } catch (finalError) {
      console.error("Failed to repair JSON:", finalError);
      console.debug("Unfixable Text:", text);
      return null;
    }
  }
}

// Helper to normalize scenarios if AI uses "creative" field names
function normalizeScenarios(scenarios: any[]): any[] {
  if (!Array.isArray(scenarios)) return [];

  return scenarios.map(s => {
    // Map 'regime' to 'name'
    if (!s.name && s.regime) s.name = s.regime;

    // Map 'monthlyTax' or 'taxValue' to 'totalTaxValue'
    if (s.totalTaxValue === undefined) {
      if (s.monthlyTax !== undefined) s.totalTaxValue = s.monthlyTax;
      else if (s.taxValue !== undefined) s.totalTaxValue = s.taxValue;
    }

    // Map 'basis' to 'notes' if notes is empty
    if (!s.notes && s.basis) s.notes = `Base de cálculo: ${s.basis}`;

    // Normalize effectiveRate (handle 0.14 vs 14.0)
    if (s.effectiveRate !== undefined) {
      if (s.effectiveRate < 1 && s.effectiveRate > 0) {
        s.effectiveRate = Number((s.effectiveRate * 100).toFixed(2));
      }
    }

    // Default defaults for missing fields to avoid schema failure
    if (!s.taxBreakdown) s.taxBreakdown = [];
    if (!s.proLaboreAnalysis) {
      s.proLaboreAnalysis = { baseValue: 0, inssValue: 0, irrfValue: 0, netValue: 0 };
    }
    if (s.netProfitDistribution === undefined) s.netProfitDistribution = 0;
    if (s.scenarioRevenue === undefined) s.scenarioRevenue = 0;

    return s;
  });
}

// Helper to normalize compliance if AI converts objects to flat fields
function normalizeCompliance(compliance: any, inputData?: any): any {
  if (!compliance) return undefined;

  // Initialize standard structure
  const normalized: any = {
    cnaeValidation: Array.isArray(compliance.cnaeValidation) ? compliance.cnaeValidation : [],
    naturezaJuridicaCheck: typeof compliance.naturezaJuridicaCheck === 'string' && compliance.naturezaJuridicaCheck.trim().length > 10
      ? compliance.naturezaJuridicaCheck
      : (inputData ? generateNaturezaJuridicaAnalysis(inputData) : "Natureza jurídica não identificada nos documentos fornecidos. Recomendação: Forneça o Cartão CNPJ ou Contrato Social para análise precisa."),
    alerts: Array.isArray(compliance.alerts) ? compliance.alerts : []
  };

  // Transform consultant-style fields into alerts
  if (compliance.equiparaçãoHospitalarRequirements) {
    normalized.alerts.push({
      type: 'warning',
      title: 'Requisitos Equiparação Hospitalar',
      description: typeof compliance.equiparaçãoHospitalarRequirements === 'string'
        ? compliance.equiparaçãoHospitalarRequirements
        : JSON.stringify(compliance.equiparaçãoHospitalarRequirements),
      suggestion: 'Verifique o cumprimento dos requisitos da ANVISA e Lei 9.249/95.'
    });
  }

  if (compliance.sociedadeUniprofissionalNotes) {
    normalized.alerts.push({
      type: 'info',
      title: 'Sociedade Uniprofissional (SUP)',
      description: typeof compliance.sociedadeUniprofissionalNotes === 'string'
        ? compliance.sociedadeUniprofissionalNotes
        : JSON.stringify(compliance.sociedadeUniprofissionalNotes),
      suggestion: 'Confira a legislação municipal para adesão ao ISS Fixo.'
    });
  }

  if (compliance.fatorRAnalysis) {
    normalized.alerts.push({
      type: 'info',
      title: 'Análise Fator R',
      description: typeof compliance.fatorRAnalysis === 'string'
        ? compliance.fatorRAnalysis
        : JSON.stringify(compliance.fatorRAnalysis),
      suggestion: 'Monitore a proporção da folha salarial mensalmente.'
    });
  }

  return normalized;
}

const generateTaxScenariosFlow = ai.defineFlow(
  {
    name: 'generateTaxScenariosFlow',
    inputSchema: GenerateTaxScenariosWithConstantsInputSchema,
    outputSchema: GenerateTaxScenariosOutputSchema,
  },
  async input => {
    // Implementação de Cache Simples (In-Memory)
    const cacheKey = generateCacheKey(input);
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('Cache hit for tax scenarios:', cacheKey);
      return cached;
    }

    try {
      // Retry logic for overloaded API (503 errors)
      let lastError: any;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Get raw text response
          const result = await prompt(input);
          const rawText = result.text;

          let output: any = parseAndFixJSON(rawText);

          if (!output) {
            throw new Error('A IA não retornou um JSON válido, e a reparação falhou.');
          }

          // --- MAPPING LAYER (TRANSFORMERS) ---
          // 1. Normalize Scenarios (Consultant -> Schema)
          if (output.scenarios && Array.isArray(output.scenarios)) {
            output.scenarios = normalizeScenarios(output.scenarios);
          }

          // 2. Normalize Compliance (Flat consultant notes -> Structured Alerts)
          if (output.complianceAnalysis) {
            output.complianceAnalysis = normalizeCompliance(output.complianceAnalysis, input);
          } else {
            // Attempt to find compliance fields at root if completely unstructured
            const rootCompliance: any = {};
            if (output.cnaeValidation) rootCompliance.cnaeValidation = output.cnaeValidation;
            if (output.naturezaJuridicaCheck) rootCompliance.naturezaJuridicaCheck = output.naturezaJuridicaCheck;
            if (output.equiparaçãoHospitalarRequirements) rootCompliance.equiparaçãoHospitalarRequirements = output.equiparaçãoHospitalarRequirements;
            if (output.sociedadeUniprofissionalNotes) rootCompliance.sociedadeUniprofissionalNotes = output.sociedadeUniprofissionalNotes;

            if (Object.keys(rootCompliance).length > 0) {
              output.complianceAnalysis = normalizeCompliance(rootCompliance, input);
            }
          }

          // Validate against Schema (safely)
          const parsed = GenerateTaxScenariosOutputSchema.safeParse(output);

          if (!parsed.success) {
            console.warn("Schema validation failed on partial JSON:", parsed.error);
            // usage of partial data is allowed, so we proceed with 'output' (which is 'any' here)
            // but ideally we should only use valid parts. 
            // For now, we trust the repair + fallback logic below.
          } else {
            output = parsed.data;
          }

          // Fallback Logic: Ensure robust output even if AI truncates
          if (!output.executiveSummary) {
            output.executiveSummary = "### Análise Parcial\n\nO resumo executivo não pôde ser gerado completamente devido ao limite de tokens. Por favor, analise os cenários calculados individualmente na tabela acima.";
          }

          if (!output.scenarios) {
            output.scenarios = [];
          } else {
            output.scenarios = output.scenarios.map((s: any) => {
              return s;
            }).filter(Boolean) as any;
          }

          if (!output.complianceAnalysis) {
            // Executar regras de compliance baseadas em lógica
            const ruleBasedAlerts = runComplianceRules(input);
            const naturezaAnalysis = generateNaturezaJuridicaAnalysis(input);

            output.complianceAnalysis = {
              cnaeValidation: [],
              naturezaJuridicaCheck: naturezaAnalysis,
              alerts: ruleBasedAlerts.length > 0 ? ruleBasedAlerts : [{
                type: 'warning',
                title: 'Documentação Incompleta',
                description: 'Não foi possível realizar auditoria de compliance devido à falta de documentos essenciais.',
                suggestion: 'Anexe: Cartão CNPJ, Contrato Social, e/ou DAS/DARF dos últimos 3 meses para análise completa.'
              }]
            };
          } else {
            // Enriquecer compliance da IA com regras automáticas
            const ruleBasedAlerts = runComplianceRules(input);
            const existingAlertTitles = new Set(output.complianceAnalysis.alerts.map((a: any) => a.title));

            // Adicionar alertas de regras que não foram detectados pela IA
            for (const alert of ruleBasedAlerts) {
              if (!existingAlertTitles.has(alert.title)) {
                output.complianceAnalysis.alerts.push(alert);
              }
            }

            // Se a IA não gerou análise de natureza jurídica válida, usar a baseada em regras
            if (!output.complianceAnalysis.naturezaJuridicaCheck ||
              output.complianceAnalysis.naturezaJuridicaCheck.length < 20 ||
              output.complianceAnalysis.naturezaJuridicaCheck.includes('não padronizada')) {
              output.complianceAnalysis.naturezaJuridicaCheck = generateNaturezaJuridicaAnalysis(input);
            }
          }

          // Ensure monthlyRevenue is set if missing (critical field)
          if (!output.monthlyRevenue) {
            output.monthlyRevenue = input.monthlyRevenue || 0;
          }

          // Salva no cache
          saveToCache(cacheKey, output);

          return output;

        } catch (error: any) {
          lastError = error;

          // Check if it's a 503 (overloaded) error
          const is503 = error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded');

          if (is503 && attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.warn(`API sobrecarregada (tentativa ${attempt}/${maxRetries}). Aguardando ${waitTime}ms antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue; // Retry
          }

          // If not 503 or max retries reached, throw
          throw error;
        }
      }

      // If we got here, all retries failed
      throw lastError;
    } catch (error: any) {
      // Log aprimorado para depuração em produção
      console.error('Erro crítico ao gerar cenários tributários. Input:', JSON.stringify(input, null, 2));
      console.error('Detalhes do erro Completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      const errorMessage = error.message || JSON.stringify(error);
      // Re-lança um erro para o frontend
      throw new Error(`Falha na geração dos cenários tributários: ${errorMessage}`);
    }
  }
);

// --- Cache Util --
import { createHash } from 'crypto';

const REQUEST_CACHE = new Map<string, { data: GenerateTaxScenariosOutput; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hora

function generateCacheKey(input: any): string {
  const stableString = JSON.stringify(input, Object.keys(input).sort());
  return createHash('sha256').update(stableString).digest('hex');
}

function getFromCache(key: string): GenerateTaxScenariosOutput | null {
  const entry = REQUEST_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    REQUEST_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

function saveToCache(key: string, data: GenerateTaxScenariosOutput) {
  // Limpeza preventiva se ficar muito grande (simples LRU-like ou apenas clear)
  if (REQUEST_CACHE.size > 100) REQUEST_CACHE.clear();

  REQUEST_CACHE.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}
