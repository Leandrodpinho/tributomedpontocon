'use client';

import { useEffect, useState } from 'react';
import type { ReformNews } from '@/types/reform-news';

interface UseReformNewsResult {
    news: ReformNews[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useReformNews(): UseReformNewsResult {
    const [news, setNews] = useState<ReformNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNews = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/reform-news');
            const data = await response.json();

            if (data.success) {
                setNews(data.news);
            } else {
                setError(data.error || 'Erro ao carregar notícias');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar notícias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    return {
        news,
        loading,
        error,
        refetch: fetchNews,
    };
}
