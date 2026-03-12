import React from 'react';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import ScenarioPageClient from './ScenarioPageClient';
import { loadScenarioContent } from '@components/ScenarioContent/loadContent';
import scenariosData from '@data/scenarios.json';

interface ScenarioEntry {
  slug: string;
  id: string;
  title: string;
  description: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug[resolvedParams.slug.length - 1];
  const scenario = (scenariosData as ScenarioEntry[]).find(
    (s) => s.slug === slug || s.id === slug
  );
  return {
    title: scenario ? `${scenario.title} — Fabric Jumpstart` : 'Fabric Jumpstart',
    description: scenario?.description,
  };
}

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
