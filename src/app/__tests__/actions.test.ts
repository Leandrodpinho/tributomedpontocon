import { getAnalysis, generateDocx, AnalysisState } from '../actions';
import { generateTaxScenarios, GenerateTaxScenariosOutput } from '@/ai/flows/generate-tax-scenarios';
import { extractTextFromImage, ExtractTextFromImageOutput } from '@/ai/flows/extract-text-from-image';
import htmlToDocx from 'html-to-docx';

// Mock das funções de IA e html-to-docx
jest.mock('@/ai/flows/generate-tax-scenarios');
jest.mock('@/ai/flows/extract-text-from-image');
jest.mock('html-to-docx');

const mockGenerateTaxScenarios = generateTaxScenarios as jest.MockedFunction<typeof generateTaxScenarios>;
const mockExtractTextFromImage = extractTextFromImage as jest.MockedFunction<typeof extractTextFromImage>;
const mockHtmlToDocx = htmlToDocx as jest.MockedFunction<typeof htmlToDocx>;

describe('getAnalysis Server Action', () => {
  const initialState: AnalysisState = {
    aiResponse: null,
    transcribedText: null,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar um erro se nenhuma informação for fornecida', async () => {
    const formData = new FormData();
    formData.append('clientData', '');
    formData.append('attachments', new File([], '')); // Arquivo vazio

    const result = await getAnalysis(initialState, formData);

    expect(result).toEqual({
      aiResponse: null,
      transcribedText: null,
      error: "Por favor, forneça as informações financeiras ou anexe um ou mais documentos para análise.",
    });
    expect(mockExtractTextFromImage).not.toHaveBeenCalled();
    expect(mockGenerateTaxScenarios).not.toHaveBeenCalled();
  });

  it('deve processar clientData e gerar cenários de imposto', async () => {
    const formData = new FormData();
    formData.append('clientData', 'Faturamento mensal de R$ 10.000,00');
    formData.append('clientType', 'Novo aberturas de empresa');
    formData.append('companyName', 'Minha Clínica');
    formData.append('cnpj', '00.000.000/0001-00');
    formData.append('payrollExpenses', '0');
    formData.append('issRate', '4.0');

    const mockAiResponse: GenerateTaxScenariosOutput = {
      transcribedText: '',
      monthlyRevenue: 10000,
      scenarios: [{
        name: 'Cenário para Minha Clínica: Simples Nacional Anexo III',
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
    expect(mockExtractTextFromImage).not.toHaveBeenCalled();
    expect(mockGenerateTaxScenarios).toHaveBeenCalledWith({
      clientType: 'Novo aberturas de empresa',
      companyName: 'Minha Clínica',
      cnpj: '00.000.000/0001-00',
      clientData: 'Faturamento mensal de R$ 10.000,00',
      payrollExpenses: 0,
      issRate: 4.0,
      documentsAsText: '',
    });
  });

  it('deve extrair texto de anexos e gerar cenários de imposto', async () => {
    const formData = new FormData();
    formData.append('clientData', '');
    formData.append('clientType', 'Transferências de contabilidade');
    formData.append('companyName', 'Outra Clínica');
    formData.append('cnpj', '11.111.111/0001-11');
    formData.append('payrollExpenses', '2000');
    formData.append('issRate', '5.0');

    const mockFile = new File(['conteúdo do arquivo'], 'documento.png', { type: 'image/png' });
    formData.append('attachments', mockFile);

    const mockExtractedTextOutput: ExtractTextFromImageOutput = {
      extractedText: 'Texto extraído do documento.',
    };
    mockExtractTextFromImage.mockResolvedValue(mockExtractedTextOutput);

    const mockAiResponse: GenerateTaxScenariosOutput = {
      transcribedText: 'Texto extraído do documento.',
      monthlyRevenue: 20000,
      scenarios: [{
        name: 'Cenário para Outra Clínica: Lucro Presumido',
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
    expect(mockExtractTextFromImage).toHaveBeenCalledTimes(1);
    expect(mockGenerateTaxScenarios).toHaveBeenCalledWith({
      clientType: 'Transferências de contabilidade',
      companyName: 'Outra Clínica',
      cnpj: '11.111.111/0001-11',
      clientData: '',
      payrollExpenses: 2000,
      issRate: 5.0,
      documentsAsText: 'Texto extraído do documento.',
    });
  });

  it('deve retornar um erro se a extração de texto falhar', async () => {
    const formData = new FormData();
    formData.append('clientData', '');
    formData.append('clientType', 'Novo aberturas de empresa');
    const mockFile = new File(['conteúdo do arquivo'], 'documento.pdf', { type: 'application/pdf' });
    formData.append('attachments', mockFile);

    mockExtractTextFromImage.mockRejectedValue(new Error('Erro na API de extração'));

    // Mock para generateTaxScenarios quando extractTextFromImage falha
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
    expect(mockExtractTextFromImage).toHaveBeenCalledTimes(1);
    expect(mockGenerateTaxScenarios).toHaveBeenCalledTimes(1); // A IA ainda é chamada com o texto de erro
    expect(mockGenerateTaxScenarios).toHaveBeenCalledWith(
      expect.objectContaining({
        documentsAsText: expect.stringContaining('[Erro ao processar o arquivo: documento.pdf]'),
      })
    );
  });

  it('deve retornar um erro se a geração de cenários falhar', async () => {
    const formData = new FormData();
    formData.append('clientData', 'Dados de teste');
    formData.append('clientType', 'Novo aberturas de empresa');

    mockGenerateTaxScenarios.mockRejectedValue(new Error('Erro na API de cenários'));

    const result = await getAnalysis(initialState, formData);

    expect(result.error).toContain('Falha ao processar a análise: Erro na API de cenários');
    expect(result.aiResponse).toBeNull();
    expect(result.transcribedText).toBeNull();
    expect(mockGenerateTaxScenarios).toHaveBeenCalledTimes(1);
  });
});

describe('generateDocx Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar um arquivo DOCX em Base64 a partir de HTML', async () => {
    const htmlContent = '<h1>Teste</h1><p>Conteúdo</p>';
    const mockBuffer = Buffer.from('mock docx content');
    mockHtmlToDocx.mockResolvedValue(mockBuffer); // No ambiente Node.js, html-to-docx retorna um Buffer.

    const result = await generateDocx(htmlContent);

    expect(result.error).toBeNull();
    expect(result.docx).toBe(mockBuffer.toString('base64'));
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