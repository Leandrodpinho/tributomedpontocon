/**
 * Regras de compliance para validação automática
 */

export type NaturezaJuridica = 'EI' | 'EIRELI' | 'LTDA' | 'SLU' | 'SA' | 'COOPERATIVA' | 'MEI' | 'UNKNOWN';

// Tipo para dados de entrada de compliance
export interface ComplianceData {
    documentsAsText?: string;
    companyName?: string;
    clientData?: string;
    cnaes?: string[];
    activities?: Array<{ name?: string; revenue?: number; type?: string }>;
    scenarios?: Array<{ scenarioType?: string; name?: string; totalTaxValue?: number }>;
    monthlyRevenue?: number;
    payrollExpenses?: number;
    numberOfPartners?: number;
}

export interface ComplianceRule {
    check: (data: ComplianceData) => boolean;
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
export function detectNaturezaJuridica(textOrData: string | ComplianceData): NaturezaJuridica {
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
    },
    // ============================================================
    // NOVAS REGRAS: Atividades Mistas e Otimização
    // ============================================================
    {
        // Detecta atividades mistas que podem se beneficiar de separação de CNPJs
        check: (data) => {
            const activities = data.activities || [];
            if (activities.length < 2) return false;

            // Categorias de atividades que geralmente se beneficiam de separação
            const categories = {
                medical: ['médic', 'medic', 'saúde', 'clinic', 'hospital', 'odont'],
                education: ['professor', 'ensino', 'aula', 'curso', 'educac', 'treinam'],
                commerce: ['venda', 'comércio', 'comercio', 'loja', 'produto'],
                services: ['consult', 'serviço', 'servico', 'assessor']
            };

            const detectedCategories = new Set<string>();
            for (const activity of activities) {
                const nameLC = (activity.name || '').toLowerCase();
                for (const [cat, keywords] of Object.entries(categories)) {
                    if (keywords.some(kw => nameLC.includes(kw))) {
                        detectedCategories.add(cat);
                    }
                }
            }

            // Se tem 2+ categorias distintas, pode haver oportunidade
            return detectedCategories.size >= 2;
        },
        alert: {
            type: 'opportunity',
            title: 'Atividades Mistas Detectadas',
            description: 'Identificamos múltiplas categorias de atividades (ex: médica + educacional, clínica + produtos). Em alguns casos, separar em CNPJs distintos pode gerar economia tributária significativa.',
            suggestion: 'Avaliar: 1) Tributação individual de cada atividade; 2) Se uma atividade contamina o regime tributário da outra (ex: comércio no Simples pode impedir Anexo III para serviços); 3) Estimar economia com separação.'
        }
    },
    {
        // Alerta quando Anexo V é mais caro que Lucro Presumido
        check: (data) => {
            const scenarios = data.scenarios || [];
            const anexoV = scenarios.find((s: any) =>
                s.scenarioType === 'simples_anexo_v' ||
                (s.name?.toLowerCase().includes('anexo v') && !s.name?.toLowerCase().includes('beneficiada'))
            );
            const presumido = scenarios.find((s: any) =>
                s.scenarioType === 'presumido' || s.scenarioType === 'presumido_uniprofissional'
            );

            if (!anexoV || !presumido) return false;

            // Se Anexo V é mais caro que Presumido
            return (anexoV.totalTaxValue || 0) > (presumido.totalTaxValue || 0);
        },
        alert: {
            type: 'warning',
            title: 'Simples Nacional (Anexo V) Mais Caro que Lucro Presumido',
            description: 'Seu Simples Nacional no Anexo V está custando mais que o Lucro Presumido. Isso ocorre quando o Fator R é inferior a 28% e a empresa não consegue migrar para o Anexo III.',
            suggestion: 'Opções: 1) Aumentar pró-labore para atingir Fator R >= 28% (migrar para Anexo III); 2) Migrar para Lucro Presumido; 3) Avaliar estruturação com holding para otimizar distribuição.'
        }
    },
    {
        // Alerta quando Fator R está próximo de 28% (otimização possível)
        check: (data) => {
            const payroll = data.payrollExpenses || 0;
            const revenue = data.monthlyRevenue || 0;
            if (revenue === 0) return false;

            const fatorR = payroll / revenue;
            // Fator R entre 20% e 27% - próximo do limiar mas não atingindo
            return fatorR >= 0.20 && fatorR < 0.28;
        },
        alert: {
            type: 'opportunity',
            title: 'Fator R Próximo do Limiar de Otimização',
            description: `Seu Fator R está próximo de 28%, limiar que permite migrar atividades do Anexo V para o Anexo III no Simples Nacional. Um pequeno aumento no pró-labore pode gerar economia significativa.`,
            suggestion: 'Simule um aumento de pró-labore até atingir Fator R = 28%. Compare o custo do INSS adicional com a economia no DAS. Geralmente, a economia supera o custo adicional.'
        }
    },
    {
        // Recomendação de Holding Patrimonial para clientes de alta renda
        check: (data) => {
            const revenue = data.monthlyRevenue || 0;
            const partners = data.numberOfPartners || 1;
            const hasRealEstate = !!(data.documentsAsText || '').toLowerCase().match(/imóvel|aluguel|locação|imovel|locacao|patrimôn|patrimon/);

            // Gatilhos: alta renda OU múltiplos sócios OU menção a imóveis
            return revenue >= 80000 || partners >= 2 || hasRealEstate;
        },
        alert: {
            type: 'opportunity',
            title: 'Planejamento Patrimonial Recomendado',
            description: 'Seu perfil indica potencial benefício com Holding Patrimonial. Essa estrutura pode gerar economia significativa em: (1) ITCMD na sucessão (até 8% do patrimônio); (2) IRPF sobre rendimentos de aluguel (de 27,5% para ~11%).',
            suggestion: 'Acesse o módulo de Holding Patrimonial (/holding) para análise completa com simulação de economia em sucessão e rendimentos imobiliários.'
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
 * Executa regras de compliance COM os cenários calculados
 * Permite alertas baseados em comparação de cenários (ex: Anexo V vs LP)
 */
export function runComplianceRulesWithScenarios(
    inputData: any,
    calculatedScenarios: any[]
): Array<{
    type: 'danger' | 'warning' | 'info' | 'opportunity';
    title: string;
    description: string;
    suggestion?: string;
}> {
    // Combina input data com scenarios para análise completa
    const combinedData = {
        ...inputData,
        scenarios: calculatedScenarios
    };

    return runComplianceRules(combinedData);
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
