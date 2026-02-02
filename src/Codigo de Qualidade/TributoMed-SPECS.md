# SPECS - TributoMed: Planejador Tributário Inteligente

## STACK TECNOLÓGICA

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **3D Effects:** React-Three-Fiber (para efeitos visuais)
- **Icons:** Lucide React

### Backend / IA
- **Runtime:** Next.js Server Actions
- **AI SDK:** Vercel AI SDK + Google Genkit
- **LLM:** Google Generative AI (Gemini)
- **Fallback LLM:** Groq

### Persistência
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Admin SDK (futuro: Clerk)

### Exportação
- **PDF:** jsPDF + html2canvas
- **Word:** html-to-docx
- **Excel:** xlsx

### Deploy
- **Hosting:** Vercel
- **Database:** Firebase (Google Cloud)

---

## ARQUITETURA DE MÓDULOS

### Estrutura de Rotas (App Router)
```
/app
  page.tsx                    # Hub de seleção de módulos
  layout.tsx                  # Layout global
  globals.css                 # Estilos globais + tokens
  actions.ts                  # Server Actions principais
  simulation.ts               # Lógica de simulação
  
  /(dashboard)
    /medico/page.tsx          # Módulo Saúde & Clínicas
    /holding/page.tsx         # Módulo Holding Patrimonial
    /agro/page.tsx            # Módulo Produtor Rural
    /servicos/page.tsx        # Módulo Serviços & Tech
    /varejo/page.tsx          # Módulo Varejo & Postos
    /reforma-tributaria/page.tsx  # Reforma Tributária
    /playbook/page.tsx        # Playbook de vendas
    
  /api
    /webhooks                 # Webhooks externos
    /generate-scenarios       # API route para IA
```

### Fluxo de Dados
```
User Input → Form (Zod) → Server Action → Tax Engine → AI Enhancement → Firebase → Dashboard
```

---

## ENGINE DE CÁLCULO TRIBUTÁRIO

### Arquitetura
```
/lib/tax-engine
  engine.ts                   # Orquestrador principal (generateDeterministicScenarios)
  
  /calculators
    carne-leao.ts            # Carnê Leão PF
    clt.ts                   # Simulação CLT
    mei.ts                   # Microempreendedor Individual
    simples-nacional.ts      # Simples Nacional (Anexos I-V)
    lucro-presumido-real.ts  # Lucro Presumido + Lucro Real
    payroll.ts               # Fator R, Pró-Labore, Dividendos
    icms-st.ts               # ICMS-ST, Monofásico, Margem de Bomba
```

### Cenários Gerados (Médico/Geral)
```typescript
// engine.ts - generateDeterministicScenarios
// Gera 9+ cenários para comparação completa:

// PF (Pessoa Física):
//  1. Carnê Leão
//  2. CLT (simulação)

// PJ (Pessoa Jurídica):
//  3. MEI (Microempreendedor Individual)
//  4. Simples Nacional (Anexo III ou V)
//  5. Simples Nacional Misto
//  6. Lucro Presumido (Misto/Segregado)
//  7. Lucro Presumido Uniprofissional (ISS Fixo)
//  8. Lucro Presumido Equiparação Hospitalar
//  9. Lucro Real
```

### Calculadoras Setoriais
```typescript
// lib/agro-calculator.ts
calculateAgroScenario()
calculateFunrural()
calculateITR()
compareArrendamentoVsParceria()
calculateHarvestDRE()

// lib/holding-calculator.ts
calculateHoldingScenario()
calculateHoldingProjections()

// lib/reform-impact-calculator.ts
generateImpactReport()
```

---

## SCHEMA DE TIPOS

### Input Principal
```typescript
// ai/flows/types.ts
interface GenerateTaxScenariosInput {
  monthlyRevenue: number;
  payrollExpenses?: number;
  issRate?: number;
  numberOfPartners?: number;
  realProfitMargin?: number;
  isHospitalEquivalent?: boolean;
  isUniprofessionalSociety?: boolean;
  clientName?: string;
}
```

### Output de Cenário
```typescript
interface ScenarioDetail {
  name: string;
  description: string;
  totalTax: number;
  breakdown: TaxBreakdown;
  effectiveRate: number;
  monthlySavings: number;
  legalFoundation: string[];
  risks: string[];
  isRecommended: boolean;
}

interface TaxBreakdown {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  iss: number;
  cpp: number;
  inss: number;
  irpf?: number;
}
```

### Holding State
```typescript
// types/holding.ts
interface HoldingDiagnosisState {
  family: FamilyMember[];
  assets: Asset[];
  liabilities: Liability[];
  governance: GovernanceRules;
  compliance: ComplianceChecklist;
  financial: FinancialProjection;
  step: number;
}

interface Asset {
  id: string;
  type: 'IMOVEL' | 'VEICULO' | 'INVESTIMENTO' | 'PARTICIPACAO';
  description: string;
  marketValue: number;
  bookValue: number;
  rentalIncome?: number;
}
```

---

## COMPONENTES PRINCIPAIS

### Estrutura
```
/components
  /dashboard
    annual-timeline.tsx       # Linha do tempo mensal
    best-scenario-card.tsx    # Card do melhor cenário
    client-presentation.tsx   # Apresentação para cliente
    comparison-chart.tsx      # Gráfico comparativo
    compliance-card.tsx       # Card de compliance
    legal-confidence-widget.tsx # Widget de segurança jurídica
    print-layout.tsx          # Layout para impressão
    pro-labore-optimizer.tsx  # Otimizador de pró-labore
    reform-impact-card.tsx    # Card impacto reforma
    scenario-metrics.tsx      # Métricas de cenário
    sector-presentation.tsx   # Apresentação setorial (modal)
    sensitivity-analysis-chart.tsx # Análise de sensibilidade
    simulator-panel.tsx       # Painel de simulador
    
  /holding
    asset-grid.tsx            # Grid de ativos
    compliance-step.tsx       # Step de compliance
    family-form.tsx           # Formulário de família
    governance-form.tsx       # Formulário de governança
    liability-grid.tsx        # Grid de passivos
    
  /reform
    chat-interface.tsx        # Chat com IA sobre reforma
    impact-analysis.tsx       # Análise de impacto
    news-card.tsx             # Card de notícias
    
  analysis-form.tsx           # Formulário principal de análise
  dashboard-results.tsx       # Dashboard de resultados completo
  module-card.tsx             # Card de módulo no hub
  kpi-card.tsx                # Card de KPI
  
  /ui (shadcn)
    accordion.tsx, button.tsx, card.tsx, dialog.tsx,
    input.tsx, label.tsx, progress.tsx, select.tsx,
    slider.tsx, switch.tsx, tabs.tsx, toast.tsx, ...
```

### Formulário de Análise
```typescript
// components/analysis-form.tsx
// Campos principais:
// - clientName: string
// - monthlyRevenue: number (R$)
// - payrollExpenses: number (R$)
// - issRate: number (%)
// - numberOfPartners: number
// - realProfitMargin: number (%) - para Lucro Real
// - isHospitalEquivalent: boolean
// - isUniprofessionalSociety: boolean
// - attachments: File[] (PDF, XLSX, imagens)
```

---

## SERVER ACTIONS

```typescript
// app/actions.ts
"use server";

export async function getAnalysis(
  prevState: AnalysisState,
  formData: FormData
): Promise<AnalysisState>

// Fluxo:
// 1. Parse FormData com Zod
// 2. Extrai texto de anexos (PDF)
// 3. Chama Tax Engine (generateDeterministicScenarios)
// 4. Chama IA para enriquecer cenários
// 5. Calcula impacto IRPF por cenário
// 6. Persiste no Firebase
// 7. Retorna estado completo

export async function generateDocx(
  htmlContent: string
): Promise<{ docx: string | null, error: string | null }>
```

---

## INTEGRAÇÃO COM IA

### Flows (Genkit)
```
/ai/flows
  generate-tax-scenarios.ts    # Geração de cenários enriquecidos
  calculate-irpf-impact.ts     # Cálculo impacto IRPF sócio
  reform-assistant.ts          # Assistente de reforma tributária
  compliance-rules.ts          # Regras de compliance
  legal-constants.ts           # Constantes legais 2025
  local-extractor.ts           # Extração de texto de PDFs
```

### Constantes Legais
```typescript
// ai/flows/legal-constants.ts
export const LEGAL_CONSTANTS_2025 = {
  SALARIO_MINIMO: 1509,
  TETO_MEI: 81000,
  TETO_SIMPLES: 4800000,
  
  IRPF_TABELA: [
    { ate: 2259.20, aliquota: 0, deducao: 0 },
    { ate: 2826.65, aliquota: 7.5, deducao: 169.44 },
    { ate: 3751.05, aliquota: 15, deducao: 381.44 },
    { ate: 4664.68, aliquota: 22.5, deducao: 662.77 },
    { acima: 4664.68, aliquota: 27.5, deducao: 896.00 },
  ],
  
  SIMPLES_ANEXO_III: [...],
  SIMPLES_ANEXO_V: [...],
  // etc.
};
```

---

## DESIGN SYSTEM

### Cores por Módulo
```css
/* globals.css */

/* Saúde & Clínicas */
--color-saude: blue-600;

/* Holding Patrimonial */
--color-holding: amber-500;

/* Produtor Rural */
--color-agro: emerald-400;

/* Serviços & Tech */
--color-servicos: cyan-400;

/* Varejo & Postos */
--color-varejo: violet-400;

/* Reforma Tributária */
--color-reforma: orange-500;
```

### Typography
```css
/* Headings */
font-family: system-ui, -apple-system, sans-serif;
h1: text-3xl font-bold tracking-tight
h2: text-2xl font-bold
h3: text-lg font-semibold

/* Body */
text-base text-slate-700 dark:text-slate-300
text-sm text-muted-foreground
```

### Espaçamentos
```css
/* Container */
max-w-7xl mx-auto px-4

/* Cards */
p-6 rounded-xl shadow-sm border

/* Gaps */
gap-4 (padrão)
gap-6 (seções)
gap-8 (entre módulos)
```

---

## INTEGRAÇÃO FIREBASE

### Configuração
```typescript
// lib/firebase-admin.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Collection: tax_analyses
// Document structure:
interface SavedTaxAnalysis {
  id: string;
  clientName: string;
  createdAt: Timestamp;
  monthlyRevenue: number;
  scenarios: ScenarioDetail[];
  bestScenario: string;
  totalSavings: number;
}

export async function persistAnalysisRecord(data: SavedTaxAnalysis): Promise<string>
```

---

## PERFORMANCE

### Otimizações Implementadas
- Server Components por padrão
- Client Components apenas quando necessário (formulários, charts)
- Lazy loading de modais de apresentação
- Persistência em sessionStorage para restaurar análises
- Streaming de respostas IA

### Metas
- First Load: < 150KB
- Time to Interactive: < 2s
- Lighthouse Score: > 85

---

## SEGURANÇA

### Proteções Atuais
- Server Actions validam inputs com Zod
- Sanitização de HTML antes de gerar DOCX
- Limite de tamanho de uploads (12MB)
- Tipos permitidos: PDF, XLSX, CSV, imagens

### Recomendações Futuras
- Implementar autenticação (Clerk)
- Rate limiting em Server Actions
- Segregação de dados por user_id
- Audit log de operações

---

## DEPLOY CHECKLIST

### Variáveis de Ambiente
```bash
# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY=  # JSON stringified

# Groq (fallback)
GROQ_API_KEY=

# App
NEXT_PUBLIC_URL=
```

### Comandos
```bash
# Desenvolvimento
npm run dev              # porta 9002
npm run genkit:dev       # UI do Genkit

# Build
npm run build
npm run start

# Testes
npm run test
npm run typecheck
```

---

## MELHORIAS TÉCNICAS PROPOSTAS

### Arquitetura
- [ ] Migrar para Clerk Auth para multi-tenancy
- [ ] Criar API routes REST para integrações
- [ ] Implementar Redis para cache de cálculos
- [ ] Adicionar Sentry para monitoramento de erros

### Performance
- [ ] Implementar React Query para cache client-side
- [ ] Otimizar bundle com dynamic imports
- [ ] Adicionar Service Worker para offline

### Qualidade
- [ ] Aumentar cobertura de testes (calculadoras)
- [ ] Adicionar E2E tests com Playwright
- [ ] Implementar Storybook para componentes
- [ ] CI/CD com GitHub Actions

### Features
- [ ] Webhook para CRM (notificar quando análise gerada)
- [ ] Comparativo histórico (análise atual vs anterior)
- [ ] Modo offline com sync posterior
- [ ] API pública para white-label
