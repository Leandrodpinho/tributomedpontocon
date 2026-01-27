/**
 * Base de dados de ISS por município
 * 
 * Alíquotas e valores de ISS Fixo (Sociedade Uniprofissional) por cidade.
 * Fonte: Legislação municipal de cada cidade.
 * 
 * @fileOverview Centraliza alíquotas de ISS por município brasileiro.
 */

export interface ISSMunicipal {
    municipio: string;
    uf: string;
    issRate: number; // Alíquota padrão de ISS (%)
    issFixoPorProfissional: number; // Valor do ISS Fixo por profissional/ano para SUP
    legislacao?: string; // Referência da legislação
}

// Base de dados inicial - principais municípios de MG e capitais
export const ISS_DATABASE: Record<string, ISSMunicipal> = {
    // Minas Gerais
    'MONTES CLAROS': {
        municipio: 'Montes Claros',
        uf: 'MG',
        issRate: 4,
        issFixoPorProfissional: 119.71 * 12, // ~R$ 1.436,52/ano
        legislacao: 'CTM Montes Claros'
    },
    'BELO HORIZONTE': {
        municipio: 'Belo Horizonte',
        uf: 'MG',
        issRate: 5,
        issFixoPorProfissional: 350 * 12,
        legislacao: 'Lei Municipal 5.641/1989'
    },
    'UBERLANDIA': {
        municipio: 'Uberlândia',
        uf: 'MG',
        issRate: 5,
        issFixoPorProfissional: 320 * 12,
        legislacao: 'CTM Uberlândia'
    },
    'JUIZ DE FORA': {
        municipio: 'Juiz de Fora',
        uf: 'MG',
        issRate: 5,
        issFixoPorProfissional: 300 * 12,
        legislacao: 'CTM Juiz de Fora'
    },
    'CONTAGEM': {
        municipio: 'Contagem',
        uf: 'MG',
        issRate: 5,
        issFixoPorProfissional: 280 * 12,
        legislacao: 'CTM Contagem'
    },
    'BETIM': {
        municipio: 'Betim',
        uf: 'MG',
        issRate: 5,
        issFixoPorProfissional: 280 * 12,
        legislacao: 'CTM Betim'
    },
    'GOVERNADOR VALADARES': {
        municipio: 'Governador Valadares',
        uf: 'MG',
        issRate: 5,
        issFixoPorProfissional: 250 * 12,
        legislacao: 'CTM Gov. Valadares'
    },
    'IPATINGA': {
        municipio: 'Ipatinga',
        uf: 'MG',
        issRate: 5,
        issFixoPorProfissional: 280 * 12,
        legislacao: 'CTM Ipatinga'
    },

    // Capitais principais
    'SAO PAULO': {
        municipio: 'São Paulo',
        uf: 'SP',
        issRate: 5,
        issFixoPorProfissional: 300 * 12,
        legislacao: 'Lei Municipal 13.701/2003'
    },
    'RIO DE JANEIRO': {
        municipio: 'Rio de Janeiro',
        uf: 'RJ',
        issRate: 5,
        issFixoPorProfissional: 400 * 12,
        legislacao: 'CTM Rio de Janeiro'
    },
    'BRASILIA': {
        municipio: 'Brasília',
        uf: 'DF',
        issRate: 5,
        issFixoPorProfissional: 350 * 12,
        legislacao: 'Lei Complementar 687/2003'
    },
    'CURITIBA': {
        municipio: 'Curitiba',
        uf: 'PR',
        issRate: 5,
        issFixoPorProfissional: 320 * 12,
        legislacao: 'CTM Curitiba'
    },
    'PORTO ALEGRE': {
        municipio: 'Porto Alegre',
        uf: 'RS',
        issRate: 5,
        issFixoPorProfissional: 350 * 12,
        legislacao: 'CTM Porto Alegre'
    },
    'SALVADOR': {
        municipio: 'Salvador',
        uf: 'BA',
        issRate: 5,
        issFixoPorProfissional: 300 * 12,
        legislacao: 'CTM Salvador'
    },
    'FORTALEZA': {
        municipio: 'Fortaleza',
        uf: 'CE',
        issRate: 5,
        issFixoPorProfissional: 280 * 12,
        legislacao: 'CTM Fortaleza'
    },
    'RECIFE': {
        municipio: 'Recife',
        uf: 'PE',
        issRate: 5,
        issFixoPorProfissional: 300 * 12,
        legislacao: 'CTM Recife'
    },
};

// Valores padrão quando município não encontrado
export const ISS_DEFAULT: ISSMunicipal = {
    municipio: 'Padrão',
    uf: '',
    issRate: 5, // Alíquota máxima (conservador)
    issFixoPorProfissional: 300 * 12, // R$ 300/mês estimado
};

/**
 * Busca ISS de um município
 * @param municipio Nome do município (case insensitive)
 * @returns Dados de ISS do município ou valores padrão
 */
export function getISSMunicipal(municipio: string): ISSMunicipal {
    // Normaliza: remove acentos, uppercase
    const normalized = municipio
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    return ISS_DATABASE[normalized] || { ...ISS_DEFAULT, municipio };
}

/**
 * Calcula ISS Fixo mensal por profissional
 * @param municipio Nome do município
 * @returns Valor mensal do ISS Fixo
 */
export function getISSFixoMensal(municipio: string): number {
    const issData = getISSMunicipal(municipio);
    return issData.issFixoPorProfissional / 12;
}
