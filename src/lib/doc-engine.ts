
import { HoldingDiagnosisState } from "@/types/holding";
import { formatCurrency } from "@/lib/utils";

/**
 * Motor de Geração de Documentos Jurídicos (Drafts)
 * Transforma o Estado do Diagnóstico em Minutas Contratuais.
 */

export function generateFamilyProtocol(state: HoldingDiagnosisState): string {
    const { family, governance } = state;
    const patriarchs = family.filter(f => f.role === 'PATRIARCH' || f.role === 'MATRIARCH').map(f => f.name).join(' e ');
    const heirs = family.filter(f => f.role === 'HEIR').map(f => f.name).join(', ');

    return `
# PROTOCOLO FAMILIAR DA FAMÍLIA ${patriarchs.toUpperCase().split(' ')[0]}

**CONSIDERANDO** a necessidade de perpetuar o patrimônio construído por **${patriarchs}**;
**CONSIDERANDO** a intenção de profissionalizar a gestão e evitar conflitos futuros entre os herdeiros (${heirs});

ESTABELECEM as seguintes "Regras de Ouro":

## 1. DA ENTRADA DE AGREGADOS (GENROS E NORAS)
${governance.allowInLaws
            ? "Fica PERMITIDA a participação societária de cônjuges/companheiros dos herdeiros, desde que aprovada por unanimidade."
            : "Fica expressamente VEDADA a participação de cônjuges e companheiros (genros/noras) no quadro societário. Em caso de falecimento de sócio casado, seus herdeiros diretos assumem, sendo o cônjuge indenizado em dinheiro se houver direito à meação, jamais em quotas."}

## 2. DA RESOLUÇÃO DE CONFLITOS (MEDIAÇÃO)
${governance.forcedMediation
            ? "As partes concordam em submeter qualquer disputa a uma Câmara de Mediação e Arbitragem Privada, renunciando expressamente à Justiça Comum, visando sigilo e celeridade."
            : "As partes elegem o foro da Comarca da Sede para dirimir conflitos."}

## 3. DA VENDA DE ATIVOS IMOBILIÁRIOS
Para a alienação, oneração ou permuta de bens imóveis da sociedade, será necessária a aprovação de **${governance.saleApprovalRatio}% do Capital Social Votante**.

## 4. DA DISTRIBUIÇÃO DE LUCROS
A sociedade distribuirá, obrigatoriamente, o mínimo de **${governance.mandatoryDividend}% do Lucro Líquido** do exercício, salvo decisão unânime em contrário para reinvestimento.

## 5. DA GESTÃO E SUCESSÃO
Na ausência dos fundadores, a administração será exercida por:
${governance.managementSuccession === 'FAMILY' ? "- Pelo herdeiro mais velho, ou aquele designado em testamento." : ""}
${governance.managementSuccession === 'VOTE' ? "- Por administrador eleito pela maioria do capital social, podendo ser sócio ou não." : ""}
${governance.managementSuccession === 'PROFESSIONAL' ? "- Obrigatoriamente por um Gestor Profissional de mercado, não pertencente à família." : ""}

Local e Data: ______________________, 2026.
    `.trim();
}

export function generateAssetIntegrationList(state: HoldingDiagnosisState): string {
    return state.assets.map(asset => {
        return `
**BEM:** ${asset.name}
**TIPO:** ${asset.type === 'REAL_ESTATE' ? 'Imóvel' : 'Outro'}
**VALOR DE INTEGRALIZAÇÃO:** ${formatCurrency(asset.bookValue)} (Valor Histórico/IR)
**DESCRIÇÃO:** Integralizado pelo sócio [NOME], conforme matrícula/documento de origem.
        `.trim();
    }).join('\n\n');
}
