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

        // Regex atualizado para o layout do gov.br (baseado em inspeção real)
        // Estrutura: <h2 class="titulo"><a href="...">Titulo</a></h2> ... <span class="data">DD/MM/YYYY</span> ... Texto
        const newsRegex = /<h2\s+class="titulo">\s*<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>[\s\S]*?<span\s+class="data">(\d{2}\/\d{2}\/\d{4})<\/span>([\s\S]*?)<div/gi;

        let match;
        while ((match = newsRegex.exec(html)) !== null) {
            const [, url, title, dateStr, descriptionRaw] = match;

            const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
            // Limpar descrição: remover tags, hífens iniciais e espaços extras
            const cleanDescription = descriptionRaw
                .replace(/<[^>]+>/g, '') // Remove tags
                .replace(/^[\s\-]*/, '') // Remove hífens/espaços do início
                .replace(/\s+/g, ' ')    // Normaliza espaços
                .trim();

            // Parse data (DD/MM/YYYY)
            const [day, month, year] = dateStr.split('/');
            const publishedAt = new Date(`${year}-${month}-${day}T12:00:00`);

            // Filtrar apenas notícias relevantes
            if (isRelevant(cleanTitle + ' ' + cleanDescription)) {
                newsItems.push({
                    title: cleanTitle,
                    description: cleanDescription,
                    url: url.startsWith('http') ? url : `https://www.gov.br${url}`,
                    publishedAt: publishedAt,
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
export async function GET() {
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
