# PRD - TributoMed: Planejador Tributário Inteligente

## 1. VISÃO DO PRODUTO
Plataforma SaaS multi-módulo para contadores realizarem planejamento tributário
e patrimonial inteligente para diferentes nichos de clientes, com simulações
automatizadas, comparativos de regimes e geração de relatórios executivos.

## 2. OBJETIVOS
- Permitir simulação tributária completa para múltiplos perfis de clientes
- Automatizar cálculos complexos de impostos (IRPF, IRPJ, ISS, ICMS, Funrural, etc.)
- Gerar relatórios profissionais para apresentação ao cliente final
- Comparar cenários entre regimes tributários (Simples, Presumido, Real, MEI)
- Integrar análise de Reforma Tributária e impacto futuro
- Suporte a Holding Patrimonial com projeção sucessória

## 3. PERSONAS

### 3.1 Persona Primária: Contador
- Atende múltiplos perfis de clientes (médicos, empresários, produtores rurais)
- Precisa de agilidade para gerar simulações em reuniões
- Busca ferramenta que impressione o cliente e feche contratos
- Valoriza precisão nos cálculos e embasamento legal

### 3.2 Perfis de Clientes (determinam o módulo a usar)
| Perfil | Módulo | Especificidades |
|--------|--------|-----------------|
| Médicos/Dentistas/Clínicas | Saúde & Clínicas | Carnê Leão, SUP, Equiparação Hospitalar |
| Empresários Patrimoniais | Holding Patrimonial | Sucessão, ITCMD, Governança Familiar |
| Produtores Rurais | Produtor Rural | Funrural, ITR, LCDPR, Contratos Agrários |
| TI/Advocacia/Engenharia | Serviços & Tech | Fator R, ISS Fixo, Pró-Labore |
| Comércio/Postos | Varejo & Postos | ICMS-ST, Monofásico, Margem de Bomba |

## 4. FUNCIONALIDADES CORE

### 4.1 Hub de Módulos (Landing)
- Seletor visual de módulo por perfil do cliente
- Navegação intuitiva entre nichos
- Cards com descrição de cada especialidade

### 4.2 Módulo Saúde & Clínicas
**Formulário de Análise:**
- Dados do cliente (nome, CNPJ/CPF)
- Faturamento mensal
- Despesas com folha de pagamento
- Taxa de ISS municipal
- Número de sócios
- Margem de lucro real (para Lucro Real)
- Flag: Equiparação Hospitalar
- Flag: Sociedade Uniprofissional (SUP)
- Upload de documentos (PDF, Excel)

**Cenários Gerados (9 comparativos):**
1. Carnê Leão (PF)
2. CLT (simulação comparativa)
3. MEI (se aplicável)
4. Simples Nacional (Anexo III ou V)
5. Simples Nacional Misto
6. Lucro Presumido
7. Lucro Presumido SUP (ISS Fixo)
8. Lucro Presumido Equiparação Hospitalar
9. Lucro Real

**Dashboard de Resultados:**
- KPIs principais (economia, melhor cenário)
- Gráfico comparativo de cenários
- Breakdown de impostos por cenário
- Análise de impacto IRPF do sócio
- Linha do tempo mensal
- Geração de PDF/DOCX
- Apresentação executiva para cliente

### 4.3 Módulo Holding Patrimonial
**Wizard de 5 Etapas:**
1. **Família**: Mapeamento de membros, herdeiros, relações
2. **Inventário**: Cadastro de ativos (imóveis, veículos, investimentos)
3. **Governança**: Regras do protocolo familiar (voto, dividendos, venda)
4. **Compliance**: Due Diligence (dívidas, certidões, riscos ambientais)
5. **Relatório Final**: Diagnóstico, projeção financeira, minutas jurídicas

**Cálculos Automáticos:**
- Gap Sucessório (valor mercado vs. contábil)
- ITCMD economia (doação vs. inventário)
- Economia IR aluguel (holding vs. PF)
- Projeção de patrimônio (10 anos)
- DRE da Holding

**Geração de Documentos:**
- Protocolo Familiar (minuta)
- Lista de Integralização de Capital
- Dossiê para impressão

### 4.4 Módulo Produtor Rural
**Abas de Funcionalidade:**

**Aba 1 - Análise de Safra:**
- Receita bruta de vendas
- Custeio (insumos + mão de obra)
- Investimentos (máquinas - 100% dedutível)
- VTN (Valor da Terra Nua) para ITR
- Área total e utilizada
- Flag: Sub-rogação do Funrural

**Cálculos:**
- DRE completa da safra
- Funrural (1.5% ou 2.3%)
- ITR gradual
- IRPF Rural (LCDPR)
- Carga tributária efetiva

**Aba 2 - Arrendamento vs Parceria:**
- Comparativo de contratos agrários
- Tributação de aluguel PF vs. atividade rural
- Recomendação automática

### 4.5 Módulo Serviços & Tech
**Abas de Funcionalidade:**

**Aba 1 - Regime Tributário:**
- Área de atuação (TI, Advocacia, Engenharia)
- Faturamento mensal
- Folha de pagamento
- Flag: Sociedade Uniprofissional
- Comparativo Simples vs. Presumido

**Aba 2 - Otimizador Fator R:**
- Visualização em tempo real do Fator R
- Gap para atingir 28%
- Economia potencial Anexo III vs V

**Aba 3 - Dividendos vs Salário:**
- Valor líquido desejado
- Comparativo: todo salário, todo dividendo, híbrido
- Recomendação de estratégia de retirada

### 4.6 Módulo Varejo & Postos
**Abas de Funcionalidade:**

**Aba 1 - Regime Tributário:**
- Setor (varejo geral, supermercado, posto)
- Detecção automática de regime Monofásico
- Comparativo Simples vs. Presumido

**Aba 2 - Preço de Bomba:**
- Simulador de margem por litro
- Custo distribuidora, ICMS CONFAZ, CIDE
- Margem líquida real

**Aba 3 - Loja de Conveniência:**
- Mesmo CNPJ vs. separar
- Análise de economia tributária

### 4.7 Funcionalidades Transversais

**Reforma Tributária:**
- Card de impacto da reforma em cada módulo
- Chat com IA especialista em reforma
- Notícias e atualizações legislativas

**Apresentações Executivas:**
- Modal de apresentação para cliente
- Cenários lado a lado
- Métricas de economia destacadas
- Pronto para reunião

**Exportação:**
- PDF profissional
- DOCX (Word)
- Impressão otimizada

## 5. REQUISITOS NÃO-FUNCIONAIS
- Carregamento inicial < 3 segundos
- Responsivo (mobile e desktop)
- Interface em português BR
- Cálculos baseados em legislação 2025
- Persistência de análises histórico (Firebase)
- Integração com IA (Google Genkit)

## 6. FORA DO ESCOPO V1
❌ Multi-tenancy (múltiplos escritórios)
❌ Integração com ERPs contábeis
❌ Emissão de NF
❌ Controle de honorários
❌ Agenda de clientes
❌ Importação automática de dados da Receita
❌ App mobile nativo

## 7. MELHORIAS PROPOSTAS

### 7.1 Curto Prazo (Quick Wins)
- [ ] Autenticação com Clerk (multi-usuário)
- [ ] Histórico de simulações por cliente
- [ ] Favoritar cenários
- [ ] Modo claro/escuro persistente

### 7.2 Médio Prazo
- [ ] Dashboard unificado com todas as simulações
- [ ] Comparativo entre clientes
- [ ] Templates de proposta comercial
- [ ] Integração WhatsApp para envio de relatórios

### 7.3 Longo Prazo
- [ ] White-label para escritórios
- [ ] API pública para integrações
- [ ] Módulo de Declaração de IR (DIRPF)
- [ ] Módulo de Defesa Fiscal

## 8. MÉTRICAS DE SUCESSO
- Número de simulações realizadas
- Taxa de conversão (simulação → cliente fechado)
- NPS dos contadores
- Tempo médio por simulação
- Economia total gerada aos clientes

## 9. FLUXO DE ONBOARDING

**Passo 1:** Acesso à landing page
**Passo 2:** Seleção do módulo pelo perfil do cliente
**Passo 3:** Preenchimento do formulário de análise
**Passo 4:** Visualização dos resultados
**Passo 5:** Geração de relatório/apresentação
**Passo 6:** Export para PDF/DOCX ou apresentação ao cliente
