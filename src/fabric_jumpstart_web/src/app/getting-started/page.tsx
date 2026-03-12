import React from 'react';
import fs from 'fs';
import path from 'path';
import GettingStartedClient from './GettingStartedClient';

export default async function GettingStartedPage() {
  const contentPath = path.join(
    process.cwd(),
    'docs',
    'catalog',
    'getting-started',
    'content.md'
  );

  let content = '';
  if (fs.existsSync(contentPath)) {
    content = fs.readFileSync(contentPath, 'utf-8');
  }

  return <GettingStartedClient content={content} />;
}
