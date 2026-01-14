/**
 * Base de Conhecimento da Reforma Tributária
 * Fonte: LC 214/2025, LC 227/2026, EC 132/2023
 */

import type { ReformTimeline, DifferentiatedRegime, BasicBasketItem, CashbackRule } from '@/types/reform';

// Cronograma de implementação 2026-2033
export const REFORM_TIMELINE: ReformTimeline[] = [
    {
        year: 2026,
        phase: 'Ano-Teste',
        changes: [
            'Alíquotas de teste: CBS 0,9% e IBS 0,1%',
            'Registro informativo nas notas fiscais',
            'Valores compensáveis com PIS/Cofins',
            'Sem cobrança efetiva para contribuintes regulares'
        ],
        cbs_rate: 0.9,
        ibs_rate: 0.1
    },
    {
        year: 2027,
        phase: 'Extinção PIS/Cofins',
        changes: [
            'Entrada plena da CBS',
            'Extinção definitiva do PIS e Cofins',
            'Implementação do Imposto Seletivo',
            'Alíquota de IPI reduzida a zero (exceto ZFM)'
        ],
        cbs_rate: 12.0, // Estimativa
        ibs_rate: 0.1
    },
    {
        year: 2029,
        phase: 'Início da Transição ICMS/ISS',
        changes: [
            'Redução de 10% do ICMS e ISS',
            'Aumento proporcional do IBS',
            'Início do período de transição gradual'
        ],
        icms_reduction: 10,
        iss_reduction: 10
    },
    {
        year: 2030,
        phase: 'Transição 20%',
        changes: ['Redução de 20% do ICMS e ISS'],
        icms_reduction: 20,
        iss_reduction: 20
    },
    {
        year: 2031,
        phase: 'Transição 30%',
        changes: ['Redução de 30% do ICMS e ISS'],
        icms_reduction: 30,
        iss_reduction: 30
    },
    {
        year: 2032,
        phase: 'Transição 40%',
        changes: ['Redução de 40% do ICMS e ISS'],
        icms_reduction: 40,
        iss_reduction: 40
    },
    {
        year: 2033,
        phase: 'Modelo Final',
        changes: [
            'Vigência integral do IVA Dual',
            'Extinção total do ICMS e ISS',
            'Sistema completamente unificado',
            'Tributação 100% no destino'
        ],
        icms_reduction: 100,
        iss_reduction: 100
    }
];

// Regimes diferenciados
export const DIFFERENTIATED_REGIMES: DifferentiatedRegime[] = [
    {
        id: 'reducao-60',
        name: 'Redução de 60%',
        reduction_percentage: 60,
        description: 'Setores estratégicos com redução significativa da carga tributária',
        sectors: [
            'Educação',
            'Saúde',
            'Dispositivos médicos',
            'Medicamentos',
            'Insumos agropecuários',
            'Produções artísticas',
            'Atividades desportivas',
            'Comunicação institucional',
            'Bens e serviços relacionados à segurança e soberania nacional'
        ],
        examples: [
            'Escolas e universidades',
            'Hospitais e clínicas',
            'Fabricantes de equipamentos médicos',
            'Indústria farmacêutica',
            'Produtores rurais'
        ]
    },
    {
        id: 'reducao-30',
        name: 'Redução de 30%',
        reduction_percentage: 30,
        description: 'Profissionais liberais regulamentados',
        sectors: [
            'Advocacia',
            'Engenharia',
            'Arquitetura',
            'Medicina (autônomos)',
            'Contabilidade',
            'Outras profissões regulamentadas'
        ],
        examples: [
            'Escritórios de advocacia',
            'Consultórios médicos individuais',
            'Escritórios de engenharia',
            'Arquitetos autônomos'
        ]
    },
    {
        id: 'aliquota-zero',
        name: 'Alíquota Zero',
        reduction_percentage: 0,
        description: 'Isenção total de CBS e IBS',
        sectors: [
            'Cesta Básica Nacional (22 produtos)',
            'Transporte público coletivo',
            'Dispositivos para PcD',
            'Medicamentos para SUS',
            'Produtos agropecuários in natura',
            'Insumos agropecuários',
            'Alimentos destinados ao consumo humano',
            'Produtos de higiene pessoal e limpeza (cesta básica)'
        ],
        examples: [
            'Arroz, feijão, leite, carnes',
            'Ônibus urbanos',
            'Cadeiras de rodas',
            'Medicamentos do programa Farmácia Popular'
        ]
    }
];

// Cesta Básica Nacional
export const BASIC_BASKET: BasicBasketItem[] = [
    { name: 'Arroz', category: 'graos', tax_treatment: 'zero', description: 'Arroz em grãos' },
    { name: 'Feijões', category: 'graos', tax_treatment: 'zero', description: 'Todos os tipos de feijão' },
    { name: 'Leite fluido', category: 'laticinios', tax_treatment: 'zero', description: 'Leite pasteurizado e UHT' },
    { name: 'Leite em pó', category: 'laticinios', tax_treatment: 'zero', description: 'Leite em pó integral e desnatado' },
    { name: 'Queijos', category: 'laticinios', tax_treatment: 'zero', description: 'Queijos tipo minas, mussarela, prato' },
    { name: 'Farinha de trigo', category: 'graos', tax_treatment: 'zero', description: 'Farinha de trigo comum' },
    { name: 'Farinha de milho', category: 'graos', tax_treatment: 'zero', description: 'Fubá e farinha de milho' },
    { name: 'Farinha de mandioca', category: 'graos', tax_treatment: 'zero', description: 'Farinha de mandioca' },
    { name: 'Aveia', category: 'graos', tax_treatment: 'zero', description: 'Aveia em flocos' },
    { name: 'Carnes bovinas', category: 'proteinas', tax_treatment: 'zero', description: 'Cortes bovinos frescos e congelados' },
    { name: 'Carnes suínas', category: 'proteinas', tax_treatment: 'zero', description: 'Cortes suínos frescos e congelados' },
    { name: 'Aves', category: 'proteinas', tax_treatment: 'zero', description: 'Frango, chester, peru' },
    { name: 'Peixes', category: 'proteinas', tax_treatment: 'zero', description: 'Peixes frescos e congelados' },
    { name: 'Ovos', category: 'proteinas', tax_treatment: 'zero', description: 'Ovos de galinha' },
    { name: 'Açúcar', category: 'outros', tax_treatment: 'zero', description: 'Açúcar cristal e refinado' },
    { name: 'Sal', category: 'outros', tax_treatment: 'zero', description: 'Sal de cozinha' },
    { name: 'Café', category: 'outros', tax_treatment: 'zero', description: 'Café torrado e moído' },
    { name: 'Óleo de babaçu', category: 'outros', tax_treatment: 'zero', description: 'Óleo de babaçu' },
    { name: 'Pão francês', category: 'outros', tax_treatment: 'zero', description: 'Pão francês comum' },
    { name: 'Massas alimentícias', category: 'outros', tax_treatment: 'zero', description: 'Macarrão e massas' },
    { name: 'Hortaliças', category: 'hortifruti', tax_treatment: 'zero', description: 'Verduras e legumes frescos' },
    { name: 'Frutas', category: 'hortifruti', tax_treatment: 'zero', description: 'Frutas frescas nacionais' },

    // Redução de 60%
    { name: 'Crustáceos', category: 'proteinas', tax_treatment: 'reducao_60', description: 'Camarão, lagosta, siri' },
    { name: 'Óleo de soja', category: 'outros', tax_treatment: 'reducao_60', description: 'Óleo de soja refinado' },
    { name: 'Óleo de milho', category: 'outros', tax_treatment: 'reducao_60', description: 'Óleo de milho refinado' },
    { name: 'Sucos naturais', category: 'outros', tax_treatment: 'reducao_60', description: 'Sucos sem açúcar adicionado' }
];

// Regras de Cashback
export const CASHBACK_RULES: CashbackRule[] = [
    {
        product_category: 'Botijão de gás (até 13kg)',
        cbs_return: 100,
        ibs_return: 20,
        eligibility: 'Famílias CadÚnico com renda per capita até 1/2 salário mínimo'
    },
    {
        product_category: 'Energia elétrica',
        cbs_return: 100,
        ibs_return: 20,
        eligibility: 'Famílias CadÚnico com renda per capita até 1/2 salário mínimo'
    },
    {
        product_category: 'Água e esgoto',
        cbs_return: 100,
        ibs_return: 20,
        eligibility: 'Famílias CadÚnico com renda per capita até 1/2 salário mínimo'
    },
    {
        product_category: 'Gás natural',
        cbs_return: 100,
        ibs_return: 20,
        eligibility: 'Famílias CadÚnico com renda per capita até 1/2 salário mínimo'
    },
    {
        product_category: 'Demais produtos e serviços',
        cbs_return: 20,
        ibs_return: 20,
        eligibility: 'Famílias CadÚnico com renda per capita até 1/2 salário mínimo'
    }
];

// Conceitos-chave
export const KEY_CONCEPTS = {
    iva_dual: {
        title: 'IVA Dual',
        description: 'Sistema de Imposto sobre Valor Agregado composto por CBS (federal) e IBS (estadual/municipal)',
        components: ['CBS - Contribuição sobre Bens e Serviços', 'IBS - Imposto sobre Bens e Serviços']
    },

    cbs: {
        title: 'CBS - Contribuição sobre Bens e Serviços',
        description: 'Tributo federal que substitui PIS, Cofins e IPI',
        competencia: 'União',
        substitui: ['PIS', 'Cofins', 'IPI'],
        vigencia_plena: 2027
    },

    ibs: {
        title: 'IBS - Imposto sobre Bens e Serviços',
        description: 'Tributo compartilhado que substitui ICMS e ISS',
        competencia: 'Estados e Municípios',
        substitui: ['ICMS', 'ISS'],
        vigencia_plena: 2033,
        gestao: 'CGIBS - Comitê Gestor do IBS'
    },

    split_payment: {
        title: 'Split Payment (Pagamento Dividido)',
        description: 'Sistema que separa automaticamente o imposto no momento da transação bancária',
        funcionamento: 'O banco retém o valor do imposto e envia ao Fisco, entregando apenas o líquido ao vendedor',
        impacto: 'Elimina o "float financeiro" - empresas não poderão mais usar o valor do imposto como capital de giro'
    },

    creditamento_amplo: {
        title: 'Crédito Financeiro Amplo',
        description: 'Permite creditamento sobre qualquer aquisição de bens ou serviços usados na atividade econômica',
        diferenca: 'Antes: crédito "físico" restrito. Agora: crédito sobre tudo que foi usado na operação',
        vedacoes: ['Uso pessoal', 'Joias', 'Bebidas alcoólicas', 'Tabaco', 'Armas', 'Serviços estéticos']
    },

    imposto_seletivo: {
        title: 'Imposto Seletivo ("Imposto do Pecado")',
        description: 'Tributo sobre produtos prejudiciais à saúde ou meio ambiente',
        incide_sobre: [
            'Cigarros e derivados do tabaco',
            'Bebidas alcoólicas',
            'Bebidas açucaradas',
            'Veículos poluentes',
            'Extração de minério e petróleo',
            'Apostas (bets)'
        ]
    }
};
