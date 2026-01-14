'use client';

import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { ReformNews } from '@/types/reform-news';

interface NewsCardProps {
    news: ReformNews;
}

export function NewsCard({ news }: NewsCardProps) {
    const publishedDate = new Date(news.publishedAt);
    const isRecent = (Date.now() - publishedDate.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 dias

    const formattedDate = publishedDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="border-l-4 border-primary pl-4 py-3 hover:bg-muted/50 transition-colors rounded-r">
            <div className="flex items-center gap-2 mb-2">
                <Badge variant={isRecent ? 'default' : 'secondary'}>
                    {formattedDate}
                </Badge>
                {isRecent && (
                    <span className="text-xs text-primary font-semibold">Nova</span>
                )}
            </div>

            <h3 className="font-semibold mb-2 text-foreground">
                {news.title}
            </h3>

            <p className="text-sm text-muted-foreground mb-3">
                {news.description}
            </p>

            <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
                Ler mais
                <ExternalLink className="h-3 w-3" />
            </a>
        </div>
    );
}
