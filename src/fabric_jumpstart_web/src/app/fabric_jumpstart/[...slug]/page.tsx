import React from 'react';
import fs from 'fs';
import path from 'path';
import ScenarioPageClient from './ScenarioPageClient';

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
  const slug = resolvedParams.slug[resolvedParams.slug.length - 1];

  // Load markdown content
  const contentPath = path.join(
    process.cwd(),
    'docs',
    'fabric_jumpstart',
    slugPath,
    'content.md'
  );

  let markdownContent = '';
  if (fs.existsSync(contentPath)) {
    markdownContent = fs.readFileSync(contentPath, 'utf-8');
  } else {
    // Fallback: try _index.md and strip frontmatter
    const mdPath = path.join(
      process.cwd(),
      'docs',
      'fabric_jumpstart',
      slugPath,
      '_index.md'
    );
    if (fs.existsSync(mdPath)) {
      const raw = fs.readFileSync(mdPath, 'utf-8');
      markdownContent = raw.replace(/^---[\s\S]*?---\n*/, '');
    }
  }

  return (
    <ScenarioPageClient
      slug={slug}
      markdownContent={markdownContent}
      basePath={`/docs/fabric_jumpstart/${slugPath}`}
    />
  );
}
