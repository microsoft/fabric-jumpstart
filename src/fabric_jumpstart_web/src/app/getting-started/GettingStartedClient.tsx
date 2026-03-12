'use client';

import React from 'react';
import Link from 'next/link';
import { tokens } from '@fluentui/react-components';
import ScenarioContentRenderer from '@components/ScenarioContent/ScenarioContentRenderer';

interface GettingStartedClientProps {
  content: string;
}

export default function GettingStartedClient({
  content,
}: GettingStartedClientProps) {
  return (
    <section
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '80px 24px 40px',
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
          paddingTop: '0px',
          marginBottom: '24px',
        }}
      >
        ← Back to catalog
      </Link>

      <ScenarioContentRenderer
        rawMarkdown={content}
        isMdx={false}
        showToc={false}
      />
    </section>
  );
}
