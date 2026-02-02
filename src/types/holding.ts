
export type MaritalRegime = 'COMUNHAO_TOTAL' | 'COMUNHAO_PARCIAL' | 'SEPARACAO_TOTAL' | 'PARTICIPACAO_FINAL' | 'UNIAO_ESTAVEL';

export interface FamilyMember {
    id: string;
    name: string;
    role: 'PATRIARCH' | 'MATRIARCH' | 'HEIR' | 'SPOUSE' | 'PARTNER'; // Partner = Sócio não familiar
    birthDate?: string;
    maritalRegime?: MaritalRegime;
    spouseName?: string;
    inConflict?: boolean; // Se há risco de conflito judicial
}

export type AssetType = 'REAL_ESTATE' | 'FINANCIAL' | 'VEHICLE' | 'COMPANY_QUOTA' | 'IP' | 'OTHER';

export interface Asset {
    id: string;
    name: string; // ex: "Apto Jardins", "Fazenda Sta Maria"
    type: AssetType;
    marketValue: number; // Valor de Mercado atual
    bookValue: number; // Valor no IR (Histórico)
    acquisitionDate?: string;
    rentalIncome?: number; // Renda mensal gerada
    deductibleExpenses?: number; // Despesas dedutíveis (IPTU/Condomínio se vacância)
    location?: string; // UF para ITCMD
}

export interface Liability {
    id: string;
    name: string; // ex: "Financiamento Imóvel", "Dívida Trabalhista"
    value: number;
    type: 'BANK' | 'FISCAL' | 'FAMILY' | 'LABOR';
    description?: string;
}

export interface HoldingDiagnosisState {
    family: FamilyMember[];
    assets: Asset[];
    liabilities: Liability[];
    step: number; // 1=Family, 2=Assets, 3=Report
}
