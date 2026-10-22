import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Enterprise Markdown Formatter for AI Chat
 * Handles: code blocks with copy button, bold, italics, inline code, bullet points, numbered lists, links, paragraphs.
 */
export function FormattedMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fences (```lang)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <CodeBlock
            key={`code-${i}`}
            code={codeBlockContent.join('\n')}
            language={codeBlockLang || 'code'}
          />
        );
        codeBlockContent = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Blank line spacing
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Headings (###, ##, #)
    if (/^#{1,3}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,3}\s+/, '');
      elements.push(
        <h4 key={`heading-${i}`} className="font-bold text-slate-900 dark:text-white text-sm my-1.5 font-display tracking-tight">
          {renderInlineMarkdown(headingText)}
        </h4>
      );
      continue;
    }

    // Bullet points (•, -, *, numbers)
    if (/^(\s*[-*•]|\s*\d+\.)\s+/.test(line)) {
      const isNumbered = /^\s*\d+\.\s+/.test(line);
      const match = line.match(/^(\s*)(\d+\.|\-|\*|•)\s+(.*)/);
      const listMarker = match ? match[2] : '•';
      const cleaned = match ? match[3] : line.replace(/^(\s*[-*•]|\s*\d+\.)\s+/, '');

      elements.push(
        <div key={`list-${i}`} className="flex items-start gap-2 my-1 pl-1 text-sm leading-relaxed">
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold select-none text-xs mt-0.5 font-mono">
            {listMarker.endsWith('.') ? listMarker : '•'}
          </span>
          <span className="flex-1 text-slate-800 dark:text-slate-200">{renderInlineMarkdown(cleaned)}</span>
        </div>
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed my-1 text-slate-800 dark:text-slate-200">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <CodeBlock
        key="unclosed-code"
        code={codeBlockContent.join('\n')}
        language={codeBlockLang || 'code'}
      />
    );
  }

  return <div className="space-y-0.5 text-sm">{elements}</div>;
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineMarkdown(text) {
  if (!text) return '';

  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-950 dark:text-white">
          {boldText}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*') && !token.startsWith('**')) {
      const italicText = token.slice(1, -1);
      parts.push(
        <em key={match.index} className="italic text-slate-700 dark:text-slate-300">
          {italicText}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 font-mono text-xs text-indigo-600 dark:text-indigo-300">
          {codeText}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
