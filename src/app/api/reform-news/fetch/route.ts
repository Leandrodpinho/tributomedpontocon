import { NextRequest, NextResponse } from 'next/server';
import type { ReformNewsInput, FetchNewsResponse } from '@/types/reform-news';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Palavras-chave para filtrar notícias relevantes
const KEYWORDS = [
    'reforma tributária',
    'reforma tributaria',
    'LC 214',
    'LC 227',
    'PLP 108',
    'CBS',
    'IBS',
    'imposto sobre bens e serviços',
    'contribuição sobre bens e serviços',
    'split payment',
    'comitê gestor',
    'cesta básica nacional',
    'cashback tributário',
    'receita federal',
    'arrecadação',
    'tributação',
    'imposto',
    'nova lei',
    'regulamentação',
    'iva dual'
];

/**
 * Verifica se o texto contém alguma palavra-chave relevante
 */
function isRelevant(text: string): boolean {
    const lowerText = text.toLowerCase();
    return KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Busca notícias do site do Ministério da Fazenda
 */
async function fetchGovNews(): Promise<ReformNewsInput[]> {
    try {
        const url = 'https://www.gov.br/fazenda/pt-br/assuntos/noticias';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TributoMed/1.0)',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Parse básico do HTML para extrair notícias
        const newsItems: ReformNewsInput[] = [];

        // Regex para encontrar links de notícias (formato do gov.br)
        const newsRegex = /<article[^>]*>[\s\S]*?<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<time[^>]*datetime="([^"]+)"[^>]*>/gi;

        let match;
        while ((match = newsRegex.exec(html)) !== null) {
            const [, url, title, description, datetime] = match;

            const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
            const cleanDescription = description.replace(/<[^>]+>/g, '').trim();

            // Filtrar apenas notícias relevantes
            if (isRelevant(cleanTitle + ' ' + cleanDescription)) {
                newsItems.push({
                    title: cleanTitle,
                    description: cleanDescription,
                    url: url.startsWith('http') ? url : `https://www.gov.br${url}`,
                    publishedAt: new Date(datetime),
                    source: 'Ministério da Fazenda',
                });
            }
        }

        return newsItems;
    } catch (error) {
        console.error('Erro ao buscar notícias do gov.br:', error);
        return [];
    }
}

/**
 * Salva notícias no Firestore (evita duplicatas)
 */
async function saveNewsToFirestore(newsItems: ReformNewsInput[]): Promise<{ saved: number; skipped: number }> {
    const { getFirebaseAdminApp } = await import('@/lib/firebase-admin');

    const app = await getFirebaseAdminApp();
    if (!app) {
        throw new Error('Firebase Admin não configurado');
    }

    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore(app);
    const newsCollection = db.collection('reform_news');

    let saved = 0;
    let skipped = 0;

    for (const newsItem of newsItems) {
        try {
            // Verificar se já existe (por URL)
            const existingQuery = await newsCollection
                .where('url', '==', newsItem.url)
                .limit(1)
                .get();

            if (!existingQuery.empty) {
                skipped++;
                continue;
            }

            // Salvar nova notícia
            await newsCollection.add({
                title: newsItem.title,
                description: newsItem.description,
                url: newsItem.url,
                publishedAt: newsItem.publishedAt,
                source: newsItem.source || 'Ministério da Fazenda',
                status: 'published',
                createdAt: new Date(),
            });

            saved++;
        } catch (error) {
            console.error('Erro ao salvar notícia:', newsItem.title, error);
        }
    }

    return { saved, skipped };
}

/**
 * API Route: Buscar e salvar notícias
 * GET /api/reform-news/fetch
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Iniciando busca de notícias sobre Reforma Tributária...');

        // Buscar notícias do gov.br
        const newsItems = await fetchGovNews();
        console.log(`📰 Encontradas ${newsItems.length} notícias relevantes`);

        if (newsItems.length === 0) {
            return NextResponse.json({
                success: true,
                newCount: 0,
                totalCount: 0,
                news: [],
                message: 'Nenhuma notícia relevante encontrada',
            } as FetchNewsResponse);
        }

        // Salvar no Firestore
        const { saved, skipped } = await saveNewsToFirestore(newsItems);
        console.log(`✅ Salvas: ${saved} | ⏭️ Ignoradas (duplicatas): ${skipped}`);

        return NextResponse.json({
            success: true,
            newCount: saved,
            totalCount: newsItems.length,
            news: [],
            message: `${saved} novas notícias salvas, ${skipped} duplicatas ignoradas`,
        } as FetchNewsResponse);

    } catch (error) {
        console.error('❌ Erro ao buscar notícias:', error);

        return NextResponse.json(
            {
                success: false,
                newCount: 0,
                totalCount: 0,
                news: [],
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            } as FetchNewsResponse,
            { status: 500 }
        );
    }
}
