# TributoMed - Documentação Completa do Projeto

**Última atualização:** 14 de janeiro de 2026, 17:24

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
- Análise comparativa de regimes tributários
- Assistente virtual de Reforma Tributária
- Cálculos determinísticos de impostos
- Análise de impactos da reforma CBS/IBS

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
│   │       └── reform-assistant.ts        # Assistente IA
│   ├── components/
│   │   ├── reform/
│   │   │   ├── chat-interface.tsx      # Chat do especialista
│   │   │   ├── impact-analysis.tsx     # Análise de impactos
│   │   │   └── news-card.tsx           # Card de notícias
│   │   └── ui/                         # Componentes shadcn/ui
│   ├── hooks/
│   │   ├── use-reform-news.ts          # Hook de notícias
│   │   └── use-reform-impact.ts        # Hook de impactos
│   ├── lib/
│   │   ├── reform-knowledge.ts         # Base de conhecimento
│   │   ├── reform-impact-calculator.ts # Calculadora CBS/IBS
│   │   ├── tax-calculator.ts           # Calculadora determinística
│   │   └── official-apis.ts            # APIs oficiais catalogadas
│   └── types/
│       ├── reform.ts                   # Tipos da reforma
│       └── reform-impact.ts            # Tipos de impacto
├── .env.local                          # Variáveis de ambiente
├── vercel.json                         # Config Vercel + Cron
└── package.json
```

---

## ✨ Funcionalidades Implementadas

### 1. **Planejador Tributário Principal** ✅

**Localização:** `/` (página inicial)

**Funcionalidades:**
- Formulário de entrada de dados do cliente
- Upload de documentos (PDF, imagens)
- Cálculo de cenários tributários:
  - Simples Nacional (Anexo III e V)
  - Lucro Presumido
  - Lucro Real
  - Pessoa Física (Carnê Leão)
- Análise de IRPF
- Geração de relatórios
- Salvamento no Firestore

**Arquivos principais:**
- `src/app/(dashboard)/page.tsx`
- `src/app/actions.ts`
- `src/ai/flows/generate-tax-scenarios.ts`
- `src/lib/tax-calculator.ts`

**Melhorias recentes:**
- ✅ Temperature da IA reduzida de 0.5 → 0.1 (mais consistência)
- ✅ Calculadora determinística implementada
- ✅ Integração com análise de impactos da reforma

---

### 2. **Assistente de Reforma Tributária** ✅

**Localização:** `/reforma-tributaria`

**Funcionalidades:**

#### 2.1. Chat com Especialista
- Chat interativo com IA especializada em LC 214/2025
- Base de conhecimento estruturada
- Referências legais automáticas
- Sugestões de tópicos relacionados
- Histórico de conversa

**Arquivos:**
- `src/components/reform/chat-interface.tsx`
- `src/ai/flows/reform-assistant.ts`
- `src/app/api/reform-assistant/route.ts`
- `src/lib/reform-knowledge.ts`

#### 2.2. Análise de Impactos ✅ **NOVO**
- Comparação "Antes vs Depois" (Hoje vs Pós-Reforma)
- Cálculo de CBS + IBS
- Impacto financeiro (economia/aumento)
- Mudanças operacionais (Split Payment, Creditamento)
- Oportunidades e alertas
- Timeline de transição 2026-2033
- Resumo executivo com recomendações

**Arquivos:**
- `src/components/reform/impact-analysis.tsx`
- `src/lib/reform-impact-calculator.ts`
- `src/types/reform-impact.ts`
- `src/hooks/use-reform-impact.ts`

#### 2.3. Novidades (Feed Automático)
- Busca automática de notícias do gov.br
- Filtragem por palavras-chave
- Salvamento no Firestore
- Exibição dinâmica
- Cron job diário (9h)

**Arquivos:**
- `src/app/api/reform-news/fetch/route.ts`
- `src/app/api/reform-news/route.ts`
- `src/app/api/reform-news/seed/route.ts`
- `src/components/reform/news-card.tsx`
- `src/hooks/use-reform-news.ts`

#### 2.4. Guia Completo
- Cronograma de transição (2026-2033)
- Regimes diferenciados (60% redução)
- Cesta básica nacional
- Conceitos-chave (CBS, IBS, Split Payment, etc.)

**Arquivo:**
- `src/lib/reform-knowledge.ts`

---

### 3. **APIs Oficiais Catalogadas** ✅

**Arquivo:** `src/lib/official-apis.ts`

**APIs documentadas:**
1. Calculadora CBS/IBS (Receita Federal)
2. Apuração Assistida CBS
3. Conformidade Fácil (Classificação Tributária)
4. Consulta CNPJ (Gov.br Conecta)
5. DCTFWeb / MIT

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

**Índices criados:**
- `reform-news`: `status` (ASC) + `publishedAt` (DESC)

**Service Account:**
- Email: `firebase-adminsdk-fbsvc@planejamento-tributario-8d554.iam.gserviceaccount.com`
- Arquivo: `/Users/leandropinho/Downloads/planejamento-tributario-8d554-firebase-adminsdk-fbsvc-f70f5ef3c8.json`

---

## 🔌 APIs e Integrações

### 1. Google Gemini AI

**Modelos usados:**
- `gemini-2.0-flash-exp` (chat especialista)
- `gemini-1.5-flash` (planejador tributário)

**Configuração:**
- Temperature: 0.1 (planejador) / 0.7 (chat)
- Max tokens: 2000-8192

**Status:** ⚠️ Quota excedida (tier gratuito)

### 2. Firebase Firestore

**Operações:**
- Salvamento de análises
- Salvamento de notícias
- Consultas com índices

**Status:** ✅ Funcionando

### 3. Vercel Cron Jobs

**Arquivo:** `vercel.json`

```json
{
  "crons": [{
    "path": "/api/reform-news/fetch",
    "schedule": "0 9 * * *"
  }]
}
```

**Função:** Busca automática de notícias diariamente às 9h

**Status:** ⏳ Aguardando deploy

---

## 📜 Histórico de Desenvolvimento

### Sessão 1: Implementação do Assistente de Reforma Tributária
**Data:** 14/01/2026

**Implementado:**
1. ✅ Base de conhecimento estruturada
2. ✅ Chat com especialista IA
3. ✅ Sistema de notícias automáticas
4. ✅ Guia completo da reforma
5. ✅ Botão "Voltar ao Planejador"

**Arquivos criados:**
- `src/lib/reform-knowledge.ts`
- `src/ai/flows/reform-assistant.ts`
- `src/app/api/reform-assistant/route.ts`
- `src/app/api/reform-news/fetch/route.ts`
- `src/app/api/reform-news/route.ts`
- `src/app/api/reform-news/seed/route.ts`
- `src/components/reform/chat-interface.tsx`
- `src/components/reform/news-card.tsx`
- `src/hooks/use-reform-news.ts`
- `src/types/reform.ts`
- `vercel.json`

**Problemas resolvidos:**
- Configuração do Firestore
- Criação de índices
- Integração com Google Gemini
- Erro de hydration (timestamps)

---

### Sessão 2: Correção de Inconsistência no Planejador
**Data:** 14/01/2026

**Problema identificado:**
Simulações com mesmos dados retornavam resultados diferentes (Simples Anexo III, Anexo V, Lucro Presumido variando aleatoriamente).

**Causa:**
- Temperature da IA muito alta (0.5)
- Falta de validação matemática

**Solução implementada:**
1. ✅ Temperature reduzida de 0.5 → 0.1
2. ✅ Calculadora determinística já existente em `tax-calculator.ts`
3. ⏳ Validação de resultados (planejado)

**Status:** Parcialmente resolvido (aguardando testes)

---

### Sessão 3: Análise de Impactos da Reforma
**Data:** 14/01/2026

**Implementado:**
1. ✅ Calculadora de impactos CBS/IBS
2. ✅ Tipos TypeScript completos
3. ✅ Hook React `useReformImpact`
4. ✅ Componente visual `ImpactAnalysis`
5. ✅ Integração com planejador
6. ✅ Salvamento no localStorage

**Arquivos criados:**
- `src/lib/reform-impact-calculator.ts`
- `src/types/reform-impact.ts`
- `src/hooks/use-reform-impact.ts`
- `src/components/reform/impact-analysis.tsx`

**Arquivos modificados:**
- `src/app/actions.ts` (integração)
- `src/app/(dashboard)/reforma-tributaria/page.tsx` (UI)

**Funcionalidades:**
- Comparação Antes vs Depois
- Cálculo de economia/aumento
- Timeline de transição 2026-2033
- Oportunidades e alertas
- Resumo executivo

---

### Sessão 4: Catalogação de APIs Oficiais
**Data:** 14/01/2026

**Implementado:**
1. ✅ Documentação de APIs oficiais da Receita Federal
2. ✅ Arquivo `official-apis.ts` com metadados

**APIs catalogadas:**
- Calculadora CBS/IBS (piloto)
- Apuração Assistida CBS
- Conformidade Fácil
- Consulta CNPJ
- DCTFWeb / MIT

**Arquivo criado:**
- `src/lib/official-apis.ts`

---

## ⚠️ Problemas Conhecidos

### 1. Quota Excedida do Google Gemini ❌ **CRÍTICO**

**Erro:**
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
```

**Chave afetada:** `AIzaSyBrp44npgYZvlPW59HclIx4pXhyswJuBFQ`

**Impacto:**
- ❌ Chat do especialista não funciona
- ❌ Geração de cenários tributários não funciona
- ✅ Análise de impactos funciona (não depende da API)

**Soluções possíveis:**
1. Gerar nova chave de API (https://aistudio.google.com/app/apikey)
2. Aguardar reset da quota (meia-noite, horário do servidor)
3. Upgrade para plano pago (https://ai.google.dev/pricing)

---

### 2. Inconsistência no Planejador ⚠️ **PARCIALMENTE RESOLVIDO**

**Status:** Temperature reduzida, aguardando testes

**Próximos passos:**
- Testar com mesmos dados 10x
- Validar consistência
- Implementar validação matemática se necessário

---

### 3. Cron Job Não Testado ⏳

**Status:** Configurado mas não testado em produção

**Próximo passo:** Deploy no Vercel para validar execução diária

---

## 🚀 Próximos Passos

### Curto Prazo (Urgente)

1. **Resolver quota do Gemini** ❗
   - Gerar nova chave de API
   - Ou aguardar reset
   - Ou configurar billing

2. **Testar consistência do planejador**
   - Executar 10 simulações com mesmos dados
   - Validar se resultados são consistentes
   - Documentar resultados

3. **Deploy no Vercel**
   - Validar cron job de notícias
   - Testar em produção

### Médio Prazo

4. **Implementar validação de resultados**
   - Criar `result-validator.ts`
   - Verificar consistência matemática
   - Logs de auditoria

5. **Melhorar UX da Análise de Impactos**
   - Adicionar gráficos visuais
   - Animações de transição
   - Exportar para PDF

6. **Integrar com APIs oficiais**
   - Implementar chamadas reais
   - Autenticação com certificado digital
   - Validação de dados

### Longo Prazo

7. **Dashboard de auditoria**
   - Histórico de análises
   - Comparação de versões
   - Métricas de uso

8. **Testes automatizados**
   - Unit tests para calculadoras
   - Integration tests para APIs
   - E2E tests para fluxos principais

9. **Documentação para usuários**
   - Guia de uso
   - Vídeos tutoriais
   - FAQ

---

## 📊 Estatísticas do Projeto

**Arquivos criados nesta sessão:** ~20  
**Linhas de código adicionadas:** ~3.500  
**Componentes React criados:** 3  
**APIs implementadas:** 4  
**Hooks criados:** 2  
**Tipos TypeScript criados:** 15+  

---

## 🔄 Como Retomar o Desenvolvimento

### Para continuar de onde parou:

1. **Leia este arquivo** (`informacoes.md`)
2. **Verifique o status atual:**
   - Servidor rodando? `npm run dev`
   - Quota do Gemini resolvida?
   - Últimos commits no Git

3. **Consulte os artifacts:**
   - `task.md` - Tarefas pendentes
   - `implementation_plan.md` - Plano atual
   - `walkthrough.md` - Histórico de testes

4. **Próxima ação sugerida:**
   - Resolver quota do Gemini
   - Testar consistência do planejador
   - Deploy no Vercel

---

## 📞 Contatos e Recursos

**Projeto Firebase:** `planejamento-tributario-8d554`  
**Região:** São Paulo (southamerica-east1)  
**Repositório:** Local em `/Users/leandropinho/Downloads/Apps Firebase/Tributo Med/tributomedpontocon`

**Recursos úteis:**
- [Documentação Next.js](https://nextjs.org/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google AI Studio](https://aistudio.google.com)
- [Reforma Tributária (Gov.br)](https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria)

---

**Fim da documentação**  
*Este arquivo será atualizado continuamente conforme o projeto evolui.*
