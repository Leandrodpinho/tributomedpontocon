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
 * Detecta a natureza jurídica a partir do texto
 */
export function detectNaturezaJuridica(text: string): NaturezaJuridica {
    const textUpper = text.toUpperCase();

    if (textUpper.includes('EMPRESARIO INDIVIDUAL') || textUpper.includes('EMPRESÁRIO INDIVIDUAL')) return 'EI';
    if (textUpper.includes('EIRELI')) return 'EIRELI';
    if (textUpper.includes('SOCIEDADE LIMITADA UNIPESSOAL') || textUpper.includes('SLU')) return 'SLU';
    if (textUpper.includes('LTDA') || textUpper.includes('LIMITADA')) return 'LTDA';
    if (textUpper.includes('S/A') || textUpper.includes('SOCIEDADE ANONIMA') || textUpper.includes('SOCIEDADE ANÔNIMA')) return 'SA';
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
            const nj = detectNaturezaJuridica(data.documentsAsText || '');
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
            const nj = detectNaturezaJuridica(data.documentsAsText || '');
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
            const nj = detectNaturezaJuridica(data.documentsAsText || '');
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
    const nj = detectNaturezaJuridica(data.documentsAsText || '');

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
