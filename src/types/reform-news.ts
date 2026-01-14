/**
 * Tipos para o sistema de notícias da Reforma Tributária
 */

export interface ReformNews {
    id: string;
    title: string;
    description: string;
    url: string;
    publishedAt: Date;
    source: string;
    status: 'published' | 'archived';
    createdAt: Date;
}

export interface ReformNewsInput {
    title: string;
    description: string;
    url: string;
    publishedAt: Date;
    source?: string;
}

export interface FetchNewsResponse {
    success: boolean;
    newCount: number;
    totalCount: number;
    news: ReformNews[];
    error?: string;
}

export interface ListNewsResponse {
    success: boolean;
    news: ReformNews[];
    count: number;
    error?: string;
}
