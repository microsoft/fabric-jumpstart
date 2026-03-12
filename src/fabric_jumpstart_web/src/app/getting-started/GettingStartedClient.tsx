'use client';

import React from 'react';
import Link from 'next/link';
import { tokens } from '@fluentui/react-components';
import Markdown from 'markdown-to-jsx';
import Anchor from '@components/Markdown/Anchor';
import Blockquote from '@components/Markdown/Blockquote';
import CodeBlock from '@components/Markdown/Codeblock';
import ListItem from '@components/Markdown/ListItem';
import Table from '@components/Markdown/Table';
import { useThemeContext } from '@components/Providers/themeProvider';

interface GettingStartedClientProps {
  content: string;
}

export default function GettingStartedClient({
  content,
}: GettingStartedClientProps) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  return (
    <section
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 24px',
        lineHeight: '1.7',
        width: '100%',
      }}
    >
      <Link
        href="/catalog/"
        style={{
          color: tokens.colorBrandForeground1,
          textDecoration: 'none',
          fontSize: '14px',
          display: 'inline-block',
          paddingTop: '12px',
          marginBottom: '24px',
        }}
      >
        ← Back to all scenarios
      </Link>

      <Markdown
        options={{
          overrides: {
            a: ({ href, children }) => (
              <Anchor href={href}>{children}</Anchor>
            ),
            blockquote: (props) => (
              <Blockquote {...props} disclaimer="Note" />
            ),
            h2: (props) => (
              <h2
                {...props}
                style={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: tokens.colorNeutralForeground1,
                  margin: '24px 0 16px',
                }}
              />
            ),
            pre: (props) => (
              <CodeBlock
                {...props}
                copyText="Copy"
                ariaLabel="Copy code"
                isDarkMode={isDark}
              />
            ),
            ol: (props) => (
              <ol
                {...props}
                style={{
                  paddingLeft: '24px',
                  margin: '8px 0',
                }}
              />
            ),
            ul: (props) => (
              <ul
                {...props}
                style={{
                  paddingLeft: '24px',
                  margin: '8px 0',
                }}
              />
            ),
            li: ListItem,
            table: (props) => <Table {...props} />,
          },
        }}
      >
        {content}
      </Markdown>
    </section>
  );
}
