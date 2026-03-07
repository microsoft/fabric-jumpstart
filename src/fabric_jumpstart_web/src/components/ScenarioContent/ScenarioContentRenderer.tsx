'use client';

import React, { useMemo } from 'react';
import Markdown from 'markdown-to-jsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useThemeContext } from '@components/Providers/themeProvider';
import { tokens } from '@fluentui/react-components';
import Callout from './Callout';
import QuoteBlock from './QuoteBlock';
import YouTubeEmbed from './YouTubeEmbed';
import TableOfContents, { type TocItem } from './TableOfContents';
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
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      headings.push({ title, id, level });
    }
  }
  return headings;
}

function CodeBlock(props: any) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

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

  return (
    <div style={{ margin: '16px 0', borderRadius: '8px', overflow: 'hidden' }}>
      {language && (
        <div
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: tokens.colorNeutralForeground2,
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          {language}
        </div>
      )}
      <SyntaxHighlighter
        language={language || 'text'}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: language ? '0 0 8px 8px' : '8px',
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
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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

  const headings = useMemo(() => {
    if (!showToc || !isMdx) return [];
    return extractHeadings(rawMarkdown);
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
  } as React.CSSProperties;

  // Build overrides — MDX components only available for .mdx files
  const overrides: Record<string, any> = {
    pre: CodeBlock,
    img: {
      component: (props: any) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...props} alt={props.alt || ''} loading="lazy" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', margin: '20px 0' }} />
      ),
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
      <article className={styles.prose} style={{ ...proseVars, flex: 1, minWidth: 0 }}>
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
          }}
          className="scenario-toc-sidebar"
        >
          <TableOfContents headings={headings} />
        </div>
      )}
    </div>
  );
}
