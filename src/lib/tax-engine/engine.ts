import { calculateSimplesNacional, calculateMixedSimples } from './calculators/simples-nacional';
import { calculateLucroPresumido, calculateMixedPresumido, calculateLucroRealSimples } from './calculators/lucro-presumido-real';
import { calculateCarneLeao } from './calculators/carne-leao';
import { calculateCLT } from './calculators/clt';
import { calculateINSS, calculateIRRF, calculateCPP } from './calculators/payroll';
import { calculateMEI } from './calculators/mei';
import { GenerateTaxScenariosInput, ScenarioDetail } from '@/ai/flows/types';
import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';
import { getISSFixoMensal } from '@/lib/iss-municipal-database';

/**
 * Orquestrador da Engine de Cálculo Tributário
 * Gera TODOS os cenários para comparação completa:
 * 
 * PF (Pessoa Física):
 *  1. Carnê Leão
 *  2. CLT (simulação)
 * 
 * PJ (Pessoa Jurídica):
 *  3. MEI (Microempreendedor Individual)
 *  4. Simples Nacional (Misto/Segregado)
 *  5. Simples Nacional Anexo V (sem otimização)
 *  6. Lucro Presumido (Misto/Segregado)
 *  7. Lucro Presumido Uniprofissional (ISS Fixo)
 *  8. Lucro Presumido Equiparação Hospitalar
 *  9. Lucro Real
 */
export function generateDeterministicScenarios(input: GenerateTaxScenariosInput): ScenarioDetail[] {
    const scenarios: ScenarioDetail[] = [];

    // Normalização da Entrada (compatibilidade com versões anteriores)
    let activities = input.activities || [];
    let monthlyRevenue = input.monthlyRevenue || 0;

    // Se 'monthlyRevenue' foi passado mas 'activities' não, cria uma atividade padrão de Serviço Anexo III
    if (activities.length === 0 && monthlyRevenue > 0) {
        activities = [{
            name: 'Serviços Gerais',
            revenue: monthlyRevenue,
            type: 'service',
            simplesAnexo: 'III',
            isMeiEligible: true // Assume elegível por padrão se não especificado
        }];
    } else if (activities.length > 0) {
        // Recalcula monthlyRevenue com base nas atividades
        monthlyRevenue = activities.reduce((sum, a) => sum + a.revenue, 0);
    }

    const revenue12m = input.rbt12 || (monthlyRevenue * 12);
    const payroll = input.payrollExpenses || 0;
    const issRate = input.issRate || 5;
    const isHospitalar = input.isHospitalEquivalent || false;
    const isSup = input.isUniprofessionalSociety || false;
    const numberOfPartners = input.numberOfPartners || 1;
    const realProfitMargin = 0.30; // Margem de lucro estimada para Lucro Real

    const minimumWage = LEGAL_CONSTANTS_2025.minimumWage;
    const effectivePayroll = Math.max(payroll, minimumWage);

    // Fator R para Simples Nacional (Calculado Globalmente)
    const fatorR = effectivePayroll / monthlyRevenue;
    const hasFatorR = fatorR >= 0.28;

    // ISS Fixo baseado no município
    const issFixoMensal = getISSFixoMensal('') * numberOfPartners;

    // ============================================================
    // CENÁRIOS PF (PESSOA FÍSICA)
    // ============================================================

    // 1. Carnê Leão
    const cl = calculateCarneLeao(monthlyRevenue, payroll);
    scenarios.push({
        name: 'Carnê Leão (Pessoa Física)',
        scenarioCategory: 'pf',
        scenarioType: 'carne_leao',
        isEligible: true,
        eligibilityNote: 'Disponível para qualquer profissional autônomo.',
        totalTaxValue: cl.totalTax,
        effectiveRate: cl.effectiveRate,
        netProfitDistribution: monthlyRevenue - cl.totalTax - payroll,
        notes: 'INSS Autônomo 20% + IRPF progressivo. Geralmente a opção mais onerosa.',
        taxBreakdown: [
            { name: 'INSS Autônomo (20%)', value: cl.breakdown.inss, rate: 20 },
            { name: 'IRPF Progressivo', value: cl.breakdown.irpf, rate: 0 }
        ]
    });

    // 2. CLT (Simulação)
    const clt = calculateCLT(monthlyRevenue);
    scenarios.push({
        name: 'CLT (Simulação como Empregado)',
        scenarioCategory: 'pf',
        scenarioType: 'clt',
        isEligible: true,
        eligibilityNote: 'Para comparação: caso fosse contratado como empregado.',
        totalTaxValue: clt.totalTax,
        effectiveRate: clt.effectiveRate,
        netProfitDistribution: clt.salarioLiquido,
        notes: `Custo total para empresa: R$ ${clt.custoTotalEmpresa.toFixed(2)}. Inclui INSS, FGTS e RAT.`,
        taxBreakdown: [
            { name: 'INSS (Empregado)', value: clt.breakdown.inssEmpregado, rate: 0 },
            { name: 'IRRF', value: clt.breakdown.irrfEmpregado, rate: 0 },
            { name: 'INSS Patronal', value: clt.breakdown.inssPatronal, rate: 20 },
            { name: 'FGTS + RAT', value: clt.breakdown.fgts + clt.breakdown.rat, rate: 9 }
        ]
    });

    // ============================================================
    // CENÁRIOS PJ (PESSOA JURÍDICA)
    // ============================================================

    // 3. MEI (Microempreendedor Individual)
    // Passamos RBT12 (receita anual projetada) para checar o limite de 81k
    const mei = calculateMEI(revenue12m > 0 ? revenue12m : monthlyRevenue * 12, activities);

    // SEMPRE adicionamos o MEI para fins didáticos, mesmo se inelegível
    scenarios.push({
        name: 'MEI - Microempreendedor Individual',
        scenarioCategory: 'pj',
        scenarioType: 'mei',
        isEligible: mei.isEligible,
        eligibilityNote: mei.eligibilityNote,
        totalTaxValue: mei.totalTax,
        effectiveRate: (mei.totalTax / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - mei.totalTax,
        notes: mei.isEligible
            ? 'Pagamento fixo mensal (DAS-MEI). Não requer contador obrigatório, mas recomendado.'
            : 'Este regime seria o mais barato, mas a empresa não se enquadra (ver motivo acima).',
        taxBreakdown: [
            { name: 'INSS (Fixo)', value: mei.breakdown.inss, rate: 0 },
            { name: 'ICMS (Fixo)', value: mei.breakdown.icms, rate: 0 },
            { name: 'ISS (Fixo)', value: mei.breakdown.iss, rate: 0 }
        ]
    });

    // 4. Simples Nacional (Segregação de Receitas)
    // Calcula o tributo para CADA atividade usando o anexo correto, mas com alíquota baseada na RBT12 Global
    // Se a atividade for Anexo V, verificamos o Fator R global. Se >= 28%, muda para Anexo III.
    // Se a atividade for Anexo III, verificamos o Fator R global. Se < 28%, muda para Anexo V (Fator R reverso). 
    // NOTA: A regra do "Fator R Reverso" (III -> V) é complexa. A regra geral é: Atividades do Anexo V sujeitas ao Fator R podem ir pro III.
    // Atividades originalmente do III NÃO vão para o V.
    // Vamos simplificar: Trataremos a troca V -> III se Fator R ok.

    const adjustedActivities = activities.map(act => {
        let targetAnexo = act.simplesAnexo;
        if (targetAnexo === 'V' && hasFatorR) {
            targetAnexo = 'III'; // Bonificação Fator R
        }
        return {
            revenue: act.revenue,
            simplesAnexo: targetAnexo
        };
    });

    const targetPayrollFatorR = Math.max(monthlyRevenue * 0.28, minimumWage); // Pró-labore ideal
    const inssProLaboreSimples = calculateINSS(targetPayrollFatorR);
    const irrfProLaboreSimples = calculateIRRF(targetPayrollFatorR - inssProLaboreSimples);

    const simplesMisto = calculateMixedSimples(revenue12m, adjustedActivities);
    const totalSimplesMisto = simplesMisto.totalTax + inssProLaboreSimples + irrfProLaboreSimples;

    // Constrói breakdown detalhado do Simples
    const simplesBreakdown = simplesMisto.breakdown.map(b => ({
        name: `DAS Anexo ${b.anexo}`,
        value: b.tax,
        rate: b.rate
    }));

    // Adiciona encargos do pró-labore
    simplesBreakdown.push({ name: 'INSS Pró-labore', value: inssProLaboreSimples, rate: 0 });
    simplesBreakdown.push({ name: 'IRRF Pró-labore', value: irrfProLaboreSimples, rate: 0 });

    // Verificação real de Misto/Segregado
    const uniqueAnexos = new Set(adjustedActivities.map(a => a.simplesAnexo));
    const isSimplesMisto = uniqueAnexos.size > 1;
    const simplesName = isSimplesMisto
        ? 'Simples Nacional (Misto/Segregado)'
        : `Simples Nacional (Anexo ${[...uniqueAnexos][0] || 'III'})`;

    scenarios.push({
        name: simplesName,
        scenarioCategory: 'pj',
        scenarioType: isSimplesMisto ? 'simples_misto' : `simples_anexo_${([...uniqueAnexos][0] || 'iii').toLowerCase()}` as any,
        isEligible: true,
        eligibilityNote: hasFatorR
            ? `Fator R: ${(fatorR * 100).toFixed(1)}%. Atividades do Anexo V beneficiadas.`
            : `Fator R: ${(fatorR * 100).toFixed(1)}%. Aumente o pró-labore para reduzir imposto do Anexo V (se houver).`,
        totalTaxValue: totalSimplesMisto,
        effectiveRate: (totalSimplesMisto / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalSimplesMisto - targetPayrollFatorR,
        notes: `Cálculo com segregação de receitas. Considera pró-labore de R$ ${targetPayrollFatorR.toFixed(2)}.`,
        proLaboreAnalysis: {
            baseValue: targetPayrollFatorR,
            inssValue: inssProLaboreSimples,
            irrfValue: irrfProLaboreSimples,
            netValue: targetPayrollFatorR - inssProLaboreSimples - irrfProLaboreSimples
        },
        taxBreakdown: simplesBreakdown
    });

    // 5. Lucro Presumido Misto
    // Calcula PIS/COFINS/IRPJ/CSLL considerando as bases corretas (Serviço=32%, Comércio=8%)
    const lpMisto = calculateMixedPresumido(activities, issRate);

    const cppGeral = calculateCPP(minimumWage);
    const inssProLaboreLP = calculateINSS(minimumWage);
    const irrfProLaboreLP = calculateIRRF(minimumWage - inssProLaboreLP);

    const totalLPMisto = lpMisto.totalTax + cppGeral + inssProLaboreLP + irrfProLaboreLP;

    // Lógica correta para "Misto" no Lucro Presumido
    const hasService = activities.some(a => a.type === 'service');
    const hasCommerceOrIndustry = activities.some(a => a.type === 'commerce' || a.type === 'industry');
    const isPresumidoMisto = hasService && hasCommerceOrIndustry;
    const presumidoName = isPresumidoMisto ? 'Lucro Presumido (Misto)' : 'Lucro Presumido';

    scenarios.push({
        name: presumidoName,
        scenarioCategory: 'pj',
        scenarioType: 'presumido',
        isEligible: true,
        eligibilityNote: `Faturamento anual até R$ 78 milhões.`,
        totalTaxValue: totalLPMisto,
        effectiveRate: (totalLPMisto / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLPMisto - minimumWage,
        notes: 'Base de presunção ajustada por atividade (32% Serviços, 8% Comércio).',
        proLaboreAnalysis: {
            baseValue: minimumWage,
            inssValue: inssProLaboreLP,
            irrfValue: irrfProLaboreLP,
            netValue: minimumWage - inssProLaboreLP - irrfProLaboreLP
        },
        taxBreakdown: [
            { name: 'PIS/COFINS', value: lpMisto.breakdown.pis + lpMisto.breakdown.cofins, rate: 3.65 },
            { name: 'IRPJ/CSLL', value: lpMisto.breakdown.irpj + lpMisto.breakdown.csll, rate: 0 },
            { name: 'ISS/ICMS', value: lpMisto.breakdown.iss + lpMisto.breakdown.icms, rate: 0 },
            { name: 'CPP Patronal', value: cppGeral, rate: 20 }
        ]
    });

    // 6. Lucro Real (Simplificado)
    const lucroReal = calculateLucroRealSimples(monthlyRevenue, realProfitMargin, issRate);
    const totalLucroReal = lucroReal.totalTax + cppGeral + inssProLaboreLP + irrfProLaboreLP;

    scenarios.push({
        name: 'Lucro Real (Estimado)',
        scenarioCategory: 'pj',
        scenarioType: 'lucro_real',
        isEligible: true,
        eligibilityNote: 'Obrigatório para faturamento > R$ 78 milhões ou atividades específicas.',
        totalTaxValue: totalLucroReal,
        effectiveRate: (totalLucroReal / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLucroReal - minimumWage,
        notes: `Estimativa com margem de lucro de ${(realProfitMargin * 100).toFixed(0)}%.`,
        proLaboreAnalysis: {
            baseValue: minimumWage,
            inssValue: inssProLaboreLP,
            irrfValue: irrfProLaboreLP,
            netValue: minimumWage - inssProLaboreLP - irrfProLaboreLP
        },
        taxBreakdown: [
            { name: 'PIS/COFINS', value: monthlyRevenue * 0.0925, rate: 9.25 },
            { name: 'IRPJ/CSLL', value: (monthlyRevenue * realProfitMargin) * 0.24, rate: 0 },
            { name: 'ISS/ICMS', value: monthlyRevenue * (issRate / 100), rate: issRate }, // Simplificação
            { name: 'CPP Patronal', value: cppGeral, rate: 20 }
        ]
    });

    // Ordenar por valor total de impostos (melhor primeiro)
    return scenarios.sort((a, b) => (a.totalTaxValue || 0) - (b.totalTaxValue || 0));
}
