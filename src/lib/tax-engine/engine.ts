import { calculateSimplesNacional } from './calculators/simples-nacional';
import { calculateLucroPresumido, calculateLucroRealSimples } from './calculators/lucro-presumido-real';
import { calculateCarneLeao } from './calculators/carne-leao';
import { calculateCLT } from './calculators/clt';
import { calculateINSS, calculateIRRF, calculateCPP } from './calculators/payroll';
import { GenerateTaxScenariosInput, ScenarioDetail } from '@/ai/flows/types';
import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';
import { getISSFixoMensal } from '@/lib/iss-municipal-database';

/**
 * Orquestrador da Engine de Cálculo Tributário
 * Gera TODOS os 8 cenários para comparação completa:
 * 
 * PF (Pessoa Física):
 *  1. Carnê Leão
 *  2. CLT (simulação)
 * 
 * PJ (Pessoa Jurídica):
 *  3. Simples Nacional Anexo III (com Fator R otimizado)
 *  4. Simples Nacional Anexo V (sem otimização)
 *  5. Lucro Presumido (ISS variável)
 *  6. Lucro Presumido Uniprofissional (ISS Fixo)
 *  7. Lucro Presumido Equiparação Hospitalar
 *  8. Lucro Real
 */
export function generateDeterministicScenarios(input: GenerateTaxScenariosInput): ScenarioDetail[] {
    const scenarios: ScenarioDetail[] = [];
    const monthlyRevenue = input.monthlyRevenue || 0;
    const revenue12m = input.rbt12 || (monthlyRevenue * 12);
    const payroll = input.payrollExpenses || 0;
    const issRate = input.issRate || 5;
    const isHospitalar = input.isHospitalEquivalent || false;
    const isSup = input.isUniprofessionalSociety || false;
    const numberOfPartners = input.numberOfPartners || 1;
    const realProfitMargin = 0.30; // Margem de lucro estimada para Lucro Real

    const minimumWage = LEGAL_CONSTANTS_2025.minimumWage;
    const effectivePayroll = Math.max(payroll, minimumWage);

    // Fator R para Simples Nacional
    const fatorR = effectivePayroll / monthlyRevenue;
    const hasFatorR = fatorR >= 0.28;

    // ISS Fixo baseado no município (se disponível) ou padrão
    const issFixoMensal = getISSFixoMensal('') * numberOfPartners; // Usa padrão se não houver município

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

    // 3. Simples Nacional Anexo III (com Fator R otimizado)
    const targetPayrollFatorR = Math.max(monthlyRevenue * 0.28, minimumWage);
    const simplesAnexoIII = calculateSimplesNacional(revenue12m, monthlyRevenue, 'III');
    const inssFatorR = calculateINSS(targetPayrollFatorR);
    const irrfFatorR = calculateIRRF(targetPayrollFatorR - inssFatorR);
    const totalSimplesIII = simplesAnexoIII.totalTax + inssFatorR + irrfFatorR;

    scenarios.push({
        name: 'Simples Nacional Anexo III (Fator R)',
        scenarioCategory: 'pj',
        scenarioType: 'simples_anexo_iii',
        isEligible: hasFatorR,
        eligibilityNote: hasFatorR
            ? `Fator R atual: ${(fatorR * 100).toFixed(1)}% ≥ 28%. Elegível!`
            : `Fator R atual: ${(fatorR * 100).toFixed(1)}% < 28%. Requer pró-labore de R$ ${targetPayrollFatorR.toFixed(2)} para atingir 28%.`,
        totalTaxValue: totalSimplesIII,
        effectiveRate: (totalSimplesIII / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalSimplesIII - targetPayrollFatorR,
        notes: `Alíquota reduzida do Anexo III. Considera pró-labore de R$ ${targetPayrollFatorR.toFixed(2)} (28% da receita).`,
        proLaboreAnalysis: {
            baseValue: targetPayrollFatorR,
            inssValue: inssFatorR,
            irrfValue: irrfFatorR,
            netValue: targetPayrollFatorR - inssFatorR - irrfFatorR
        },
        taxBreakdown: [
            { name: 'DAS (Anexo III)', value: simplesAnexoIII.totalTax, rate: simplesAnexoIII.effectiveRate },
            { name: 'INSS Pró-labore', value: inssFatorR, rate: 0 },
            { name: 'IRRF Pró-labore', value: irrfFatorR, rate: 0 }
        ]
    });

    // 4. Simples Nacional Anexo V (sem otimização)
    const simplesAnexoV = calculateSimplesNacional(revenue12m, monthlyRevenue, 'V');
    const inssAnexoV = calculateINSS(minimumWage);
    const irrfAnexoV = calculateIRRF(minimumWage - inssAnexoV);
    const totalSimplesV = simplesAnexoV.totalTax + inssAnexoV + irrfAnexoV;

    scenarios.push({
        name: 'Simples Nacional Anexo V',
        scenarioCategory: 'pj',
        scenarioType: 'simples_anexo_v',
        isEligible: true,
        eligibilityNote: 'Alíquotas mais altas. Aplicável quando Fator R < 28% e não otimizado.',
        totalTaxValue: totalSimplesV,
        effectiveRate: (totalSimplesV / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalSimplesV - minimumWage,
        notes: `Pró-labore mínimo: R$ ${minimumWage.toFixed(2)} (1 salário mínimo).`,
        proLaboreAnalysis: {
            baseValue: minimumWage,
            inssValue: inssAnexoV,
            irrfValue: irrfAnexoV,
            netValue: minimumWage - inssAnexoV - irrfAnexoV
        },
        taxBreakdown: [
            { name: 'DAS (Anexo V)', value: simplesAnexoV.totalTax, rate: simplesAnexoV.effectiveRate },
            { name: 'INSS Pró-labore', value: inssAnexoV, rate: 0 },
            { name: 'IRRF Pró-labore', value: irrfAnexoV, rate: 0 }
        ]
    });

    // 5. Lucro Presumido (ISS variável)
    const lpGeral = calculateLucroPresumido(monthlyRevenue, 'Geral', issRate);
    const cppGeral = calculateCPP(minimumWage);
    const inssProLaboreLP = calculateINSS(minimumWage);
    const irrfProLaboreLP = calculateIRRF(minimumWage - inssProLaboreLP);
    const totalLPGeral = lpGeral.totalTax + cppGeral + inssProLaboreLP + irrfProLaboreLP;

    scenarios.push({
        name: 'Lucro Presumido',
        scenarioCategory: 'pj',
        scenarioType: 'presumido',
        isEligible: true,
        eligibilityNote: `Faturamento anual até R$ 78 milhões. ISS: ${issRate}%.`,
        totalTaxValue: totalLPGeral,
        effectiveRate: (totalLPGeral / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLPGeral - minimumWage,
        notes: 'Base de presunção 32% para serviços. Inclui CPP sobre pró-labore.',
        proLaboreAnalysis: {
            baseValue: minimumWage,
            inssValue: inssProLaboreLP,
            irrfValue: irrfProLaboreLP,
            netValue: minimumWage - inssProLaboreLP - irrfProLaboreLP
        },
        taxBreakdown: [
            { name: 'PIS/COFINS', value: lpGeral.breakdown.pis + lpGeral.breakdown.cofins, rate: 3.65 },
            { name: 'IRPJ/CSLL', value: lpGeral.breakdown.irpj + lpGeral.breakdown.csll, rate: 0 },
            { name: 'ISS', value: lpGeral.breakdown.iss, rate: issRate },
            { name: 'CPP Patronal', value: cppGeral, rate: 20 }
        ]
    });

    // 6. Lucro Presumido Uniprofissional (ISS Fixo)
    const lpSup = calculateLucroPresumido(monthlyRevenue, 'Geral', 0); // ISS = 0, vai somar fixo
    const totalLPSup = lpSup.totalTax + issFixoMensal + cppGeral + inssProLaboreLP + irrfProLaboreLP;
    const economiaISSFixo = lpGeral.breakdown.iss - issFixoMensal;

    scenarios.push({
        name: 'Lucro Presumido Uniprofissional (ISS Fixo)',
        scenarioCategory: 'pj',
        scenarioType: 'presumido_uniprofissional',
        isEligible: isSup,
        eligibilityNote: isSup
            ? 'Empresa cadastrada como Sociedade Uniprofissional. ISS Fixo aplicável.'
            : 'Requer registro como Sociedade Uniprofissional (SUP) no município. Consulte legislação local.',
        totalTaxValue: totalLPSup,
        effectiveRate: (totalLPSup / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLPSup - minimumWage,
        notes: `ISS Fixo: R$ ${issFixoMensal.toFixed(2)}/mês (${numberOfPartners} sócio(s)). Economia vs ISS variável: R$ ${economiaISSFixo.toFixed(2)}/mês.`,
        proLaboreAnalysis: {
            baseValue: minimumWage,
            inssValue: inssProLaboreLP,
            irrfValue: irrfProLaboreLP,
            netValue: minimumWage - inssProLaboreLP - irrfProLaboreLP
        },
        taxBreakdown: [
            { name: 'PIS/COFINS', value: lpSup.breakdown.pis + lpSup.breakdown.cofins, rate: 3.65 },
            { name: 'IRPJ/CSLL', value: lpSup.breakdown.irpj + lpSup.breakdown.csll, rate: 0 },
            { name: 'ISS Fixo (SUP)', value: issFixoMensal, rate: 0 },
            { name: 'CPP Patronal', value: cppGeral, rate: 20 }
        ]
    });

    // 7. Lucro Presumido Equiparação Hospitalar
    const lpHospitalar = calculateLucroPresumido(monthlyRevenue, 'Hospitalar', issRate);
    const totalLPHospitalar = lpHospitalar.totalTax + cppGeral + inssProLaboreLP + irrfProLaboreLP;

    scenarios.push({
        name: 'Lucro Presumido Equiparação Hospitalar',
        scenarioCategory: 'pj',
        scenarioType: 'presumido_hospitalar',
        isEligible: isHospitalar,
        eligibilityNote: isHospitalar
            ? 'Empresa atende requisitos ANVISA para equiparação hospitalar.'
            : 'Requer: estrutura cirúrgica, alvará sanitário, conformidade com Lei 9.249/95. Economia potencial significativa.',
        totalTaxValue: totalLPHospitalar,
        effectiveRate: (totalLPHospitalar / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLPHospitalar - minimumWage,
        notes: 'Base de presunção reduzida: IRPJ 8%, CSLL 12%. Requer documentação ANVISA.',
        proLaboreAnalysis: {
            baseValue: minimumWage,
            inssValue: inssProLaboreLP,
            irrfValue: irrfProLaboreLP,
            netValue: minimumWage - inssProLaboreLP - irrfProLaboreLP
        },
        taxBreakdown: [
            { name: 'PIS/COFINS', value: lpHospitalar.breakdown.pis + lpHospitalar.breakdown.cofins, rate: 3.65 },
            { name: 'IRPJ/CSLL (Reduzido)', value: lpHospitalar.breakdown.irpj + lpHospitalar.breakdown.csll, rate: 0 },
            { name: 'ISS', value: lpHospitalar.breakdown.iss, rate: issRate },
            { name: 'CPP Patronal', value: cppGeral, rate: 20 }
        ]
    });

    // 8. Lucro Real
    const lucroReal = calculateLucroRealSimples(monthlyRevenue, realProfitMargin, issRate);
    const totalLucroReal = lucroReal.totalTax + cppGeral + inssProLaboreLP + irrfProLaboreLP;

    scenarios.push({
        name: 'Lucro Real',
        scenarioCategory: 'pj',
        scenarioType: 'lucro_real',
        isEligible: true,
        eligibilityNote: 'Obrigatório para faturamento > R$ 78 milhões ou atividades específicas. Vantajoso se margem < 32%.',
        totalTaxValue: totalLucroReal,
        effectiveRate: (totalLucroReal / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLucroReal - minimumWage,
        notes: `Estimativa com margem de lucro de ${(realProfitMargin * 100).toFixed(0)}%. PIS/COFINS não-cumulativo (créditos limitados em serviços).`,
        proLaboreAnalysis: {
            baseValue: minimumWage,
            inssValue: inssProLaboreLP,
            irrfValue: irrfProLaboreLP,
            netValue: minimumWage - inssProLaboreLP - irrfProLaboreLP
        },
        taxBreakdown: [
            { name: 'PIS/COFINS (Não Cumulativo)', value: monthlyRevenue * 0.0925, rate: 9.25 },
            { name: 'IRPJ/CSLL (sobre lucro)', value: (monthlyRevenue * realProfitMargin) * 0.24, rate: 0 },
            { name: 'ISS', value: monthlyRevenue * (issRate / 100), rate: issRate },
            { name: 'CPP Patronal', value: cppGeral, rate: 20 }
        ]
    });

    // Ordenar por valor total de impostos (melhor primeiro)
    return scenarios.sort((a, b) => (a.totalTaxValue || 0) - (b.totalTaxValue || 0));
}
