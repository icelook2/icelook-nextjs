"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
}

/**
 * Renders markdown content with proper styling.
 * Uses Tailwind Typography plugin for consistent text formatting.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div
      className="
        prose prose-gray dark:prose-invert
        max-w-none
        prose-headings:font-semibold
        prose-headings:text-foreground
        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-text prose-p:leading-relaxed
        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground prose-strong:font-semibold
        prose-ul:my-4 prose-li:my-1
        prose-ol:my-4
      "
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
