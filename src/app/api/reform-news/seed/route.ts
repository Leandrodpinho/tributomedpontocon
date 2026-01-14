import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * API Route: Adicionar notícias de exemplo (seed)
 * GET /api/reform-news/seed
 */
export async function GET(request: NextRequest) {
    try {
        const { getFirebaseAdminApp } = await import('@/lib/firebase-admin');

        const app = await getFirebaseAdminApp();
        if (!app) {
            return NextResponse.json(
                { success: false, error: 'Firebase Admin não configurado' },
                { status: 500 }
            );
        }

        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore(app);

        // Notícias de exemplo
        const sampleNews = [
            {
                title: 'Nova lei de regulamentação da Reforma Tributária aprofunda o federalismo fiscal cooperativo',
                description: 'Comitê Gestor do IBS cuidará da gestão e fiscalização desse tributo, em colaboração e parceria inédita entre as administrações tributárias dos entes federados',
                url: 'https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/janeiro/nova-lei-de-regulamentacao-da-reforma-tributaria-aprofunda-o-federalismo-fiscal-cooperativo',
                publishedAt: new Date('2026-01-13'),
                source: 'Ministério da Fazenda',
                status: 'published',
                createdAt: new Date(),
            },
            {
                title: 'Fazenda, Receita e Serpro lançam Reforma Tributária do Consumo em cerimônia em Brasília',
                description: 'Evento com autoridades do Governo Federal marca o início da maior infraestrutura digital tributária da história do país',
                url: 'https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/janeiro/fazenda-receita-e-serpro-lancam-reforma-tributaria-do-consumo-em-cerimonia-em-brasilia',
                publishedAt: new Date('2026-01-10'),
                source: 'Ministério da Fazenda',
                status: 'published',
                createdAt: new Date(),
            },
            {
                title: 'CBS e IBS: entenda o novo modelo de tributação sobre consumo',
                description: 'A Reforma Tributária substitui cinco tributos por dois: CBS (federal) e IBS (estadual/municipal), simplificando o sistema tributário brasileiro',
                url: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
                publishedAt: new Date('2026-01-08'),
                source: 'Ministério da Fazenda',
                status: 'published',
                createdAt: new Date(),
            },
            {
                title: 'Split Payment entra em vigor em 2027: saiba como funciona',
                description: 'Sistema de pagamento dividido retém automaticamente o imposto nas transações bancárias, aumentando a arrecadação e reduzindo sonegação',
                url: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
                publishedAt: new Date('2026-01-05'),
                source: 'Ministério da Fazenda',
                status: 'published',
                createdAt: new Date(),
            },
            {
                title: 'Cesta Básica Nacional terá alíquota zero de CBS e IBS',
                description: '22 produtos essenciais, incluindo arroz, feijão, carnes e leite, terão isenção total dos novos tributos sobre consumo',
                url: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
                publishedAt: new Date('2026-01-03'),
                source: 'Ministério da Fazenda',
                status: 'published',
                createdAt: new Date(),
            },
        ];

        let added = 0;
        const newsCollection = db.collection('reform_news');

        for (const news of sampleNews) {
            // Verificar se já existe
            const existing = await newsCollection
                .where('url', '==', news.url)
                .limit(1)
                .get();

            if (existing.empty) {
                await newsCollection.add(news);
                added++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `${added} notícias de exemplo adicionadas`,
            total: sampleNews.length,
        });

    } catch (error) {
        console.error('Erro ao adicionar notícias de exemplo:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            },
            { status: 500 }
        );
    }
}
