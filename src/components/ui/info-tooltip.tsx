'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type InfoTooltipProps = {
    content: string;
    className?: string;
};

export function InfoTooltip({ content, className }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span className="relative inline-block">
            <button
                type="button"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                className={cn(
                    "inline-flex items-center justify-center w-4 h-4 rounded-full",
                    "text-slate-400 hover:text-brand-500 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                    className
                )}
                aria-label="Mais informações"
            >
                <Info className="w-3.5 h-3.5" />
            </button>

            {isVisible && (
                <div className="absolute z-50 w-64 p-3 mt-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg shadow-xl left-1/2 -translate-x-1/2">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45" />
                    <p className="relative leading-relaxed">{content}</p>
                </div>
            )}
        </span>
    );
}
