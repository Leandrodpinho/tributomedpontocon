/**
 * APIs Oficiais da Reforma Tributária
 * Fonte: Receita Federal e Gov.br
 */

export interface OfficialAPI {
    id: string;
    name: string;
    description: string;
    url: string;
    category: 'reforma' | 'consulta' | 'integracao';
    requiresCertificate: boolean;
    status: 'producao' | 'piloto' | 'beta';
    documentation?: string;
}

export const OFFICIAL_APIS: OfficialAPI[] = [
    // APIs da Reforma Tributária (CBS/IBS)
    {
        id: 'calculadora-cbs',
        name: 'Calculadora de Tributos - CBS/IBS',
        description: 'Motor de cálculo padrão que implementa as regras da Reforma Tributária do Consumo (CBS, IBS e Imposto Seletivo)',
        url: 'https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/calculadora/documentacao',
        category: 'reforma',
        requiresCertificate: true,
        status: 'piloto',
        documentation: 'https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/calculadora/documentacao',
    },
    {
        id: 'apuracao-cbs',
        name: 'API de Apuração Assistida da CBS',
        description: 'Consulta a apuração assistida da Contribuição sobre Bens e Serviços em formato JSON',
        url: 'https://piloto-cbs.tributos.gov.br',
        category: 'reforma',
        requiresCertificate: true,
        status: 'piloto',
    },
    {
        id: 'conformidade-facil',
        name: 'API Conformidade Fácil - Classificação Tributária',
        description: 'Tabelas de Classificação Tributária (CST/cClassTrib), indicadores operacionais e regras de validação',
        url: 'https://cff.svrs.rs.gov.br/api/v1/consultas/classTrib',
        category: 'integracao',
        requiresCertificate: true,
        status: 'producao',
    },

    // APIs Gov.br Conecta
    {
        id: 'consulta-cnpj',
        name: 'Consulta CNPJ',
        description: 'Retorna dados cadastrais de empresas da Receita Federal',
        url: 'https://www.gov.br/conecta/catalogo/',
        category: 'consulta',
        requiresCertificate: false,
        status: 'producao',
        documentation: 'https://www.gov.br/conecta/catalogo/',
    },
    {
        id: 'dctfweb-mit',
        name: 'APIs DCTFWeb / MIT',
        description: 'Automação de consulta de apuração de tributos e emissão de DARF',
        url: 'https://www.gov.br/receitafederal',
        category: 'integracao',
        requiresCertificate: true,
        status: 'producao',
    },
];

export const API_CATEGORIES = {
    reforma: {
        label: 'Reforma Tributária',
        description: 'APIs específicas para CBS, IBS e Imposto Seletivo',
        icon: 'zap',
    },
    consulta: {
        label: 'Consultas Públicas',
        description: 'APIs de consulta de dados cadastrais e públicos',
        icon: 'search',
    },
    integracao: {
        label: 'Integração Fiscal',
        description: 'APIs para integração com sistemas fiscais e contábeis',
        icon: 'link',
    },
};

export const INTEGRATION_TIPS = [
    {
        title: 'Autenticação',
        description: 'Muitas APIs exigem certificado digital ICP-Brasil ou credenciais pelo Portal do Contribuinte',
    },
    {
        title: 'Ambiente de Teste',
        description: 'APIs da Reforma (CBS/IBS) estão em produção restrita ou ambiente piloto',
    },
    {
        title: 'Segurança',
        description: 'Conexões TLS/SSL e boas práticas de segurança são obrigatórias',
    },
    {
        title: 'Certificado Digital',
        description: 'Necessário certificado ICP-Brasil válido para APIs da Receita Federal',
    },
];
