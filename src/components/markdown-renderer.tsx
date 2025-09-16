'use client';

import React from 'react';

type MarkdownRendererProps = {
    content: string;
};

// Helper function to process text for bolding
const processTextForBolding = (text: string, keyPrefix: string, lineIndex: number): React.ReactNode[] => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`${keyPrefix}-bold-${lineIndex}-${match.index}`}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    return parts;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps): React.ReactElement {
    const lines = content.split('\n');
    const processedElements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        const listItemRegex = /^(\s*)[-*+]\s+(.*)/;
        const listItemMatch = line.match(listItemRegex);

        if (line.trim() === '') {
            processedElements.push(<br key={index} />);
        } else if (listItemMatch) {
            processedElements.push(<li key={index} className="ml-4 text-sm">{processTextForBolding(listItemMatch[2], 'li', index)}</li>);
        } else {
            processedElements.push(<p key={index} className="text-sm">{processTextForBolding(line, 'p', index)}</p>);
        }
    });

    // Group consecutive list items into a single <ul>
    const finalElements: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];

    processedElements.forEach((element, index) => {
        if (React.isValidElement(element) && element.type === 'li') {
            currentListItems.push(element);
        } else {
            if (currentListItems.length > 0) {
                finalElements.push(<ul key={`ul-group-${index}`} className="list-disc pl-5">{currentListItems}</ul>);
                currentListItems = [];
            }
            finalElements.push(element);
        }
    });

    if (currentListItems.length > 0) {
        finalElements.push(<ul key={`ul-group-final`} className="list-disc pl-5">{currentListItems}</ul>);
    }

    return <div className="text-sm">{finalElements}</div>;
}
