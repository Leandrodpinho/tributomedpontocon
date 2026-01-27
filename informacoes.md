# TributoMed - Documentação Completa do Projeto

**Última atualização:** 26 de janeiro de 2026, 17:06

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Configurações e Credenciais](#configurações-e-credenciais)
5. [APIs e Integrações](#apis-e-integrações)
6. [Histórico de Desenvolvimento](#histórico-de-desenvolvimento)
7. [Problemas Conhecidos](#problemas-conhecidos)
8. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

**Nome do Projeto:** TributoMed  
**Tipo:** Aplicação Web de Planejamento Tributário  
**Tecnologias:** Next.js 15.5.9, React, TypeScript, Firebase, Tailwind CSS, shadcn/ui  
**Público-alvo:** Profissionais de contabilidade e médicos/clínicas  

### Objetivo Principal
Ferramenta de planejamento tributário especializada em profissionais da saúde, oferecendo:
- Análise comparativa de **8 regimes tributários** (2 PF + 6 PJ)
- Assistente virtual de Reforma Tributária
- Cálculos determinísticos de impostos
- Análise de impactos da reforma CBS/IBS
- **ISS automático por município** ✨ NOVO

---

## 📁 Estrutura do Projeto

### Diretórios Principais

```
tributomedpontocon/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── reforma-tributaria/     # Página da Reforma Tributária
│   │   │   └── page.tsx                # Dashboard principal
│   │   ├── api/
│   │   │   ├── reform-assistant/       # API do chat especialista
│   │   │   ├── reform-news/            # APIs de notícias
│   │   │   │   ├── fetch/              # Busca automática
│   │   │   │   └── seed/               # Seed de dados
│   │   │   └── route.ts
│   │   └── actions.ts                  # Server Actions
│   ├── ai/
│   │   └── flows/
│   │       ├── generate-tax-scenarios.ts  # Geração de cenários
│   │       ├── legal-constants.ts         # Constantes legais 2026 ✨
│   │       ├── types.ts                   # Tipos com categoria PF/PJ ✨
│   │       └── reform-assistant.ts        # Assistente IA
│   ├── components/
│   │   ├── reform/
│   │   │   ├── chat-interface.tsx      # Chat do especialista
│   │   │   ├── impact-analysis.tsx     # Análise de impactos
│   │   │   └── news-card.tsx           # Card de notícias
│   │   ├── dashboard-results.tsx       # Dashboard com cenários PF/PJ ✨
│   │   ├── analysis-form.tsx           # Form com ISS automático ✨
│   │   └── ui/                         # Componentes shadcn/ui
│   ├── lib/
│   │   ├── tax-engine/                 # Engine de cálculos refatorada ✨
│   │   │   ├── engine.ts               # Gera 8 cenários
│   │   │   └── calculators/
│   │   │       ├── clt.ts              # Calculadora CLT ✨ NOVO
│   │   │       ├── carne-leao.ts
│   │   │       ├── simples-nacional.ts
│   │   │       ├── lucro-presumido-real.ts
│   │   │       └── payroll.ts
│   │   ├── iss-municipal-database.ts   # Base ISS por município ✨ NOVO
│   │   ├── reform-knowledge.ts         # Base de conhecimento
│   │   ├── reform-impact-calculator.ts # Calculadora CBS/IBS
│   │   └── tax-calculator.ts           # Calculadora determinística
│   ├── services/
│   │   └── cnpj.ts                     # Busca CNPJ + ISS ✨
│   └── types/
│       ├── reform.ts                   # Tipos da reforma
│       └── reform-impact.ts            # Tipos de impacto
├── .env.local                          # Variáveis de ambiente
├── vercel.json                         # Config Vercel + Cron
└── package.json
```

---

## ✨ Funcionalidades Implementadas

### 1. **Planejador Tributário com 8 Cenários** ✅ ATUALIZADO 26/01/2026

**Localização:** `/` (página inicial)

**Cenários gerados:**

| Categoria | Cenário | Descrição |
|-----------|---------|-----------|
| **PF** | Carnê Leão | INSS 20% + IRPF progressivo |
| **PF** | CLT (Simulação) | Comparativo como empregado |
| **PJ** | Simples Anexo III | Com Fator R ≥ 28% |
| **PJ** | Simples Anexo V | Sem otimização de Fator R |
| **PJ** | Lucro Presumido | ISS variável (2-5%) |
| **PJ** | LP Uniprofissional | ISS Fixo por profissional |
| **PJ** | LP Equip. Hospitalar | Base reduzida 8%/12% |
| **PJ** | Lucro Real | Para margens < 32% |

**Novos campos em cada cenário:**
- `scenarioCategory`: 'pf' ou 'pj'
- `scenarioType`: identificador único
- `isEligible`: se está elegível atualmente
- `eligibilityNote`: explicação dos requisitos

**Arquivos principais atualizados:**
- `src/lib/tax-engine/engine.ts` - Gera 8 cenários
- `src/ai/flows/types.ts` - Campos de categoria e elegibilidade
- `src/ai/flows/legal-constants.ts` - Valores 2026

---

### 2. **ISS Automático por Município** ✅ NOVO 26/01/2026

**Funcionalidades:**
- Base de dados com 16 municípios (MG + capitais)
- ISS identificado automaticamente ao buscar CNPJ
- ISS Fixo por profissional para SUP

**Arquivos criados:**
- `src/lib/iss-municipal-database.ts` - Base de alíquotas
- `src/services/cnpj.ts` - Retorna ISS e CNAEs estruturados

**Municípios na base:**
| Município | ISS | ISS Fixo (mês) |
|-----------|-----|----------------|
| Montes Claros | 4% | R$ 119,71 |
| Belo Horizonte | 5% | R$ 350 |
| São Paulo | 5% | R$ 300 |
| Rio de Janeiro | 5% | R$ 400 |
| E mais 12 cidades... | | |

---

### 3. **Constantes Legais 2026** ✅ ATUALIZADO 26/01/2026

**Valores atualizados em `legal-constants.ts`:**

| Parâmetro | Valor 2026 |
|-----------|------------|
| Salário Mínimo | R$ 1.621,00 |
| Teto INSS | R$ 8.475,55 |

**Tabela INSS 2026:**
| Faixa | Alíquota | Dedução |
|-------|----------|---------|
| Até R$ 1.621,00 | 7,5% | - |
| R$ 1.621,01 - R$ 2.902,84 | 9% | R$ 24,32 |
| R$ 2.902,85 - R$ 4.354,27 | 12% | R$ 111,40 |
| R$ 4.354,28 - R$ 8.475,55 | 14% | R$ 198,49 |

---

### 4. **Dashboard com Agrupamento PF/PJ** ✅ NOVO 26/01/2026

**Modificações em `dashboard-results.tsx`:**
- Cenários organizados em seções PF e PJ
- Badges visuais:
  - `✓ Recomendado` - cenário com menor custo
  - `⚠ Requer Ação` - cenário não elegível atualmente
- Cards com destaque visual baseado em elegibilidade

---

### 5. **Calculadora CLT** ✅ NOVO 26/01/2026

**Arquivo:** `src/lib/tax-engine/calculators/clt.ts`

**Calcula:**
- INSS do empregado (progressivo)
- IRRF do empregado
- Encargos do empregador:
  - INSS Patronal (20%)
  - FGTS (8%)
  - RAT (1%)
  - Terceiros (5,8%)
- Custo total para empresa
- Salário líquido

---

## 🔐 Configurações e Credenciais

### Arquivo `.env.local`

```bash
# Google AI (Gemini)
GOOGLE_API_KEY=AIzaSyB4zP122jSzd0mSsiJYqaYhCsRhXUNEAiE
GEMINI_API_KEY=AIzaSyBrp44npgYZvlPW59HclIx4pXhyswJuBFQ
GOOGLE_GENAI_API_KEY=AIzaSyBrp44npgYZvlPW59HclIx4pXhyswJuBFQ

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT={...}  # JSON completo
FIREBASE_ANALYSES_COLLECTION=analyses
```

### Firebase

**Projeto:** `planejamento-tributario-8d554`  
**Região:** `southamerica-east1` (São Paulo)

**Coleções Firestore:**
- `analyses` - Análises tributárias
- `reform-news` - Notícias da reforma

---

## 📜 Histórico de Desenvolvimento

### Sessão 5: Analisador Tributário Completo ✨ NOVO
**Data:** 26/01/2026

**Objetivo:**
Transformar o planejador em analisador completo que mostra TODOS os cenários para comparação.

**Implementado:**

#### Fase 2: Busca Automática CNPJ + ISS ✅
- Base de dados ISS com 16 municípios
- Serviço CNPJ retorna: município, UF, alíquota ISS, ISS Fixo, CNAEs
- Formulário preenche ISS automaticamente ao buscar CNPJ

#### Fase 3: Engine de 8 Cenários ✅
- Reescrita completa da engine de cálculos
- Sempre gera 8 cenários (2 PF + 6 PJ)
- Campos novos: categoria, tipo, elegibilidade, nota de elegibilidade
- Criada calculadora CLT para comparação
- Removidas condicionais que escondiam cenários

#### Fase 4: Interface Atualizada ✅
- Dashboard agrupa cenários por PF e PJ
- Badges de elegibilidade (✓ Recomendado, ⚠ Requer Ação)
- Cards com destaque visual para status

**Arquivos criados:**
- `src/lib/iss-municipal-database.ts`
- `src/lib/tax-engine/calculators/clt.ts`

**Arquivos modificados:**
- `src/ai/flows/legal-constants.ts` (valores 2026)
- `src/ai/flows/types.ts` (campos categoria/elegibilidade)
- `src/lib/tax-engine/engine.ts` (8 cenários)
- `src/services/cnpj.ts` (retorno expandido)
- `src/components/analysis-form.tsx` (ISS automático)
- `src/components/dashboard-results.tsx` (agrupamento PF/PJ)

**Status:** Build passa ✅, Interface precisa ser testada

---

### Sessões Anteriores

- **Sessão 4:** Catalogação de APIs Oficiais
- **Sessão 3:** Análise de Impactos da Reforma
- **Sessão 2:** Correção de Inconsistência no Planejador
- **Sessão 1:** Implementação do Assistente de Reforma

---

## ⚠️ Problemas Conhecidos

### 1. Interface não mostra mudanças ⚠️ PENDENTE

**Status:** Em investigação

**Possíveis causas:**
- Dados em cache da análise anterior
- Precisa gerar nova análise para ver os 8 cenários
- Server Components podem precisar de reload

**Próxima ação:** 
- Testar gerando nova análise
- Verificar se cenários têm campo `scenarioCategory`

---

## 🚀 Próximos Passos

### Fase 5: Verificação (PENDENTE - Continuar amanhã)

1. **Testar interface com nova análise**
   - Gerar análise com dados de teste
   - Verificar se 8 cenários aparecem
   - Confirmar agrupamento PF/PJ

2. **Validar cálculos**
   - Testar com faturamento R$ 66.000
   - Comparar com planilha de referência
   - Verificar economia ISS Fixo vs variável

3. **Testar busca CNPJ**
   - Usar CNPJ real de Montes Claros
   - Verificar preenchimento automático de ISS
   - Confirmar alíquota do município

---

### Resumo do que falta testar:

| Item | Status |
|------|--------|
| 8 cenários no dashboard | ⏳ Pendente |
| Agrupamento PF/PJ | ⏳ Pendente |
| Badges de elegibilidade | ⏳ Pendente |
| ISS automático no form | ⏳ Pendente |
| Cálculo CLT | ⏳ Pendente |

---

## 🔄 Como Retomar o Desenvolvimento

### Para continuar amanhã:

1. **Inicie o servidor:**
   ```bash
   cd "/Users/leandropinho/Planejador Tributário/tributomedpontocon"
   npm run dev
   ```

2. **Teste a nova funcionalidade:**
   - Acesse http://localhost:3000
   - Preencha CNPJ (ou deixe em branco)
   - Faturamento: R$ 66.000
   - Gere o planejamento
   - Verifique se aparecem 8 cenários organizados em PF e PJ

3. **Se não aparecer os 8 cenários:**
   - Verificar se a engine está sendo chamada corretamente
   - Checar console do navegador por erros
   - Verificar logs do servidor

4. **Arquivos de referência:**
   - `task.md` - Tarefas pendentes
   - `implementation_plan.md` - Plano completo
   - `comparativo_planilha.md` - Fórmulas de referência

---

**Fim da documentação**  
*Atualizado em 26/01/2026 às 17:06*

