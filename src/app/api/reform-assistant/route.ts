import { NextRequest, NextResponse } from 'next/server';
import { runReformAssistant } from '@/ai/flows/reform-assistant';
import type { ReformAssistantInput } from '@/types/reform';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const input: ReformAssistantInput = {
            query: body.pergunta || body.query,
            conversation_history: body.historico || body.conversation_history || [],
            context: body.contexto_cliente || body.context,
        };

        // Validação básica
        if (!input.query || input.query.trim().length === 0) {
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

        return NextResponse.json({
            sucesso: true,
            mensagem: result.response,
            referencias_legais: result.sources || [],
            topicos_relacionados: result.suggested_questions || [],
            nivel_complexidade: 'intermediario',
        });

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
