import { getAnalysis, generateDocx, AnalysisState } from '../actions';
import { generateTaxScenarios } from '@/ai/flows/generate-tax-scenarios';
import type { GenerateTaxScenariosOutput } from '@/ai/flows/types';
import { extractTextFromDocument, ExtractTextFromDocumentOutput } from '@/ai/flows/extract-text-from-document';
import { calculateIRPFImpact, CalculateIRPFImpactOutput } from '@/ai/flows/calculate-irpf-impact';
import htmlToDocx from 'html-to-docx';
import { persistAnalysisRecord } from '@/lib/firebase-admin';

// Mock das funções de IA e html-to-docx
jest.mock('@/ai/flows/generate-tax-scenarios');
jest.mock('@/ai/flows/extract-text-from-document');
jest.mock('@/ai/flows/calculate-irpf-impact');
jest.mock('html-to-docx');
jest.mock('@/lib/firebase-admin');

const mockGenerateTaxScenarios = generateTaxScenarios as jest.MockedFunction<typeof generateTaxScenarios>;
const mockExtractTextFromDocument = extractTextFromDocument as jest.MockedFunction<typeof extractTextFromDocument>;
const mockCalculateIRPFImpact = calculateIRPFImpact as jest.MockedFunction<typeof calculateIRPFImpact>;
const mockHtmlToDocx = htmlToDocx as jest.MockedFunction<typeof htmlToDocx>;
const mockPersistAnalysisRecord = persistAnalysisRecord as jest.MockedFunction<typeof persistAnalysisRecord>;

describe('getAnalysis Server Action', () => {
  const initialState: AnalysisState = {
    aiResponse: null,
    transcribedText: null,
    irpfImpacts: null,
    webhookResponse: null,
    error: null,
    historyRecordId: null,
    historyError: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateIRPFImpact.mockResolvedValue({
      impactDetails: {
        taxableIncome: 0,
        taxBracket: 'Isento',
        irpfDue: 0,
        deductions: 0,
        netImpact: 0,
        summary: 'Simulação de teste.',
      },
    } as CalculateIRPFImpactOutput);

    mockPersistAnalysisRecord.mockResolvedValue({
      saved: false,
      documentId: null,
      error: 'Firebase Admin não configurado.',
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'ok' }),
      text: async () => 'ok',
    } as unknown as Response);
  });

  it('deve retornar um erro se nenhuma informação for fornecida', async () => {
    const formData = new FormData();
    formData.append('clientData', '');
    formData.append('attachments', new File([], '')); // Arquivo vazio
    formData.append('monthlyRevenue', '12000');

    const result = await getAnalysis(initialState, formData);

    expect(result).toEqual({
      aiResponse: null,
      transcribedText: null,
      irpfImpacts: null,
      webhookResponse: null,
      error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
      historyRecordId: null,
      historyError: null,
    });
    expect(mockExtractTextFromDocument).not.toHaveBeenCalled();
    expect(mockGenerateTaxScenarios).not.toHaveBeenCalled();
    expect(mockPersistAnalysisRecord).not.toHaveBeenCalled();
  });

  it('deve processar clientData e gerar cenários de imposto', async () => {
    const formData = new FormData();
    formData.append('clientData', 'Faturamento mensal de R$ 10.000,00');
    formData.append('clientType', 'Novo aberturas de empresa');
    formData.append('companyName', 'Minha Clínica');
    formData.append('cnpj', '00.000.000/0001-00');
    formData.append('payrollExpenses', '0');
    formData.append('issRate', '4');
    formData.append('monthlyRevenue', '10000');

    const mockAiResponse: GenerateTaxScenariosOutput = {
      transcribedText: '',
      monthlyRevenue: 10000,
      scenarios: [{
        name: 'Cenário para Minha Clínica: Simples Nacional Anexo III',
        scenarioRevenue: 10000,
        totalTaxValue: 1000,
        effectiveRate: 10,
        proLaboreAnalysis: {
          baseValue: 1500,
          inssValue: 165,
          irrfValue: 0,
          netValue: 1335,
        },
        taxBreakdown: [],
        netProfitDistribution: 8500,
        notes: 'Notas do cenário',
      }],
      executiveSummary: '**Resumo Executivo**',
    };

    mockGenerateTaxScenarios.mockResolvedValue(mockAiResponse);

    const result = await getAnalysis(initialState, formData);

    expect(result.error).toBeNull();
    expect(result.aiResponse).toEqual(JSON.parse(JSON.stringify(mockAiResponse)));
    expect(result.transcribedText).toBe('');
    expect(mockExtractTextFromDocument).not.toHaveBeenCalled();
    expect(mockGenerateTaxScenarios).toHaveBeenCalledWith(
      expect.objectContaining({
        clientType: 'Novo aberturas de empresa',
        companyName: 'Minha Clínica',
        cnpj: '00.000.000/0001-00',
        clientData: 'Faturamento mensal de R$ 10.000,00',
        payrollExpenses: 0,
        issRate: 4.0,
        monthlyRevenue: 10000,
        documentsAsText: '',
      })
    );
    expect(mockPersistAnalysisRecord).toHaveBeenCalledTimes(1);
    expect(result.historyRecordId).toBeNull();
    expect(result.historyError).toEqual('Firebase Admin não configurado.');
  });

  it('deve extrair texto de anexos e gerar cenários de imposto', async () => {
    const formData = new FormData();
    formData.append('clientData', '');
    formData.append('clientType', 'Transferências de contabilidade');
    formData.append('companyName', 'Outra Clínica');
    formData.append('cnpj', '11.111.111/0001-11');
    formData.append('payrollExpenses', '2000');
    formData.append('issRate', '5');
    formData.append('monthlyRevenue', '20000');

    const mockFile = new File(['conteúdo do arquivo'], 'documento.png', { type: 'image/png' });
    formData.append('attachments', mockFile);

    const mockExtractedTextOutput: ExtractTextFromDocumentOutput = {
      extractedText: 'Texto extraído do documento.',
    };
    mockExtractTextFromDocument.mockResolvedValue(mockExtractedTextOutput);

    const mockAiResponse: GenerateTaxScenariosOutput = {
      transcribedText: 'Texto extraído do documento.',
      monthlyRevenue: 20000,
      scenarios: [{
        name: 'Cenário para Outra Clínica: Lucro Presumido',
        scenarioRevenue: 20000,
        totalTaxValue: 2500,
        effectiveRate: 12.5,
        proLaboreAnalysis: {
          baseValue: 2000,
          inssValue: 220,
          irrfValue: 0,
          netValue: 1780,
        },
        taxBreakdown: [],
        netProfitDistribution: 17500,
        notes: 'Notas do cenário com anexo',
      }],
      executiveSummary: '**Resumo Executivo com Anexo**',
    };
    mockGenerateTaxScenarios.mockResolvedValue(mockAiResponse);

    const result = await getAnalysis(initialState, formData);

    expect(result.error).toBeNull();
    expect(result.aiResponse).toEqual(JSON.parse(JSON.stringify(mockAiResponse)));
    expect(result.transcribedText).toBe('Texto extraído do documento.');
    expect(mockExtractTextFromDocument).toHaveBeenCalledTimes(1);
    expect(mockGenerateTaxScenarios).toHaveBeenCalledWith(
      expect.objectContaining({
        clientType: 'Transferências de contabilidade',
        companyName: 'Outra Clínica',
        cnpj: '11.111.111/0001-11',
        clientData: '',
        payrollExpenses: 2000,
        issRate: 5.0,
        monthlyRevenue: 20000,
        documentsAsText: 'Texto extraído do documento.',
      })
    );
    expect(mockPersistAnalysisRecord).toHaveBeenCalledTimes(1);
    expect(result.historyRecordId).toBeNull();
    expect(result.historyError).toEqual('Firebase Admin não configurado.');
  });

  it('deve retornar um erro se a extração de texto falhar', async () => {
    const formData = new FormData();
    formData.append('clientData', '');
    formData.append('clientType', 'Novo aberturas de empresa');
    formData.append('monthlyRevenue', '20000');
    const mockFile = new File(['conteúdo do arquivo'], 'documento.pdf', { type: 'application/pdf' });
    formData.append('attachments', mockFile);

    mockExtractTextFromDocument.mockRejectedValue(new Error('Erro na API de extração'));

    // Mock para generateTaxScenarios quando extractTextFromDocument falha
    mockGenerateTaxScenarios.mockResolvedValue({
      transcribedText: '[Erro ao processar o arquivo: documento.pdf]',
      monthlyRevenue: 0, // Ou outro valor padrão
      scenarios: [],
      executiveSummary: 'Erro na extração de texto.',
    });

    const result = await getAnalysis(initialState, formData);

    expect(result.error).toBeNull(); // O erro é "engolido" e adicionado ao transcribedText
    expect(result.aiResponse).not.toBeNull(); // Agora esperamos um aiResponse, mas com dados de erro
    expect(result.transcribedText).toContain('[Erro ao processar o arquivo: documento.pdf]');
    expect(mockExtractTextFromDocument).toHaveBeenCalledTimes(1);
    expect(mockGenerateTaxScenarios).toHaveBeenCalledTimes(1); // A IA ainda é chamada com o texto de erro
    expect(mockGenerateTaxScenarios).toHaveBeenCalledWith(
      expect.objectContaining({
        documentsAsText: expect.stringContaining('[Erro ao processar o arquivo: documento.pdf]'),
      })
    );
    expect(mockPersistAnalysisRecord).toHaveBeenCalledTimes(1);
    expect(result.historyRecordId).toBeNull();
    expect(result.historyError).toEqual('Firebase Admin não configurado.');
  });

  it('deve retornar um erro se a geração de cenários falhar', async () => {
    const formData = new FormData();
    formData.append('clientData', 'Dados de teste');
    formData.append('clientType', 'Novo aberturas de empresa');
    formData.append('monthlyRevenue', '15000');

    mockGenerateTaxScenarios.mockRejectedValue(new Error('Erro na API de cenários'));

    const result = await getAnalysis(initialState, formData);

    expect(result.error).toContain('Falha ao processar a análise: Erro na API de cenários');
    expect(result.aiResponse).toBeNull();
    expect(result.transcribedText).toBeNull();
    expect(mockGenerateTaxScenarios).toHaveBeenCalledTimes(1);
    expect(mockPersistAnalysisRecord).not.toHaveBeenCalled();
  });
});

describe('generateDocx Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar um arquivo DOCX em Base64 a partir de HTML', async () => {
    const htmlContent = '<h1>Teste</h1><p>Conteúdo</p>';
    const mockArrayBuffer = new TextEncoder().encode('mock docx content').buffer;
    mockHtmlToDocx.mockResolvedValue(
      mockArrayBuffer as unknown as Awaited<ReturnType<typeof htmlToDocx>>
    );

    const result = await generateDocx(htmlContent);

    expect(result.error).toBeNull();
    expect(result.docx).toBe(Buffer.from(mockArrayBuffer).toString('base64'));
    expect(mockHtmlToDocx).toHaveBeenCalledTimes(1);
    expect(mockHtmlToDocx).toHaveBeenCalledWith(htmlContent, undefined, {
      font: 'Arial',
      fontSize: 12,
    });
  });

  it('deve retornar um erro se a geração do DOCX falhar', async () => {
    const htmlContent = '<h1>Teste</h1>';
    mockHtmlToDocx.mockRejectedValue(new Error('Erro na geração do DOCX'));
 
    const result = await generateDocx(htmlContent);

    expect(result.docx).toBeNull();
    expect(result.error).toContain('Falha ao gerar o arquivo DOCX: Erro na geração do DOCX');
    expect(mockHtmlToDocx).toHaveBeenCalledTimes(1);
  });
});
