import { calculateSimplesNacional } from './calculators/simples-nacional';
import { calculateLucroPresumido, calculateLucroRealSimples } from './calculators/lucro-presumido-real';
import { calculateCarneLeao } from './calculators/carne-leao';
import { calculateINSS, calculateIRRF, calculateCPP } from './calculators/payroll';
import { GenerateTaxScenariosInput, ScenarioDetail } from '@/ai/flows/types';
import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Orquestrador da Engine de Cálculo Tributário
 */
export function generateDeterministicScenarios(input: GenerateTaxScenariosInput): ScenarioDetail[] {
    const scenarios: ScenarioDetail[] = [];
    const monthlyRevenue = input.monthlyRevenue || 0;
    const revenue12m = input.rbt12 || (monthlyRevenue * 12); // Estimativa se não informado
    const payroll = input.payrollExpenses || 0;
    const issRate = input.issRate || 5; // Padrão conservador 5% se não informado
    const isHospitalar = input.isHospitalEquivalent || false;
    const isSup = input.isUniprofessionalSociety || false;

    // --- 1. Simples Nacional (Anexo III) ---
    // Regra: Fator R >= 28%
    const fatorR = payroll / monthlyRevenue;

    // Se Fator R já é >= 28%, é Anexo III direto.
    // Se for < 28%, podemos sugerir um Pro-Labore para atingir 28%.

    // Cenário 1.1: Simples Nacional (Situação Atual/Informada)
    const anexoAtual = fatorR >= 0.28 ? 'III' : 'V';
    const simplesAtual = calculateSimplesNacional(revenue12m, monthlyRevenue, anexoAtual);

    scenarios.push({
        name: `Simples Nacional - Anexo ${anexoAtual} (Fator R: ${(fatorR * 100).toFixed(2)}%)`,
        totalTaxValue: simplesAtual.totalTax,
        effectiveRate: simplesAtual.effectiveRate,
        netProfitDistribution: monthlyRevenue - simplesAtual.totalTax - payroll,
        notes: `Cálculo baseado no Fator R atual de ${(fatorR * 100).toFixed(2)}%.`,
        taxBreakdown: [
            { name: `DAS (Anexo ${anexoAtual})`, value: simplesAtual.totalTax, rate: simplesAtual.effectiveRate }
        ]
    });

    // Cenário 1.2: Simples Nacional Otimizado (com Pró-Labore Ajustado para Fator R 28%)
    if (fatorR < 0.28) {
        const targetPayroll = monthlyRevenue * 0.28;
        // O adicional é apenas o que falta para chegar em 28%. 
        // Se a folha já existe (ex: funcionários), o sócio só precisa complementar ou a própria folha ajuda.
        // Aqui assumimos que payrollExpenses é TOTAL (sócios + funcionários).
        const additionalPayrollNeeded = Math.max(0, targetPayroll - payroll);

        // Simples sempre será Anexo III com Fator R >= 28%
        const newSimples = calculateSimplesNacional(revenue12m, monthlyRevenue, 'III');

        // Custo do Pró-Labore Adicional (INSS Individual + IRRF)
        // O custo 'extra' para a empresa é zero de patronal no Anexo III.
        // Mas o sócio paga INSS e IRRF na pessoa física sobre esse pró-labore.
        // Considerando o cenário global (Sócio + Empresa), isso é um custo do arranjo.

        const inssCost = calculateINSS(targetPayroll); // INSS total sobre a nova folha de 28% (estimativa unificada)
        // Se já havia folha, teríamos que descontar o INSS que já era pago. Para simplificar, recalculamos sobre o target.

        const irrfCost = calculateIRRF(targetPayroll - inssCost);

        const totalTaxOtimizado = newSimples.totalTax + inssCost + irrfCost;

        scenarios.push({
            name: 'Simples Nacional - Anexo III (Otimizado com Fator R)',
            totalTaxValue: totalTaxOtimizado,
            effectiveRate: (totalTaxOtimizado / monthlyRevenue) * 100,
            netProfitDistribution: monthlyRevenue - totalTaxOtimizado - targetPayroll,
            notes: `Considera Folha de Pagamento total de R$ ${targetPayroll.toFixed(2)} (28% da receita) para reduzir anexo.`,
            proLaboreAnalysis: {
                baseValue: targetPayroll,
                inssValue: inssCost,
                irrfValue: irrfCost,
                netValue: targetPayroll - inssCost - irrfCost
            }
        });
    }

    // --- 2. Lucro Presumido ---

    // Cenário 2.1: Presumido Geral (32%)
    const lpGeral = calculateLucroPresumido(monthlyRevenue, 'Geral', issRate);
    // Adicionar INSS Patronal (20%) sobre a folha, pois LP paga.
    const cppGeral = calculateCPP(payroll);
    const totalLPGeral = lpGeral.totalTax + cppGeral;

    scenarios.push({
        name: 'Lucro Presumido (Serviços Gerais - 32%)',
        totalTaxValue: totalLPGeral,
        effectiveRate: (totalLPGeral / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLPGeral - payroll,
        notes: 'Inclui impostos federais, ISS e CPP (INSS Patronal) sobre a folha informada.',
        taxBreakdown: [
            { name: 'PIS/COFINS/IRPJ/CSLL', value: lpGeral.totalTax - lpGeral.breakdown.iss, rate: 11.33 },
            { name: 'ISS', value: lpGeral.breakdown.iss, rate: issRate },
            { name: 'INSS Patronal (CPP)', value: cppGeral, rate: 0 }
        ]
    });

    // Cenário 2.2: Equiparação Hospitalar
    const lpHospitalar = calculateLucroPresumido(monthlyRevenue, 'Hospitalar', issRate);
    const totalLPHospitalar = lpHospitalar.totalTax + cppGeral;

    const hospitalarScenario: ScenarioDetail = {
        name: 'Lucro Presumido - Equiparação Hospitalar',
        totalTaxValue: totalLPHospitalar,
        effectiveRate: (totalLPHospitalar / monthlyRevenue) * 100,
        netProfitDistribution: monthlyRevenue - totalLPHospitalar - payroll,
        notes: 'Requer cumprimento dos requisitos da ANVISA e Lei 9.249/95 (estrutura cirúrgica, etc).',
        taxBreakdown: [
            { name: 'Impostos Federais Reduzidos', value: lpHospitalar.totalTax - lpHospitalar.breakdown.iss, rate: 5.93 },
            { name: 'ISS', value: lpHospitalar.breakdown.iss, rate: issRate },
            { name: 'CPP', value: cppGeral, rate: 0 }
        ]
    };

    if (isHospitalar) {
        scenarios.push(hospitalarScenario);
    } else {
        scenarios.push({
            ...hospitalarScenario,
            name: 'Oportunidade: Equiparação Hospitalar (Se aplicável)'
        });
    }

    // Cenário 2.3: Sociedade Uniprofissional (ISS Fixo)
    if (isSup) {
        const issFixoEstimado = (input.numberOfPartners || 1) * 300;
        const lpSup = calculateLucroPresumido(monthlyRevenue, 'Geral', 0); // ISS 0
        const totalLPSup = lpSup.totalTax + issFixoEstimado + cppGeral;

        scenarios.push({
            name: 'Lucro Presumido - SUP (ISS Fixo)',
            totalTaxValue: totalLPSup,
            effectiveRate: (totalLPSup / monthlyRevenue) * 100,
            netProfitDistribution: monthlyRevenue - totalLPSup - payroll,
            notes: 'Considera ISS Fixo estimado por profissional (varia conforme município).',
            taxBreakdown: [
                { name: 'Impostos Federais', value: lpSup.totalTax, rate: 11.33 },
                { name: 'ISS Fixo', value: issFixoEstimado, rate: 0 },
                { name: 'CPP', value: cppGeral, rate: 0 }
            ]
        });
    }

    // --- 3. Carnê Leão (Pessoa Física) ---
    const cl = calculateCarneLeao(monthlyRevenue, payroll);
    scenarios.push({
        name: 'Pessoa Física (Carnê Leão)',
        totalTaxValue: cl.totalTax,
        effectiveRate: cl.effectiveRate,
        netProfitDistribution: monthlyRevenue - cl.totalTax - payroll,
        notes: 'Geralmente a opção mais onerosa. Válido apenas para faturamentos muito baixos.',
        taxBreakdown: [
            { name: 'INSS Autônomo (20%)', value: cl.breakdown.inss, rate: 0 },
            { name: 'IRPF (Tabela Progressiva)', value: cl.breakdown.irpf, rate: 0 }
        ]
    });

    return scenarios.sort((a, b) => (a.totalTaxValue || 0) - (b.totalTaxValue || 0));
}
