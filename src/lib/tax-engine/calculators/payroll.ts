import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calcula o INSS a descontar do salário/pró-labore (Tabela Progressiva)
 */
export function calculateINSS(salary: number): number {
    // Teto do INSS
    if (salary > LEGAL_CONSTANTS_2025.inssCeiling) {
        return 908.85; // Teto fixo 2024/2025 aproximado (14% sobre teto progressivo)
        // Cálculo exato sobre o teto:
        // return calculateProgressiveINSS(LEGAL_CONSTANTS_2025.inssCeiling);
    }
    return calculateProgressiveINSS(salary);
}

function calculateProgressiveINSS(base: number): number {
    const table = LEGAL_CONSTANTS_2025.inssTable;

    // Cálculo simplificado usando dedução
    // Imposto = (Base * Alíquota) - Dedução
    const bracket = table.find(b => base <= b.limit) || table[table.length - 1];
    return (base * bracket.rate) - bracket.deduction;
}

/**
 * Calcula o IRPF Mensal (Tabela Progressiva)
 */
export function calculateIRRF(base: number, dependents: number = 0): number {
    const table = LEGAL_CONSTANTS_2025.irpfTable;

    // Dedução por dependente
    const dependentDeduction = dependents * LEGAL_CONSTANTS_2025.standardDeductionPerDependent;

    // Base de cálculo = Salário Bruto - INSS - Dependentes
    // Nota: O cálculo exato do IRRF depende do INSS pago.
    // Esta função assume que 'base' JÁ É a base de cálculo líquida de INSS

    if (base <= table[0].limit) return 0;

    const bracket = table.find(b => base <= b.limit) || table[table.length - 1];

    // Comparar desconto legal vs desconto simplificado
    const legalTax = (base * bracket.rate) - bracket.deduction - dependentDeduction;

    // Se o desconto simplificado for mais vantajoso (para quem ganha pouco acima da isenção), usa-se ele na declaração anual, 
    // mas na fonte (mensal) a regra é estrita. Vamos usar a regra padrão mensal.

    return Math.max(0, legalTax);
}

/**
 * Calcula o Custo da Folha para a Empresa (CPP)
 * No Simples (Anexo III) CPP está incluso. No Anexo V ou Lucro Presumido/Real, paga-se 20% patronal.
 */
export function calculateCPP(salary: number): number {
    return salary * 0.20; // 20% Patronal Básico
}
