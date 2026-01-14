import { NextRequest, NextResponse } from 'next/server';
import { runReformAssistant } from '@/ai/flows/reform-assistant';
import type { ReformAssistantInput } from '@/types/reform';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const input: ReformAssistantInput = {
            pergunta: body.pergunta,
            historico: body.historico || [],
            contexto_cliente: body.contexto_cliente,
        };

        // Validação básica
        if (!input.pergunta || input.pergunta.trim().length === 0) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: 'Pergunta não pode estar vazia'
                },
                { status: 400 }
            );
        }

        // Executar AI Flow
        const result = await runReformAssistant(input);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro na API de Reforma Tributária:', error);

        return NextResponse.json(
            {
                sucesso: false,
                mensagem: 'Erro ao processar sua pergunta. Por favor, tente novamente.',
                erro: error instanceof Error ? error.message : 'Erro desconhecido',
                referencias_legais: [],
                topicos_relacionados: [],
                nivel_complexidade: 'basico',
            },
            { status: 500 }
        );
    }
}
