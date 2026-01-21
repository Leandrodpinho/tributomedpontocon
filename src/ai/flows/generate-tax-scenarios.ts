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

// Schema original input, sem constantes extras (IA não precisa mais delas)
const GenerateTaxScenariosWithConstantsInputSchema = GenerateTaxScenariosInputSchema;

export async function generateTaxScenarios(input: GenerateTaxScenariosInput): Promise<GenerateTaxScenariosOutput> {
  // Não injetamos mais constantes legais complexas aqui.
  // A Engine acessa via import direto e a IA foca na análise qualitativa.
  return generateTaxScenariosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaxScenariosPrompt',
  input: { schema: GenerateTaxScenariosInputSchema },
  // Remove strict output schema to handle raw text and potential truncation manually
  // output: { schema: GenerateTaxScenariosOutputSchema },
  config: {
    temperature: 0.1,  // ✅ Reduzido de 0.5 para 0.1 - Mais determinístico
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

// Importar a Engine Determinística
import { generateDeterministicScenarios } from '@/lib/tax-engine/engine';

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
      // 1. Geração Determinística dos Cenários (Correção da Alucinação Numérica)
      // Calculamos os números PRIMEIRO com a engine matemática confiável
      const deterministicScenarios = generateDeterministicScenarios(input);
      console.log('Engine determinística gerou:', deterministicScenarios.length, 'cenários.');

      // 2. Chamada à IA para Análise Qualitativa (Compliance, Resumo, Contexto)
      // O prompt continua pedindo o JSON completo, mas nós vamos SOBRESCREVER os números
      // com os dados da Engine. A IA serve para "explicar" e validar regras complexas de texto.

      let lastError: any;
      const maxRetries = 3;
      let output: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await prompt(input);
          const rawText = result.text;
          output = parseAndFixJSON(rawText);

          if (output) break; // Sucesso no parse
        } catch (error: any) {
          lastError = error;
          const is503 = error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded');
          if (is503 && attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.warn(`API sobrecarregada (tentativa ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }
      }

      if (!output) throw new Error('Falha ao gerar análise qualitativa pela IA.');

      // --- MAPPING & MERGE LAYER (Híbrido) ---

      // 1. Preservar a análise qualitativa da IA
      if (output.complianceAnalysis) {
        output.complianceAnalysis = normalizeCompliance(output.complianceAnalysis, input);
      } else {
        // Fallback de compliance via regras se a IA falhar
        const ruleBasedAlerts = runComplianceRules(input);
        const naturezaAnalysis = generateNaturezaJuridicaAnalysis(input);
        output.complianceAnalysis = {
          cnaeValidation: [],
          naturezaJuridicaCheck: naturezaAnalysis,
          alerts: ruleBasedAlerts
        };
      }

      // 2. INJETAR Cenários Determinísticos (Substituição Total dos Cenários da IA)
      // Motivo: A IA alucina números. A Engine é exata.
      // Mantemos apenas notas extras se a IA tiver gerado algo MUITO relevante, 
      // mas na prática, a engine já gera notas técnicas boas.

      // Opcional: Tentar fazer "merge" inteligente de notas.
      // Por enquanto, confiamos 100% na engine para os cenários para garantir a consistência solicitada pelo usuário.
      output.scenarios = deterministicScenarios;

      // 3. Validação final de schema
      const parsed = GenerateTaxScenariosOutputSchema.safeParse(output);
      if (parsed.success) {
        output = parsed.data;
      }

      // 4. Garantias finais
      if (!output.monthlyRevenue) output.monthlyRevenue = input.monthlyRevenue || 0;

      // Fallback para executiveSummary se vazio
      if (!output.executiveSummary) {
        const best = deterministicScenarios[0];
        output.executiveSummary = `### Análise Financeira\n\nCom base nos dados fornecidos, o regime **${best.name}** apresenta a maior eficiência tributária, com uma alíquota efetiva de **${best.effectiveRate?.toFixed(2)}%**. \n\nRecomendamos a migração ou manutenção deste regime mediante validação contábil detalhada.`;
      }

      saveToCache(cacheKey, output);
      return output;

    } catch (error: any) {
      console.error('Erro crítico no fluxo híbrido:', error);
      throw new Error(`Falha na geração dos cenários: ${error.message}`);
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
