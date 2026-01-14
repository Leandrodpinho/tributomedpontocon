'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage } from '@/types/reform';
import { MarkdownRenderer } from '@/components/markdown-renderer';

interface ChatInterfaceProps {
    contexto_cliente?: {
        regime_atual?: string;
        faturamento_anual?: number;
        setor?: string;
    };
}

export function ChatInterface({ contexto_cliente }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: `👋 Olá! Sou seu **Assistente Virtual de Reforma Tributária**.

Estou aqui para ajudá-lo a entender e se preparar para a **maior transformação tributária da história do Brasil**, baseada na **LC 214/2025** e **PLP 108/2024**.

**Como posso ajudar?**
- 📅 Explicar o cronograma de transição 2026-2033
- 💰 Analisar impactos no seu regime tributário
- 📊 Esclarecer CBS, IBS e Split Payment
- 🛒 Detalhar Cesta Básica e Cashback
- ⚖️ Orientar sobre regimes diferenciados

**Faça sua pergunta!** 👇`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/reform-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pergunta: input,
                    historico: messages,
                    contexto_cliente,
                }),
            });

            const data = await response.json();

            if (data.sucesso) {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: data.mensagem,
                    timestamp: new Date(),
                    metadata: {
                        referencias_legais: data.referencias_legais,
                        topicos_relacionados: data.topicos_relacionados,
                        nivel_complexidade: data.nivel_complexidade,
                    }
                };

                setMessages(prev => [...prev, assistantMessage]);
                setSuggestedTopics(data.topicos_relacionados || []);
            } else {
                throw new Error(data.erro || 'Erro ao processar mensagem');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: '❌ Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSuggestedTopic = (topic: string) => {
        setInput(`Me explique sobre: ${topic}`);
    };

    const quickQuestions = [
        'O que é CBS e IBS?',
        'Como funciona o Split Payment?',
        'Qual o cronograma da transição?',
        'Quais produtos têm alíquota zero?',
        'Como funciona o cashback?',
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg mb-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border shadow-sm'
                                }`}
                        >
                            {message.role === 'assistant' ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Assistente de Reforma Tributária
                                        </span>
                                    </div>
                                    <MarkdownRenderer content={message.content} />

                                    {/* Referências Legais */}
                                    {message.metadata?.referencias_legais && message.metadata.referencias_legais.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BookOpen className="h-3 w-3" />
                                                <span className="text-xs font-semibold">Referências Legais:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {message.metadata.referencias_legais.map((ref, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {ref}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Nível de Complexidade */}
                                    {message.metadata?.nivel_complexidade && (
                                        <div className="mt-2">
                                            <Badge
                                                variant={
                                                    message.metadata.nivel_complexidade === 'avancado' ? 'destructive' :
                                                        message.metadata.nivel_complexidade === 'intermediario' ? 'default' :
                                                            'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {message.metadata.nivel_complexidade === 'avancado' ? '🎓 Avançado' :
                                                    message.metadata.nivel_complexidade === 'intermediario' ? '📚 Intermediário' :
                                                        '📖 Básico'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm">{message.content}</p>
                            )}

                            <p className="text-xs opacity-70 mt-2" suppressHydrationWarning>
                                {message.timestamp.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-card border shadow-sm rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">Analisando...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Tópicos Sugeridos */}
            {suggestedTopics.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">
                            Tópicos Relacionados:
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {suggestedTopics.map((topic, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestedTopic(topic)}
                                className="text-xs"
                            >
                                {topic}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Perguntas Rápidas (apenas quando não há histórico) */}
            {messages.length === 1 && (
                <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                        💡 Perguntas Frequentes:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((question, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setInput(question)}
                                className="text-xs"
                            >
                                {question}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input de Mensagem */}
            <div className="flex gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua pergunta sobre a Reforma Tributária..."
                    className="flex-1 min-h-[60px] max-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                />
                <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="lg"
                    className="px-6"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>
        </div>
    );
}
