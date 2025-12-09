# Checklist de Melhorias - Tributo Med

## Fase 1: Análise e Diagnóstico (Executado)
- [x] **Análise de Estrutura de Código**: Stack Next.js + Firebase + Genkit identificada. Arquitetura limpa e moderna.
- [x] **Análise de Funcionalidades**:
    - Wizard de coleta de dados (Upload, Perfil, Financeiro) está funcional.
    - Integração com IA (Genkit) para geração de cenários.
    - Cálculo de impacto IRPF implementado.
    - UI/UX com Tailwind e Shadcn/UI de alta qualidade.
- [x] **Pesquisa de Mercado**:
    - Identificados concorrentes: Mitfokus, Contabilidade Médica, ERPs (Conta Azul).
    - Diferencial atual: Interface moderna e uso de IA para interpretação de contexto (transcrição).
    - Lacunas: Ferramentas concorrentes possuem integração contábil direta ou calculadoras mais granulares (ajuste fino em tempo real).

## Fase 2: Propostas de Melhoria (Aguardando Aprovação)

### UX e Funcionalidades
- [ ] **Simulador Interativo em Tempo Real**: Criar uma ferramenta "What-If" onde o usuário ajusta sliders (Faturamento, Nº Funcionários) e vê o gráfico mudar instantaneamente (sem recarregar IA).
- [ ] **Otimizador de Pró-Labore**: Ferramenta específica para encontrar o "Ponto Doce" (Sweet Spot) entre Pro-Labore e Distribuição de Lucros para minimizar o IRPF + INSS.
- [ ] **Integração com Receita Federal (CNPJ)**: Melhorar o preenchimento automático buscando dados públicos do CNPJ (CNAEs secundários, endereço) via API (ex: BrasilAPI).

### Inteligência Artificial e Engenharia
- [ ] **OCR Especializado**: Melhorar a extração de textos de PDFs (Extratos do Simples) usando parsers específicos ou regex mais robusto antes de enviar para a LLM, garantindo maior precisão nos números.
- [ ] **Cache de Requisições**: Implementar cache para inputs idênticos, economizando tokens e reduzindo latência.
- [ ] **Validação Estrita de Saída (Zod)**: Reforçar o esquema de validação da resposta da IA para evitar erros de formatação JSON em cenários complexos.

## Fase 3: Implementação (Futuro)
- [ ] Implementar Otimizador de Pró-Labore
- [ ] Integrar API de CNPJ
- [ ] Refatorar OCR para maior precisão
- [ ] Criar Dashboard Interativo "What-If"
