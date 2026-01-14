/**
 * AI Flow: Assistente Virtual de Reforma Tributária
 * Especialista em LC 214/2025 e PLP 108/2024
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import type { ReformAssistantInput, ReformAssistantOutput, ChatMessage } from '@/types/reform';
import {
    REFORM_TIMELINE,
    DIFFERENTIATED_REGIMES,
    BASIC_BASKET,
    CASHBACK_RULES,
    KEY_CONCEPTS
} from '@/lib/reform-knowledge';

// Schema de saída do assistente
const ReformAssistantSchema = z.object({
    resposta: z.string().describe('Resposta completa e detalhada do assistente, formatada em Markdown'),
    referencias_legais: z.array(z.string()).describe('Referências às leis (LC 214/2025, PLP 108/2024) mencionadas'),
    topicos_relacionados: z.array(z.string()).describe('Tópicos relacionados que o usuário pode querer explorar'),
    nivel_complexidade: z.enum(['basico', 'intermediario', 'avancado']).describe('Nível de complexidade da resposta'),
});

/**
 * Gera contexto estruturado da base de conhecimento
 */
function buildKnowledgeContext(): string {
    const context = [];

    // Cronograma
    context.push('## CRONOGRAMA DA REFORMA TRIBUTÁRIA (2026-2033)\n');
    REFORM_TIMELINE.forEach(item => {
        context.push(`**${item.ano}**: ${item.evento}`);
        if (item.detalhes) {
            item.detalhes.forEach(d => context.push(`  - ${d}`));
        }
    });

    // Regimes Diferenciados
    context.push('\n## REGIMES DIFERENCIADOS\n');
    DIFFERENTIATED_REGIMES.forEach(regime => {
        context.push(`**${regime.setor}** (Alíquota: ${regime.aliquota_reduzida})`);
        context.push(`Critérios: ${regime.criterios.join(', ')}`);
        if (regime.observacoes) {
            context.push(`Obs: ${regime.observacoes}`);
        }
    });

    // Cesta Básica
    context.push('\n## CESTA BÁSICA NACIONAL (Alíquota Zero)\n');
    BASIC_BASKET.forEach(item => {
        context.push(`- ${item.produto} (${item.categoria})`);
    });

    // Cashback
    context.push('\n## REGRAS DE CASHBACK\n');
    CASHBACK_RULES.forEach(rule => {
        context.push(`**${rule.publico_alvo}**: ${rule.percentual_devolucao} de devolução`);
        context.push(`Tributos: ${rule.tributos_elegiveis.join(', ')}`);
        if (rule.limite_mensal) {
            context.push(`Limite: ${rule.limite_mensal}`);
        }
    });

    // Conceitos-Chave
    context.push('\n## CONCEITOS-CHAVE\n');
    KEY_CONCEPTS.forEach(concept => {
        context.push(`**${concept.termo}**: ${concept.definicao}`);
        if (concept.exemplo) {
            context.push(`Exemplo: ${concept.exemplo}`);
        }
    });

    return context.join('\n');
}

/**
 * Gera prompt do sistema para o assistente
 */
function buildSystemPrompt(): string {
    const knowledgeBase = buildKnowledgeContext();

    return `Você é um Especialista em Reforma Tributária Brasileira, com profundo conhecimento da Lei Complementar 214/2025 e do Projeto de Lei Complementar 108/2024.

## SUA MISSÃO
Auxiliar profissionais da contabilidade e empresários a compreender e se preparar para a maior transformação tributária da história do Brasil.

## BASE DE CONHECIMENTO
${knowledgeBase}

## DIRETRIZES DE COMUNICAÇÃO

### Tom e Estilo
- **Profissional mas acessível**: Use linguagem técnica quando necessário, mas sempre explique termos complexos
- **Proativo**: Antecipe dúvidas e ofereça informações complementares relevantes
- **Prático**: Sempre que possível, forneça exemplos concretos e aplicáveis
- **Atualizado**: Mencione que esta é a legislação vigente em 2026

### Estrutura das Respostas
1. **Resposta Direta**: Comece respondendo objetivamente à pergunta
2. **Contexto Legal**: Cite as bases legais (LC 214/2025, PLP 108/2024, EC 132/2023)
3. **Impacto Prático**: Explique como isso afeta empresas e contribuintes
4. **Cronograma**: Quando aplicável, mencione prazos e datas importantes
5. **Próximos Passos**: Sugira ações ou tópicos relacionados

### Formatação
- Use **Markdown** para estruturar respostas
- Destaque **termos importantes** em negrito
- Use listas para enumerar pontos
- Inclua tabelas quando comparar informações
- Use emojis estrategicamente: 📅 (datas), 💰 (valores), ⚠️ (alertas), ✅ (benefícios)

### Especialidades
- Explicar CBS (Contribuição sobre Bens e Serviços) e IBS (Imposto sobre Bens e Serviços)
- Detalhar o cronograma de transição 2026-2033
- Esclarecer regimes diferenciados e alíquotas reduzidas
- Orientar sobre Split Payment e creditamento
- Analisar impactos por regime tributário (Simples, Presumido, Real)
- Explicar Cesta Básica Nacional e Cashback

### Quando Não Souber
Se a pergunta estiver fora do escopo da Reforma Tributária ou você não tiver informações suficientes:
- Seja honesto sobre as limitações
- Sugira fontes oficiais: www.gov.br/fazenda/reforma-tributaria
- Recomende consultar um contador especializado para casos específicos

## FONTES OFICIAIS
- Lei Complementar 214/2025
- Projeto de Lei Complementar 108/2024
- Emenda Constitucional 132/2023
- Ministério da Fazenda: https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria

Lembre-se: Você está ajudando profissionais a navegar uma mudança histórica. Seja preciso, útil e empático.`;
}

/**
 * Gera prompt do usuário com histórico de conversa
 */
function buildUserPrompt(input: ReformAssistantInput): string {
    const parts: string[] = [];

    // Histórico de conversa (últimas 5 mensagens para contexto)
    if (input.historico && input.historico.length > 0) {
        parts.push('## HISTÓRICO DA CONVERSA\n');
        const recentHistory = input.historico.slice(-5);
        recentHistory.forEach(msg => {
            const role = msg.role === 'user' ? 'USUÁRIO' : 'ASSISTENTE';
            parts.push(`**${role}**: ${msg.content}\n`);
        });
        parts.push('\n---\n');
    }

    // Contexto do cliente (se disponível)
    if (input.contexto_cliente) {
        parts.push('## CONTEXTO DO CLIENTE\n');
        if (input.contexto_cliente.regime_atual) {
            parts.push(`- Regime Tributário Atual: ${input.contexto_cliente.regime_atual}`);
        }
        if (input.contexto_cliente.faturamento_anual) {
            parts.push(`- Faturamento Anual: R$ ${input.contexto_cliente.faturamento_anual.toLocaleString('pt-BR')}`);
        }
        if (input.contexto_cliente.setor) {
            parts.push(`- Setor: ${input.contexto_cliente.setor}`);
        }
        parts.push('\n');
    }

    // Pergunta atual
    parts.push(`## PERGUNTA ATUAL\n${input.pergunta}`);

    return parts.join('\n');
}

/**
 * Executa o AI Flow do Assistente de Reforma Tributária
 */
export async function runReformAssistant(
    input: ReformAssistantInput
): Promise<ReformAssistantOutput> {
    try {
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(input);

        const result = await generateText({
            model: google('gemini-2.0-flash-exp'),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
            maxTokens: 2000,
        });

        // Parse da resposta estruturada
        const response = {
            resposta: result.text,
            referencias_legais: extractLegalReferences(result.text),
            topicos_relacionados: extractRelatedTopics(result.text, input.pergunta),
            nivel_complexidade: assessComplexity(result.text) as 'basico' | 'intermediario' | 'avancado',
        };

        return {
            sucesso: true,
            mensagem: response.resposta,
            referencias_legais: response.referencias_legais,
            topicos_relacionados: response.topicos_relacionados,
            nivel_complexidade: response.nivel_complexidade,
        };

    } catch (error) {
        console.error('Erro no AI Flow de Reforma Tributária:', error);

        return {
            sucesso: false,
            mensagem: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.',
            referencias_legais: [],
            topicos_relacionados: [],
            nivel_complexidade: 'basico',
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

/**
 * Extrai referências legais mencionadas na resposta
 */
function extractLegalReferences(text: string): string[] {
    const references = new Set<string>();

    const patterns = [
        /LC\s*214\/2025/gi,
        /Lei Complementar\s*214\/2025/gi,
        /PLP\s*108\/2024/gi,
        /Projeto de Lei Complementar\s*108\/2024/gi,
        /EC\s*132\/2023/gi,
        /Emenda Constitucional\s*132\/2023/gi,
    ];

    patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => references.add(match.trim()));
        }
    });

    return Array.from(references);
}

/**
 * Extrai tópicos relacionados com base na pergunta e resposta
 */
function extractRelatedTopics(response: string, question: string): string[] {
    const topics: string[] = [];

    // Mapeamento de palavras-chave para tópicos relacionados
    const topicMap: Record<string, string[]> = {
        'cbs': ['IBS - Imposto sobre Bens e Serviços', 'Split Payment', 'Creditamento'],
        'ibs': ['CBS - Contribuição sobre Bens e Serviços', 'Transição 2029-2032', 'ICMS e ISS'],
        'simples': ['Regime Híbrido no Simples', 'Sublimites Estaduais', 'Creditamento para Clientes'],
        'presumido': ['Lucro Real', 'Planejamento Tributário', 'Migração de Regime'],
        'cashback': ['Cesta Básica', 'Devolução de Tributos', 'Cadastro Único'],
        'split payment': ['Retenção Automática', 'Fluxo de Caixa', 'Sistema Bancário'],
        'cesta básica': ['Alíquota Zero', 'Produtos Essenciais', 'Cashback'],
        'transição': ['Cronograma 2026-2033', 'Ano-Teste 2026', 'Extinção ICMS/ISS'],
    };

    const combinedText = `${question} ${response}`.toLowerCase();

    Object.entries(topicMap).forEach(([keyword, relatedTopics]) => {
        if (combinedText.includes(keyword)) {
            topics.push(...relatedTopics);
        }
    });

    // Remover duplicatas e limitar a 5 tópicos
    return Array.from(new Set(topics)).slice(0, 5);
}

/**
 * Avalia o nível de complexidade da resposta
 */
function assessComplexity(text: string): string {
    const technicalTerms = [
        'creditamento', 'split payment', 'não cumulatividade', 'alíquota efetiva',
        'regime híbrido', 'comitê gestor', 'imposto seletivo', 'princípio do destino'
    ];

    const termCount = technicalTerms.filter(term =>
        text.toLowerCase().includes(term)
    ).length;

    if (termCount >= 4) return 'avancado';
    if (termCount >= 2) return 'intermediario';
    return 'basico';
}
