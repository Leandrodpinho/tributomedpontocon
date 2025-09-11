// src/components/markdown-renderer.tsx

'use client';

import React from 'react';

type MarkdownRendererProps = {
    content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const renderContent = () => {
        // Split by newlines to handle paragraphs
        return content.split('\n').map((line, index) => {
            // Check for empty lines to create paragraph breaks
            if (line.trim() === '') {
                return <br key={index} />;
            }
            
            // Regex to find **bold** text
            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(line)) !== null) {
                // Add the text before the match
                if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                }
                // Add the bolded text
                parts.push(<strong key={`bold-${index}-${match.index}`}>{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
            }

            // Add any remaining text after the last match
            if (lastIndex < line.length) {
                parts.push(line.substring(lastIndex));
            }

            // Return the line wrapped in a paragraph
            return <p key={index} className="mb-2">{parts}</p>;
        });
    };

    return <div className="text-sm">{renderContent()}</div>;
}
