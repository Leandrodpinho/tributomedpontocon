import { calculateINSS, calculateIRRF, calculateCPP } from './payroll';
import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Simulação CLT (para comparação)
 * Calcula os custos totais de atuar como CLT para fins de comparação
 * - Empregado: INSS + IRRF descontados do salário
 * - Empregador: INSS Patronal (20%) + FGTS (8%) + RAT (1%)
 */
export function calculateCLT(monthlyRevenue: number) {
    // Premissa: o profissional seria contratado com salário bruto = receita atual
    const salarioBruto = monthlyRevenue;

    // 1. Descontos do Empregado
    const inssEmpregado = calculateINSS(salarioBruto);
    const baseIRRF = salarioBruto - inssEmpregado;
    const irrfEmpregado = calculateIRRF(baseIRRF);

    // Valor líquido para o trabalhador
    const salarioLiquido = salarioBruto - inssEmpregado - irrfEmpregado;

    // 2. Encargos do Empregador
    const inssPatronal = calculateCPP(salarioBruto); // 20%
    const fgts = salarioBruto * 0.08; // 8%
    const rat = salarioBruto * 0.01; // 1% (RAT mínimo)
    const terceiros = salarioBruto * 0.058; // 5,8% (Sistema S estimado)

    const encargosEmpregador = inssPatronal + fgts + rat + terceiros;

    // Custo total para a empresa contratar esse profissional
    const custoTotalEmpresa = salarioBruto + encargosEmpregador;

    // 3. Imposto "efetivo" = tudo que não fica com o trabalhador
    // Taxas retidas do empregado + encargos pagos pelo empregador
    const totalTax = inssEmpregado + irrfEmpregado + encargosEmpregador;

    return {
        totalTax,
        effectiveRate: (totalTax / monthlyRevenue) * 100,
        salarioLiquido,
        custoTotalEmpresa,
        breakdown: {
            inssEmpregado,
            irrfEmpregado,
            inssPatronal,
            fgts,
            rat,
            terceiros
        }
    };
}
