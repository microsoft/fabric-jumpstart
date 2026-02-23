import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { marked } from 'marked';

export async function generateStaticParams() {
  const docsDir = path.join(
    process.cwd(),
    'docs',
    'fabric_jumpstart'
  );

  if (!fs.existsSync(docsDir)) {
    return [];
  }

  const entries = fs.readdirSync(docsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => ({ slug: [e.name] }));
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const slugPath = resolvedParams.slug.join('/');
  const mdPath = path.join(
    process.cwd(),
    'docs',
    'fabric_jumpstart',
    slugPath,
    '_index.md'
  );

  let content = '';
  if (fs.existsSync(mdPath)) {
    const raw = fs.readFileSync(mdPath, 'utf-8');
    // Strip YAML frontmatter
    const stripped = raw.replace(/^---[\s\S]*?---\n*/, '');
    content = await marked(stripped);
  } else {
    content = '<p>Scenario not found.</p>';
  }

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 24px',
        lineHeight: '1.7',
      }}
    >
      <Link
        href="/fabric_jumpstart/"
        style={{ color: '#0078d4', textDecoration: 'none', fontSize: '14px' }}
      >
        ← Back to all scenarios
      </Link>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        style={{ marginTop: '24px' }}
      />
    </div>
  );
}
