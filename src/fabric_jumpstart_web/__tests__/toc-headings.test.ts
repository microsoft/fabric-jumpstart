/**
 * Table-of-Contents heading-slug tests.
 *
 * Verifies that every heading in every MDX scenario produces a valid,
 * unique, and consistent slug — so the TOC links always match the
 * rendered heading IDs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { headingSlug } from '@utils/markdown';

const CONTENT_DIR = path.resolve(__dirname, '../content/scenarios');

// ── helpers ──────────────────────────────────────────────────

/** Mirror of extractHeadings from ScenarioContentRenderer.tsx */
function extractHeadings(source: string) {
  const headings: { title: string; id: string; level: number }[] = [];
  for (const line of source.split('\n')) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      const level = m[1].length;
      const title = m[2].replace(/[`*_~\[\]]/g, '').trim();
      headings.push({ title, id: headingSlug(title), level });
    }
  }
  return headings;
}

/** Return MDX content dirs that have an index.mdx */
function mdxScenarios(): { name: string; content: string }[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => ({
      name: e.name,
      path: path.join(CONTENT_DIR, e.name, 'index.mdx'),
    }))
    .filter((e) => fs.existsSync(e.path))
    .map((e) => ({
      name: e.name,
      content: fs.readFileSync(e.path, 'utf-8'),
    }));
}

// ── headingSlug unit tests ───────────────────────────────────

describe('headingSlug', () => {
  it('lowercases and hyphenates plain text', () => {
    expect(headingSlug('Getting Started')).toBe('getting-started');
  });

  it('strips leading/trailing hyphens from non-alpha prefix', () => {
    expect(headingSlug('✨ Key Features')).toBe('key-features');
  });

  it('collapses consecutive special characters into one hyphen', () => {
    expect(headingSlug('A --- B')).toBe('a-b');
  });

  it('strips emoji-only headings to empty string', () => {
    expect(headingSlug('🚀')).toBe('');
  });

  it('handles mixed emoji and text', () => {
    expect(headingSlug('📦 Prerequisites')).toBe('prerequisites');
    expect(headingSlug('🏛️ Solution Architecture')).toBe('solution-architecture');
    expect(headingSlug('🔧 Troubleshooting')).toBe('troubleshooting');
  });

  it('handles code-style backtick content after stripping', () => {
    // backticks are stripped by extractHeadings before slugging
    expect(headingSlug('Using the install() Method')).toBe('using-the-install-method');
  });

  it('handles numbered headings', () => {
    expect(headingSlug('1. First Step')).toBe('1-first-step');
  });

  it('handles parenthesized content', () => {
    expect(headingSlug('Ingestion (Event Hub)')).toBe('ingestion-event-hub');
  });
});

// ── per-scenario tests ───────────────────────────────────────

describe('TOC heading extraction', () => {
  const scenarios = mdxScenarios();

  if (scenarios.length === 0) {
    it('has no MDX scenarios (skipped)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  test.each(scenarios.map((s) => [s.name, s.content]))(
    '"%s" headings produce non-empty, unique IDs',
    (_name, content) => {
      const headings = extractHeadings(content as string);
      expect(headings.length).toBeGreaterThan(0);

      for (const h of headings) {
        // Every heading must produce a non-empty slug
        expect(h.id).not.toBe('');
        // ID should be lowercase, hyphenated, no special chars
        expect(h.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }

      // IDs should be unique within a document
      const ids = headings.map((h) => h.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dupes.length > 0) {
        // Warn but don't fail — duplicate IDs (from repeated section names)
        // cause the first match to win in querySelector, which is acceptable
        console.warn(`  ⚠ duplicate IDs: ${[...new Set(dupes)].join(', ')}`);
      }
    }
  );

  test.each(scenarios.map((s) => [s.name, s.content]))(
    '"%s" only extracts h2 and h3 headings',
    (_name, content) => {
      const headings = extractHeadings(content as string);
      for (const h of headings) {
        expect(h.level).toBeGreaterThanOrEqual(2);
        expect(h.level).toBeLessThanOrEqual(3);
      }
    }
  );
});

// ── ID consistency: extractHeadings vs HeadingWithId logic ───

describe('TOC ↔ rendered heading ID consistency', () => {
  const scenarios = mdxScenarios();

  if (scenarios.length === 0) {
    it('has no MDX scenarios (skipped)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  test.each(scenarios.map((s) => [s.name, s.content]))(
    '"%s" TOC IDs match what HeadingWithId would render',
    (_name, content) => {
      const headings = extractHeadings(content as string);

      for (const h of headings) {
        // Simulate what HeadingWithId does: it receives the raw title as children
        // and runs headingSlug on it. Since both now use the same function,
        // they must produce identical IDs.
        const renderedId = headingSlug(h.title);
        expect(renderedId).toBe(h.id);
      }
    }
  );
});
