import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ShikiHighlighter, isInlineCode } from 'react-shiki';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { Components } from 'react-markdown';
import type { Element } from 'hast';

/**
 * Extract language from code block className (e.g., "language-typescript" -> "typescript").
 */
function extractLanguage(className?: string): string | undefined {
  if (!className) return undefined;
  const match = className.match(/language-(\w+)/);
  return match?.[1];
}

/**
 * Copy-to-clipboard button with "Copied!" feedback tooltip.
 */
function CopyButton({ code }: { code: string }) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [code]);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleCopy}
            aria-label={isCopied ? 'Copied' : 'Copy code'}
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isCopied ? 'Copied!' : 'Copy code'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Markdown component overrides using design system tokens.
 * Defined OUTSIDE the component function to prevent re-render on each render cycle.
 */
const markdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p className="text-body mb-3 last:mb-0" {...props}>{children}</p>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="text-heading font-semibold mt-4 mb-2" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-heading font-semibold mt-3 mb-2" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-body font-semibold mt-3 mb-1" {...props}>{children}</h3>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 mb-3" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-6 mb-3" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-body mb-1" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-2 border-border-strong pl-3 text-text-dim italic mb-3" {...props}>
      {children}
    </blockquote>
  ),
  hr: ({ ...props }) => (
    <hr className="border-border my-4" {...props} />
  ),
  a: ({ children, href, ...props }) => (
    <a
      className="text-accent underline hover:text-accent/80"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <table className="w-full border-collapse mb-3" {...props}>{children}</table>
  ),
  th: ({ children, ...props }) => (
    <th className="bg-surface-2 px-3 py-2 text-caption font-semibold text-left border-b border-border" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-3 py-2 text-caption border-b border-border" {...props}>
      {children}
    </td>
  ),
  code: ({ children, className, node, ...props }) => {
    if (isInlineCode(node as Element)) {
      return (
        <code
          className="bg-surface-2 px-1.5 py-0.5 rounded-xs font-mono text-caption"
          {...props}
        >
          {children}
        </code>
      );
    }

    const language = extractLanguage(className);
    const codeString = String(children).replace(/\n$/, '');

    return (
      <div className="relative mb-3">
        <div className="bg-surface-2 rounded-md p-3 overflow-x-auto max-h-80 overflow-y-auto font-mono text-caption">
          {language && (
            <Badge variant="default" size="sm" className="absolute top-2 left-2 z-10">
              {language}
            </Badge>
          )}
          <CopyButton code={codeString} />
          <ShikiHighlighter
            language={language ?? 'text'}
            theme="github-dark"
            showLanguage={false}
          >
            {codeString}
          </ShikiHighlighter>
        </div>
      </div>
    );
  },
};

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content using react-markdown with design system styling.
 * Supports rich text (headers, lists, tables, links, blockquotes) and
 * syntax-highlighted code blocks with copy button and language badge.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
