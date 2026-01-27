/**
 * Regras de compliance para validação automática
 */

export type NaturezaJuridica = 'EI' | 'EIRELI' | 'LTDA' | 'SLU' | 'SA' | 'COOPERATIVA' | 'MEI' | 'UNKNOWN';

export interface ComplianceRule {
    check: (data: any) => boolean;
    alert: {
        type: 'danger' | 'warning' | 'info' | 'opportunity';
        title: string;
        description: string;
        suggestion?: string;
    };
}

/**
 * Detecta a natureza jurídica a partir do texto (Documentos ou Razão Social)
 * Suporta:
 * - Códigos CONCLA/IBGE do Cartão CNPJ (ex: 206-2, 230-5)
 * - Nomes completos (ex: "Sociedade Empresária Limitada")
 * - Siglas (ex: LTDA, SLU, EIRELI)
 */
export function detectNaturezaJuridica(textOrData: string | any): NaturezaJuridica {
    let textUpper = '';

    if (typeof textOrData === 'string') {
        textUpper = textOrData.toUpperCase();
    } else if (typeof textOrData === 'object') {
        // Concatena tudo que pode ter a natureza jurídica
        textUpper = ((textOrData.documentsAsText || '') + ' ' + (textOrData.companyName || '') + ' ' + (textOrData.clientData || '')).toUpperCase();
    }

    // ==========================================
    // 1. CÓDIGOS CONCLA/IBGE do Cartão CNPJ
    // Formato: XXX-X (ex: 206-2)
    // ==========================================

    // 206-2: Sociedade Empresária Limitada (LTDA/SLU)
    if (/\b206[-\s]?2\b/.test(textUpper)) {
        // Verificar se é SLU (unipessoal) ou LTDA comum
        if (textUpper.includes('UNIPESSOAL') || textUpper.includes('SLU')) {
            return 'SLU';
        }
        return 'LTDA';
    }

    // 213-5: Empresário Individual (EI)
    if (/\b213[-\s]?5\b/.test(textUpper)) return 'EI';

    // 230-5: EIRELI de Natureza Empresária (extinta)
    // 231-3: EIRELI de Natureza Simples (extinta)
    if (/\b(230[-\s]?5|231[-\s]?3)\b/.test(textUpper)) return 'EIRELI';

    // 224-0: SA Aberta / 225-9: SA Fechada
    if (/\b(224[-\s]?0|225[-\s]?9)\b/.test(textUpper)) return 'SA';

    // 214-3: Cooperativa
    if (/\b214[-\s]?3\b/.test(textUpper)) return 'COOPERATIVA';

    // ==========================================
    // 2. NOMES COMPLETOS do Cartão CNPJ
    // ==========================================

    // Sociedade Empresária Limitada / Sociedade Limitada
    if (textUpper.includes('SOCIEDADE EMPRESARIA LIMITADA') ||
        textUpper.includes('SOCIEDADE EMPRESÁRIA LIMITADA') ||
        textUpper.includes('SOCIEDADE SIMPLES LIMITADA')) {
        if (textUpper.includes('UNIPESSOAL') || textUpper.includes('SLU')) {
            return 'SLU';
        }
        return 'LTDA';
    }

    // Sociedade Limitada Unipessoal
    if (textUpper.includes('SOCIEDADE LIMITADA UNIPESSOAL')) return 'SLU';

    // Sociedade Anônima
    if (textUpper.includes('SOCIEDADE ANONIMA') || textUpper.includes('SOCIEDADE ANÔNIMA')) return 'SA';

    // ==========================================
    // 3. SIGLAS tradicionais (fallback)
    // ==========================================

    if (textUpper.includes('EMPRESARIO INDIVIDUAL') || textUpper.includes('EMPRESÁRIO INDIVIDUAL')) return 'EI';
    if (textUpper.includes('EIRELI')) return 'EIRELI';
    if (textUpper.includes('SLU')) return 'SLU';
    // LTDA geralmente aparece no fim da razão social
    if (textUpper.includes('LTDA') || textUpper.includes('LIMITADA')) return 'LTDA';
    if (textUpper.includes('S/A')) return 'SA';
    if (textUpper.includes('COOPERATIVA')) return 'COOPERATIVA';
    if (textUpper.includes('MEI') || textUpper.includes('MICROEMPREENDEDOR INDIVIDUAL')) return 'MEI';

    return 'UNKNOWN';
}

/**
 * Regras de compliance para atividades médicas
 */
export const MEDICAL_COMPLIANCE_RULES: ComplianceRule[] = [
    {
        check: (data) => {
            const nj = detectNaturezaJuridica(data); // Passa o objeto full data agora
            const isMedical = data.cnaes?.some((cnae: string) => cnae.startsWith('863')) ||
                (data.documentsAsText || '').toLowerCase().includes('médic');
            return nj === 'EI' && isMedical;
        },
        alert: {
            type: 'danger',
            title: 'Incompatibilidade: EI para Atividade Médica',
            description: 'Empresário Individual (EI) possui responsabilidade ilimitada, ou seja, o patrimônio pessoal responde pelas dívidas da empresa. Para profissionais da saúde, isso representa alto risco.',
            suggestion: 'Migrar para SLU (Sociedade Limitada Unipessoal) que oferece proteção patrimonial e mantém a simplicidade de gestão.'
        }
    },
    {
        check: (data) => {
            const nj = detectNaturezaJuridica(data);
            return nj === 'EIRELI';
        },
        alert: {
            type: 'warning',
            title: 'Natureza Jurídica Obsoleta: EIRELI',
            description: 'A EIRELI foi extinta pela Lei 14.195/2021. Empresas existentes podem continuar operando, mas não é possível abrir novas EIRELIs.',
            suggestion: 'Considerar migração para SLU (Sociedade Limitada Unipessoal) que oferece as mesmas vantagens com menos burocracia e custos.'
        }
    },
    {
        check: (data) => {
            const nj = detectNaturezaJuridica(data);
            return nj === 'MEI';
        },
        alert: {
            type: 'danger',
            title: 'MEI Incompatível com Atividade Médica',
            description: 'Microempreendedor Individual (MEI) NÃO pode exercer atividades regulamentadas por conselhos profissionais, incluindo medicina.',
            suggestion: 'Regularizar imediatamente como SLU ou LTDA para evitar autuações fiscais e impedimentos no CRM.'
        }
    },
    {
        check: (data) => {
            const hasCirurgico = data.cnaes?.some((cnae: string) => cnae === '8630-5/04') ||
                (data.documentsAsText || '').toLowerCase().includes('cirúrgico');
            return hasCirurgico;
        },
        alert: {
            type: 'opportunity',
            title: 'Potencial Equiparação Hospitalar',
            description: 'Identificada atividade com CNAE 8630-5/04 (procedimentos cirúrgicos). Se a clínica possuir infraestrutura hospitalar, pode se beneficiar de alíquotas reduzidas.',
            suggestion: 'Verificar requisitos da ANVISA para Equiparação Hospitalar: centro cirúrgico, leitos de observação, equipamentos específicos. Benefício: IRPJ 8% + CSLL 12% no Lucro Presumido.'
        }
    }
];

/**
 * Executa todas as regras de compliance
 */
export function runComplianceRules(data: any): Array<{
    type: 'danger' | 'warning' | 'info' | 'opportunity';
    title: string;
    description: string;
    suggestion?: string;
}> {
    const alerts: any[] = [];

    for (const rule of MEDICAL_COMPLIANCE_RULES) {
        if (rule.check(data)) {
            alerts.push(rule.alert);
        }
    }

    return alerts;
}

/**
 * Gera análise de natureza jurídica baseada em regras
 */
export function generateNaturezaJuridicaAnalysis(data: any): string {
    const nj = detectNaturezaJuridica(data);

    const analyses: Record<NaturezaJuridica, string> = {
        'EI': 'Identificada natureza jurídica: Empresário Individual (EI). ATENÇÃO: Responsabilidade ilimitada - patrimônio pessoal responde pelas dívidas. Não recomendado para profissionais da saúde.',
        'EIRELI': 'Identificada natureza jurídica: EIRELI (Empresa Individual de Responsabilidade Limitada). ATENÇÃO: Formato extinto desde 2021. Recomenda-se migração para SLU.',
        'SLU': 'Identificada natureza jurídica: SLU (Sociedade Limitada Unipessoal). Estrutura adequada para profissional individual com proteção patrimonial.',
        'LTDA': 'Identificada natureza jurídica: LTDA (Sociedade Limitada). Estrutura adequada para sociedades com múltiplos sócios.',
        'SA': 'Identificada natureza jurídica: S/A (Sociedade Anônima). Estrutura complexa, geralmente utilizada para grandes empresas.',
        'COOPERATIVA': 'Identificada natureza jurídica: Cooperativa. Estrutura específica com regime tributário diferenciado.',
        'MEI': 'Identificada natureza jurídica: MEI (Microempreendedor Individual). INCOMPATÍVEL com atividades regulamentadas por conselhos profissionais.',
        'UNKNOWN': 'Natureza jurídica não identificada nos documentos fornecidos. Recomendação: Anexe o Cartão CNPJ ou Contrato Social para análise precisa.'
    };

    return analyses[nj];
}
