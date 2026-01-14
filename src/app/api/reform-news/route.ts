import { NextRequest, NextResponse } from 'next/server';
import type { ReformNews, ListNewsResponse } from '@/types/reform-news';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * API Route: Listar notícias publicadas
 * GET /api/reform-news
 */
export async function GET(request: NextRequest) {
    try {
        const { getFirebaseAdminApp } = await import('@/lib/firebase-admin');

        const app = await getFirebaseAdminApp();
        if (!app) {
            return NextResponse.json(
                {
                    success: false,
                    news: [],
                    count: 0,
                    error: 'Firebase Admin não configurado',
                } as ListNewsResponse,
                { status: 500 }
            );
        }

        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore(app);

        // Buscar notícias publicadas, ordenadas por data de publicação (mais recentes primeiro)
        const snapshot = await db
            .collection('reform_news')
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc')
            .limit(20)
            .get();

        const news: ReformNews[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                url: data.url,
                publishedAt: data.publishedAt?.toDate() || new Date(),
                source: data.source || 'Ministério da Fazenda',
                status: data.status || 'published',
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        });

        return NextResponse.json({
            success: true,
            news,
            count: news.length,
        } as ListNewsResponse);

    } catch (error) {
        console.error('Erro ao listar notícias:', error);

        return NextResponse.json(
            {
                success: false,
                news: [],
                count: 0,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            } as ListNewsResponse,
            { status: 500 }
        );
    }
}
