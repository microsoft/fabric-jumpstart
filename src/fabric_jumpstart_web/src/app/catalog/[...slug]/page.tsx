import React from 'react';
import fs from 'fs';
import path from 'path';
import ScenarioPageClient from './ScenarioPageClient';
import { loadScenarioContent } from '@components/ScenarioContent/loadContent';

export async function generateStaticParams() {
  const docsDir = path.join(
    process.cwd(),
    'docs',
    'catalog'
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
  const slug = resolvedParams.slug[resolvedParams.slug.length - 1];

  // Load optional scenario content (md/mdx)
  const contentData = loadScenarioContent(slug);

  return (
    <ScenarioPageClient
      slug={slug}
      rawMarkdown={contentData?.rawSource}
      isMdx={contentData?.isMdx ?? false}
      showToc={contentData ? contentData.isMdx && contentData.toc : false}
    />
  );
}
