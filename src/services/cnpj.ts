
import { getISSMunicipal, getISSFixoMensal } from '@/lib/iss-municipal-database';

interface BrasilApiCnpjResponse {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    cnae_fiscal: number;
    cnae_fiscal_descricao: string;
    cnaes_secundarios: Array<{ codigo: number; descricao: string }>;
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
}

export interface CnpjData {
    companyName: string;
    cnaes: string;
    cnaeCodigos: string[];
    cnaePrincipal: {
        codigo: string;
        descricao: string;
    };
    address: string;
    municipio: string;
    uf: string;
    issRate: number;
    issFixoMensal: number;
}

export async function fetchCnpjData(cnpj: string): Promise<CnpjData> {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos.');
    }

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

        if (!response.ok) {
            if (response.status === 404) throw new Error('CNPJ não encontrado.');
            if (response.status === 429) throw new Error('Muitas requisições. Tente novamente em instantes.');
            throw new Error('Erro ao consultar CNPJ.');
        }

        const data: BrasilApiCnpjResponse = await response.json();

        // Buscar ISS do município
        const issData = getISSMunicipal(data.municipio);

        // Formata código CNAE no padrão XX.XX-X/XX
        const formatCnae = (codigo: number): string => {
            const str = codigo.toString().padStart(7, '0');
            return `${str.slice(0, 2)}${str.slice(2, 4)}-${str.slice(4, 5)}/${str.slice(5, 7)}`;
        };

        // Monta lista de códigos CNAE
        const cnaeCodigos = [
            formatCnae(data.cnae_fiscal),
            ...data.cnaes_secundarios.map(c => formatCnae(c.codigo))
        ];

        return {
            companyName: data.nome_fantasia || data.razao_social,
            cnaes: [data.cnae_fiscal_descricao, ...data.cnaes_secundarios.map(c => c.descricao)].slice(0, 5).join(', '),
            cnaeCodigos,
            cnaePrincipal: {
                codigo: formatCnae(data.cnae_fiscal),
                descricao: data.cnae_fiscal_descricao
            },
            address: `${data.logradouro}, ${data.numero} - ${data.municipio}/${data.uf}`,
            municipio: data.municipio,
            uf: data.uf,
            issRate: issData.issRate,
            issFixoMensal: getISSFixoMensal(data.municipio)
        };
    } catch (error) {
        console.error('CNPJ Fetch Error:', error);
        throw error;
    }
}
