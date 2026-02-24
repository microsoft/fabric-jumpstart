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
  const slug = resolvedParams.slug[resolvedParams.slug.length - 1];

  return (
    <ScenarioPageClient slug={slug} />
  );
}
