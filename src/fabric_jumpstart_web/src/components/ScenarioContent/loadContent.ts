/**
 * Build-time utility to load scenario content from content/scenarios/<id>/.
 * Used by the server component in [...slug]/page.tsx.
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.resolve(process.cwd(), 'content', 'scenarios');

export interface ScenarioContentData {
  rawSource: string;
  isMdx: boolean;
  toc: boolean;
  frontmatter: Record<string, unknown>;
}

export function loadScenarioContent(
  slug: string
): ScenarioContentData | null {
  const scenarioDir = path.join(CONTENT_DIR, slug);
  if (!fs.existsSync(scenarioDir)) return null;

  // Prefer .mdx over .md
  const mdxPath = path.join(scenarioDir, 'index.mdx');
  const mdPath = path.join(scenarioDir, 'index.md');

  let filePath: string | null = null;
  let isMdx = false;

  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
    isMdx = true;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
    isMdx = false;
  }

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(raw);

  // Rewrite relative image paths to public-served paths
  const rewritten = content.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_match, alt, src) => {
      // e.g. images/foo.png → /content/scenarios/<slug>/images/foo.png
      const publicPath = `/content/scenarios/${slug}/${src}`;
      return `![${alt}](${publicPath})`;
    }
  );

  return {
    rawSource: rewritten,
    isMdx,
    toc: data.toc !== false, // default true for MDX
    frontmatter: data,
  };
}

/** List all scenario slugs that have content folders */
export function listContentSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name);
}
