/**
 * Tipos e interfaces para o Assistente de Reforma Tributária
 */

// Cronograma de implementação da reforma
export interface ReformTimeline {
    year: number;
    phase: string;
    changes: string[];
    cbs_rate?: number;
    ibs_rate?: number;
    icms_reduction?: number;
    iss_reduction?: number;
}

// Regime diferenciado
export interface DifferentiatedRegime {
    id: string;
    name: string;
    reduction_percentage: 60 | 30 | 0;
    description: string;
    sectors: string[];
    examples: string[];
}

// Análise de impacto da reforma
export interface ReformImpactAnalysis {
    regime_atual: string;
    faturamento_mensal: number;

    // Situação atual (2025)
    carga_atual: {
        pis_cofins: number;
        icms?: number;
        iss?: number;
        total: number;
    };

    // Projeção 2026 (ano-teste)
    projecao_2026: {
        cbs_teste: number; // 0.9%
        ibs_teste: number; // 0.1%
        compensacao_pis_cofins: number;
        impacto_liquido: number;
    };

    // Projeção 2027 (CBS plena)
    projecao_2027: {
        cbs: number;
        imposto_seletivo?: number;
        ipi_zfm?: number;
        total: number;
    };

    // Projeção 2029-2032 (transição IBS)
    transicao_ibs: Array<{
        ano: number;
        icms_percentual: number;
        iss_percentual: number;
        ibs_percentual: number;
        carga_total_estimada: number;
    }>;

    // Projeção 2033 (modelo final)
    projecao_2033: {
        cbs: number;
        ibs: number;
        total: number;
        diferenca_vs_atual: number;
        percentual_mudanca: number;
    };

    // Recomendações
    recomendacoes: string[];
    alertas: Array<{
        tipo: 'atencao' | 'oportunidade' | 'risco';
        titulo: string;
        descricao: string;
    }>;
}

// Item da base de conhecimento
export interface ReformKnowledgeItem {
    id: string;
    category: 'cronograma' | 'creditamento' | 'regimes' | 'cesta-basica' | 'cashback' | 'split-payment' | 'simples' | 'governanca' | 'fundos';
    title: string;
    content: string;
    tags: string[];
    related_regimes: string[];
    source: string; // LC 214/2025, LC 227/2026, etc.
}

// Mensagem do chat
export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: string[];
    impact_summary?: string;
    metadata?: {
        referencias_legais?: string[];
        topicos_relacionados?: string[];
        nivel_complexidade?: string;
    };
}

// Input para o assistente
export interface ReformAssistantInput {
    query: string;
    context?: {
        regime?: string;
        monthlyRevenue?: number;
        cnaes?: string[];
        hasEmployees?: boolean;
    };
    conversation_history?: ChatMessage[];
}

// Output do assistente
export interface ReformAssistantOutput {
    response: string;
    sources: string[];
    impact_summary?: string;
    suggested_questions?: string[];
}

// Cesta básica nacional
export interface BasicBasketItem {
    name: string;
    category: 'proteinas' | 'graos' | 'hortifruti' | 'laticinios' | 'outros';
    tax_treatment: 'zero' | 'reducao_60';
    description: string;
}

// Cashback
export interface CashbackRule {
    product_category: string;
    cbs_return: number; // percentual
    ibs_return: number; // percentual
    eligibility: string;
}
