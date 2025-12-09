
interface BrasilApiCnpjResponse {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    cnae_fiscal_descricao: string;
    cnaes_secundarios: Array<{ codigo: number; descricao: string }>;
    logradouro: string;
    numero: string;
    municipio: string;
    uf: string;
}

export async function fetchCnpjData(cnpj: string) {
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
        return {
            companyName: data.nome_fantasia || data.razao_social,
            cnaes: [data.cnae_fiscal_descricao, ...data.cnaes_secundarios.map(c => c.descricao)].slice(0, 5).join(', '),
            address: `${data.logradouro}, ${data.numero} - ${data.municipio}/${data.uf}`
        };
    } catch (error) {
        console.error('CNPJ Fetch Error:', error);
        throw error;
    }
}
