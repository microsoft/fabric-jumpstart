/**
 * Content contract tests for content/scenarios/.
 *
 * These tests enforce the rules documented in content/scenarios/README.md
 * so the documentation cannot silently drift from reality.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import matter from 'gray-matter';
import { glob } from 'glob';
import type { ScenarioYml } from '@scenario/scenario';

const CONTENT_DIR = path.resolve(__dirname, '../content/scenarios');
const JUMPSTARTS_DIR = path.resolve(
  __dirname,
  '../../fabric_jumpstart/fabric_jumpstart/jumpstarts/core'
);
const RENDERER_PATH = path.resolve(
  __dirname,
  '../src/components/ScenarioContent/ScenarioContentRenderer.tsx'
);

// ── helpers ──────────────────────────────────────────────────

/** Return every subfolder inside content/scenarios/ that doesn't start with _ */
function listContentDirs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name);
}

/** Return the set of logical_ids from jumpstart YAML files. */
function loadLogicalIds(): Set<string> {
  const files = glob.sync('*.yml', { cwd: JUMPSTARTS_DIR });
  const ids = new Set<string>();
  for (const file of files) {
    const content = fs.readFileSync(path.join(JUMPSTARTS_DIR, file), 'utf-8');
    const data = yaml.load(content) as ScenarioYml;
    ids.add(data.logical_id);
  }
  return ids;
}

// ── tests ────────────────────────────────────────────────────

describe('Scenario content contract', () => {
  const dirs = listContentDirs();

  // Guard — skip the whole suite gracefully when there are no content folders
  // (e.g. fresh clone before any scenarios are authored).
  if (dirs.length === 0) {
    it('has no content folders yet (skipped)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  // ── no dual index files ────────────────────────────────────

  test.each(dirs)(
    'scenario "%s" does not have both index.mdx and index.md',
    (dir) => {
      const mdx = path.join(CONTENT_DIR, dir, 'index.mdx');
      const md = path.join(CONTENT_DIR, dir, 'index.md');
      if (fs.existsSync(mdx) && fs.existsSync(md)) {
        throw new Error(
          `"${dir}" has both index.mdx and index.md. Keep only one — .mdx takes precedence.`
        );
      }
    }
  );

  // ── every folder has an index file ─────────────────────────

  test.each(dirs)(
    'scenario "%s" contains an index.mdx or index.md',
    (dir) => {
      const mdx = fs.existsSync(path.join(CONTENT_DIR, dir, 'index.mdx'));
      const md = fs.existsSync(path.join(CONTENT_DIR, dir, 'index.md'));
      expect(mdx || md).toBe(true);
    }
  );

  // ── frontmatter title is required ──────────────────────────

  test.each(dirs)(
    'scenario "%s" has a non-empty title in frontmatter',
    (dir) => {
      const file =
        fs.existsSync(path.join(CONTENT_DIR, dir, 'index.mdx'))
          ? path.join(CONTENT_DIR, dir, 'index.mdx')
          : path.join(CONTENT_DIR, dir, 'index.md');
      const raw = fs.readFileSync(file, 'utf-8');
      const { data } = matter(raw);
      expect(data.title).toBeDefined();
      expect(typeof data.title).toBe('string');
      expect(data.title.trim().length).toBeGreaterThan(0);
    }
  );

  // ── folder name matches a jumpstart logical_id ─────────────

  test.each(dirs)(
    'scenario "%s" matches a jumpstart logical_id',
    (dir) => {
      const ids = loadLogicalIds();
      if (!ids.has(dir)) {
        throw new Error(
          `Content folder "${dir}" does not match any logical_id in jumpstarts/core/.`
        );
      }
    }
  );

  // ── only expected entries inside each folder ───────────────

  test.each(dirs)(
    'scenario "%s" contains only allowed entries (index.mdx/md, images/)',
    (dir) => {
      const allowed = new Set(['index.mdx', 'index.md', 'images']);
      const entries = fs.readdirSync(path.join(CONTENT_DIR, dir));
      const unexpected = entries.filter((e) => !allowed.has(e));
      if (unexpected.length > 0) {
        throw new Error(
          `"${dir}" contains unexpected entries: ${unexpected.join(', ')}. ` +
            `Only index.mdx, index.md, and images/ are allowed.`
        );
      }
    }
  );

  // ── relative image references resolve to existing files ────

  test.each(dirs)(
    'scenario "%s" has no broken relative image references',
    (dir) => {
      const file =
        fs.existsSync(path.join(CONTENT_DIR, dir, 'index.mdx'))
          ? path.join(CONTENT_DIR, dir, 'index.mdx')
          : path.join(CONTENT_DIR, dir, 'index.md');
      const raw = fs.readFileSync(file, 'utf-8');
      const relImageRe = /!\[[^\]]*\]\((?!https?:\/\/)([^)]+)\)/g;
      let match;
      while ((match = relImageRe.exec(raw)) !== null) {
        const imgPath = path.join(CONTENT_DIR, dir, match[1]);
        if (!fs.existsSync(imgPath)) {
          throw new Error(
            `Broken image reference in "${dir}": ${match[1]} does not exist.`
          );
        }
      }
    }
  );

  // ── MDX component tags are registered in the renderer ──────

  test.each(dirs)(
    'scenario "%s" only uses MDX components that are registered',
    (dir) => {
      const mdxPath = path.join(CONTENT_DIR, dir, 'index.mdx');
      if (!fs.existsSync(mdxPath)) return; // .md files can't use components

      const rendererSrc = fs.readFileSync(RENDERER_PATH, 'utf-8');
      // Extract component names from overrides.<Name> assignments
      const registered = new Set<string>();
      const overrideRe = /overrides\.([A-Z][A-Za-z]+)\s*=/g;
      let m;
      while ((m = overrideRe.exec(rendererSrc)) !== null) {
        registered.add(m[1]);
      }

      const content = fs.readFileSync(mdxPath, 'utf-8');
      // Match self-closing <Component /> and opening <Component> tags
      const tagRe = /<([A-Z][A-Za-z]+)[\s/>]/g;
      const used = new Set<string>();
      while ((m = tagRe.exec(content)) !== null) {
        used.add(m[1]);
      }

      const unregistered = [...used].filter((c) => !registered.has(c));
      if (unregistered.length > 0) {
        throw new Error(
          `"${dir}/index.mdx" uses unregistered components: ${unregistered.join(', ')}. ` +
            `Register them in ScenarioContentRenderer.tsx or remove the tags.`
        );
      }
    }
  );
});

// ── underscore-prefixed folders are excluded ─────────────────

describe('Content loader skips _ prefixed folders', () => {
  it('listContentDirs does not include folders starting with _', () => {
    const dirs = listContentDirs();
    const underscored = dirs.filter((d) => d.startsWith('_'));
    expect(underscored).toEqual([]);
  });
});

// ── mermaid support ──────────────────────────────────────────

describe('Mermaid rendering support', () => {
  it('ScenarioContentRenderer intercepts mermaid code blocks', () => {
    const src = fs.readFileSync(RENDERER_PATH, 'utf-8');
    expect(src).toContain("language === 'mermaid'");
    expect(src).toContain('MermaidDiagram');
  });

  it('MermaidDiagram component exists', () => {
    const componentPath = path.resolve(
      RENDERER_PATH,
      '../MermaidDiagram.tsx'
    );
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  // Validate that mermaid blocks in content files contain parseable syntax.
  // We do a lightweight structural check — the block must start with a
  // recognised mermaid diagram keyword.
  const MERMAID_KEYWORDS = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
    'gitGraph', 'mindmap', 'timeline', 'quadrantChart',
    'sankey', 'xychart', 'block',
  ];

  const dirs = listContentDirs();
  for (const dir of dirs) {
    const file =
      fs.existsSync(path.join(CONTENT_DIR, dir, 'index.mdx'))
        ? path.join(CONTENT_DIR, dir, 'index.mdx')
        : fs.existsSync(path.join(CONTENT_DIR, dir, 'index.md'))
          ? path.join(CONTENT_DIR, dir, 'index.md')
          : null;
    if (!file) continue;

    const raw = fs.readFileSync(file, 'utf-8');
    const mermaidBlocks: string[] = [];
    const re = /```mermaid\s*\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      mermaidBlocks.push(m[1].trim());
    }

    if (mermaidBlocks.length > 0) {
      test.each(mermaidBlocks.map((block, i) => ({ block, i })))(
        `"${dir}" mermaid block $i starts with a valid diagram keyword`,
        ({ block }) => {
          const firstWord = block.split(/[\s\n]/)[0];
          expect(MERMAID_KEYWORDS).toContain(firstWord);
        }
      );
    }
  }
});
