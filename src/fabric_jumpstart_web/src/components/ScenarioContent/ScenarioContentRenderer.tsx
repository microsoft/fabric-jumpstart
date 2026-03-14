'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useThemeContext } from '@components/Providers/themeProvider';
import { tokens } from '@fluentui/react-components';
import { headingSlug } from '@utils/markdown';
import Callout from './Callout';
import QuoteBlock from './QuoteBlock';
import YouTubeEmbed from './YouTubeEmbed';
import MermaidDiagram from './MermaidDiagram';
import TableOfContents, { type TocItem } from './TableOfContents';
import ImageWithLightbox from './ImageWithLightbox';
import styles from './prose.module.css';

interface ScenarioContentRendererProps {
  rawMarkdown: string;
  isMdx: boolean;
  showToc: boolean;
}

function extractHeadings(source: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = source.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].replace(/[`*_~\[\]]/g, '').trim();
      const id = headingSlug(title);
      headings.push({ title, id, level });
    }
  }
  return headings;
}

function CodeBlock(props: any) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const [copied, setCopied] = React.useState(false);

  const getChildrenText = (children: React.ReactNode): string => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(getChildrenText).join('');
    if (React.isValidElement(children) && (children as any).props?.children) {
      return getChildrenText((children as any).props.children);
    }
    return '';
  };

  const getLanguage = (children: React.ReactNode): string => {
    if (React.isValidElement(children)) {
      const cls =
        (children as any).props?.className || (children as any).props?.class || '';
      const match = cls.match(/lang(?:uage)?-(\S+)/);
      if (match) return match[1];
    }
    return '';
  };

  const language = getLanguage(props.children);
  const text = getChildrenText(props.children).trim();

  if (language === 'mermaid') {
    return <MermaidDiagram chart={text} />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ margin: '16px 0', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          color: tokens.colorNeutralForeground2,
        }}
      >
        <span style={{ fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace" }}>
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            color: tokens.colorNeutralForeground2,
          }}
          aria-label="Copy code"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '13px',
          lineHeight: 1.6,
          padding: '16px 20px',
        }}
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}

function HeadingWithId({ level, children, ...props }: any) {
  const text = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.filter((c: any) => typeof c === 'string').join('')
      : '';
  const id = headingSlug(text);
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag id={id} {...props}>{children}</Tag>;
}

export default function ScenarioContentRenderer({
  rawMarkdown,
  isMdx,
  showToc,
}: ScenarioContentRendererProps) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const articleRef = useRef<HTMLElement>(null);
  const [headings, setHeadings] = useState<TocItem[]>([]);

  // After markdown renders, read actual heading IDs from the DOM.
  // This guarantees the TOC selectors always match the rendered elements.
  useEffect(() => {
    if (!showToc || !isMdx || !articleRef.current) return;
    const els = articleRef.current.querySelectorAll('h2[id], h3[id]');
    const items: TocItem[] = [];
    els.forEach((el) => {
      const id = el.getAttribute('id');
      if (id) {
        items.push({
          title: el.textContent?.trim() ?? '',
          id,
          level: el.tagName === 'H2' ? 2 : 3,
        });
      }
    });
    setHeadings(items);
  }, [showToc, isMdx, rawMarkdown]);

  const proseVars = {
    '--prose-text': tokens.colorNeutralForeground1,
    '--prose-heading': tokens.colorNeutralForeground1,
    '--prose-accent': tokens.colorBrandForeground1,
    '--prose-strong': tokens.colorNeutralForeground1,
    '--prose-code-bg': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    '--prose-code-text': tokens.colorNeutralForeground1,
    '--prose-border': isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    '--prose-blockquote-bg': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    '--prose-caption': isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
  } as React.CSSProperties;

  // Build overrides — MDX components only available for .mdx files
  const overrides: Record<string, any> = {
    pre: CodeBlock,
    img: {
      component: ImageWithLightbox,
    },
    h2: {
      component: (props: any) => <HeadingWithId level={2} {...props} />,
    },
    h3: {
      component: (props: any) => <HeadingWithId level={3} {...props} />,
    },
  };

  if (isMdx) {
    overrides.Callout = Callout;
    overrides.QuoteBlock = QuoteBlock;
    overrides.YouTubeEmbed = YouTubeEmbed;
  }

  return (
    <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
      <article ref={articleRef} className={styles.prose} style={{ ...proseVars, flex: 1, minWidth: 0 }}>
        <Markdown options={{ overrides }}>
          {rawMarkdown}
        </Markdown>
      </article>
      {showToc && isMdx && headings.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            width: '220px',
            display: 'none',
            alignSelf: 'stretch',
          }}
          className="scenario-toc-sidebar"
        >
          <TableOfContents headings={headings} />
        </div>
      )}
    </div>
  );
}
