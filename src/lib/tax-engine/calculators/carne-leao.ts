import { calculateINSS, calculateIRRF } from './payroll';
import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Carnê-Leão (Pessoa Física)
 * Todas as receitas - Despesas Dedutíveis (Livro Caixa) = Base de Cálculo
 */
export function calculateCarneLeao(monthlyRevenue: number, deductibleExpenses: number = 0) {
    const taxableIncome = Math.max(0, monthlyRevenue - deductibleExpenses);

    // INSS Autônomo (20% sobre o teto ou sobre o rendimento, limitado ao teto)
    // Obrigatório recolher 20% sobre o salário de contribuição (limitado ao teto)
    const inssBase = Math.min(monthlyRevenue, LEGAL_CONSTANTS_2025.inssCeiling);
    const inss = inssBase * 0.20;

    // O INSS pago é dedutível da base de IR
    const irBase = taxableIncome - inss;
    const irpf = calculateIRRF(irBase);

    const totalTax = inss + irpf;

    return {
        totalTax,
        effectiveRate: (totalTax / monthlyRevenue) * 100,
        breakdown: {
            inss,
            irpf
        }
    };
}
