/**
 * Pre-build content generation script.
 *
 * Reads scenario YAML files from ../fabric_jumpstart/fabric_jumpstart/jumpstarts/core/
 * and generates:
 * - docs/ directory with markdown per scenario
 * - src/data/side-menu.json (navigation tree)
 * - src/data/scenarios.json (scenario cards data)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import type { ScenarioYml, ScenarioCard } from '../src/types/scenario';

const JUMPSTARTS_DIR = path.resolve(
  __dirname,
  '../../fabric_jumpstart/fabric_jumpstart/jumpstarts/core'
);
const DOCS_DIR = path.resolve(__dirname, '../docs');
const DATA_DIR = path.resolve(__dirname, '../src/data');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const WORKLOAD_ICONS_DIR = path.resolve(
  __dirname,
  '../../../assets/images/tags/workload'
);
const WORKLOAD_ICONS_PUBLIC_DIR = path.resolve(
  __dirname,
  '../public/images/tags/workload'
);

interface SideMenuItem {
  name: string;
  type: string;
  path: string;
  children: SideMenuItem[];
  frontMatter: {
    type?: string;
    title?: string;
    linkTitle?: string;
    weight?: number;
    description?: string;
  };
}

function loadScenarios(): ScenarioYml[] {
  const files = glob.sync('*.yml', { cwd: JUMPSTARTS_DIR });
  const scenarios: ScenarioYml[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(JUMPSTARTS_DIR, file), 'utf-8');
    const data = yaml.load(content) as ScenarioYml;
    scenarios.push(data);
  }

  return scenarios.sort((a, b) => a.id - b.id);
}

// Sample image source for proving relative image support
const SAMPLE_IMAGE_SRC = path.resolve(
  __dirname,
  '../../../.temp/fabric-jumpstart-web/fabric-jumpstart-docs/docs/drops_contribution_guidelines/progress_bar.png'
);

function generateFrontmatter(scenario: ScenarioYml): string {
  const title = scenario.name;
  return `---\ntype: docs\ntitle: "${title}"\nlinkTitle: "${title}"\nweight: ${scenario.id}\ndescription: >-\n  ${scenario.description}\n---\n`;
}

function generateContentMd(scenario: ScenarioYml): string {
  const title = scenario.name;
  const summary = scenario.description;

  let md = `# ${title}\n\n`;
  md += `${summary}\n\n`;

  // Include a sample image to prove relative image support
  md += `## Architecture\n\n`;
  md += `![${title} architecture](./img/sample.png)\n\n`;

  md += `## Description\n\n`;
  md += `${scenario.description}\n\n`;

  md += `This jumpstart deploys a fully functional ${title.toLowerCase()} scenario into your Microsoft Fabric workspace. `;
  md += `The scenario uses ${scenario.workload_tags.join(' and ')} workloads to demonstrate real-world patterns.\n`;

  return md;
}

function generateDocs(scenarios: ScenarioYml[]): void {
  // Clean docs dir
  if (fs.existsSync(DOCS_DIR)) {
    fs.rmSync(DOCS_DIR, { recursive: true });
  }

  // Create root _index.md
  const rootDocsDir = path.join(DOCS_DIR, 'fabric_jumpstart');
  fs.mkdirSync(rootDocsDir, { recursive: true });
  fs.writeFileSync(
    path.join(DOCS_DIR, '_index.md'),
    '---\ntype: docs\n---\n'
  );
  fs.writeFileSync(
    path.join(rootDocsDir, '_index.md'),
    '---\ntype: docs\ntitle: "Jumpstart Scenarios"\nlinkTitle: "Jumpstart Scenarios"\nweight: 2\n---\n'
  );

  // Generate docs per listed scenario
  for (const scenario of scenarios) {
    if (!scenario.include_in_listing) continue;

    const scenarioDir = path.join(rootDocsDir, scenario.logical_id);
    const imgDir = path.join(scenarioDir, 'img');
    fs.mkdirSync(imgDir, { recursive: true });

    // Minimal frontmatter-only _index.md (for side-menu)
    const frontmatter = generateFrontmatter(scenario);
    fs.writeFileSync(path.join(scenarioDir, '_index.md'), frontmatter);

    // Rich markdown content file
    const contentMd = generateContentMd(scenario);
    fs.writeFileSync(path.join(scenarioDir, 'content.md'), contentMd);

    // Copy a sample image to prove relative image support
    if (fs.existsSync(SAMPLE_IMAGE_SRC)) {
      fs.copyFileSync(SAMPLE_IMAGE_SRC, path.join(imgDir, 'sample.png'));
      // Also copy to public/ so Next.js can serve it
      const publicImgDir = path.join(
        PUBLIC_DIR,
        'docs',
        'fabric_jumpstart',
        scenario.logical_id,
        'img'
      );
      fs.mkdirSync(publicImgDir, { recursive: true });
      fs.copyFileSync(SAMPLE_IMAGE_SRC, path.join(publicImgDir, 'sample.png'));
    }
  }
}

function generateSideMenu(scenarios: ScenarioYml[]): SideMenuItem {
  const children: SideMenuItem[] = [];

  for (const scenario of scenarios) {
    if (!scenario.include_in_listing) continue;

    children.push({
      name: scenario.logical_id,
      type: 'directory',
      path: `fabric_jumpstart/${scenario.logical_id}`,
      children: [],
      frontMatter: {
        type: 'docs',
        title: scenario.name,
        linkTitle: scenario.name,
        weight: scenario.id,
        description: scenario.description,
      },
    });
  }

  const root: SideMenuItem = {
    name: 'docs',
    type: 'directory',
    path: '',
    frontMatter: { type: 'docs' },
    children: [
      {
        name: 'fabric_jumpstart',
        type: 'directory',
        path: 'fabric_jumpstart',
        frontMatter: {
          type: 'docs',
          title: 'Jumpstart Scenarios',
          linkTitle: 'Jumpstart Scenarios',
          weight: 2,
        },
        children,
      },
    ],
  };

  return root;
}

function stripMarkdownToPlainText(md: string): string {
  return md
    .replace(/---[\s\S]*?---/, '')      // frontmatter
    .replace(/!\[.*?\]\(.*?\)/g, '')     // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // links → text
    .replace(/#{1,6}\s+/g, '')           // headings
    .replace(/[*_~`>]/g, '')             // inline formatting
    .replace(/\n{2,}/g, ' ')            // collapse blank lines
    .replace(/\s+/g, ' ')               // normalise whitespace
    .trim();
}

function generateScenariosJson(scenarios: ScenarioYml[]): ScenarioCard[] {
  return scenarios
    .filter((s) => s.include_in_listing)
    .map((s) => {
      // Read body content from generated content.md
      const contentPath = path.join(
        DOCS_DIR,
        'fabric_jumpstart',
        s.logical_id,
        'content.md'
      );
      let body = '';
      if (fs.existsSync(contentPath)) {
        body = stripMarkdownToPlainText(
          fs.readFileSync(contentPath, 'utf-8')
        );
      }

      return {
        id: s.logical_id,
        title: s.name,
        description: s.description,
        type: s.type,
        difficulty: s.difficulty || 'Intermediate',
        tags: [...s.workload_tags, ...s.scenario_tags],
        workloadTags: s.workload_tags as string[],
        previewImage: `https://placehold.co/600x400?text=${encodeURIComponent(s.name)}`,
        videoUrl: s.video_url || '',
        minutesToDeploy: s.minutes_to_deploy,
        minutesToComplete: s.minutes_to_complete_jumpstart,
        itemsInScope: s.items_in_scope,
        docsUri: s.jumpstart_docs_uri,
        slug: s.logical_id,
        lastUpdated: s.last_updated || s.date_added,
        body,
      };
    });
}

// ─── Workload color extraction ────────────────────────────────

interface WorkloadColorEntry {
  light: string;
  accent: string;
  mid: string;
  icon: string;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function extractColorsFromSvg(svgContent: string): string[] {
  const colorRegex = /(fill|stop-color)="(#[0-9a-fA-F]{6})"/g;
  const colors = new Set<string>();
  let match;
  while ((match = colorRegex.exec(svgContent)) !== null) {
    const hex = match[2].toUpperCase();
    // Skip near-black/grey fills used for base shapes
    const { s, l } = hexToHsl(hex);
    if (s > 0.05 || l > 0.6) colors.add(hex);
  }
  return [...colors];
}

function pickWorkloadColors(
  colors: string[]
): { light: string; accent: string; mid: string } {
  if (colors.length === 0) {
    return { light: '#E8F4FD', accent: '#0078D4', mid: '#5CB8E6' };
  }
  const withHsl = colors.map((hex) => ({ hex, ...hexToHsl(hex) }));
  withHsl.sort((a, b) => b.l - a.l);

  const light = withHsl[0];
  // Accent: most saturated color with moderate-to-low lightness
  const accentCandidates = withHsl.filter((c) => c.l < 0.6 && c.s > 0.3);
  const accent = accentCandidates.length > 0
    ? accentCandidates.sort((a, b) => b.s - a.s)[0]
    : withHsl[withHsl.length - 1];
  // Mid: prefer a color whose hue is close to the lightest, at moderate lightness
  const hueDist = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  const midCandidates = withHsl
    .filter((c) => c.l > 0.3 && c.l < 0.75 && c.hex !== light.hex && c.hex !== accent.hex)
    .sort((a, b) => hueDist(a.h, light.h) - hueDist(b.h, light.h));
  const mid = midCandidates.length > 0 ? midCandidates[0] : withHsl[Math.floor(withHsl.length / 2)];

  return { light: light.hex, accent: accent.hex, mid: mid.hex };
}

function toSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateWorkloadColors(scenarios: ScenarioYml[]): void {
  const allTags = new Set<string>();
  for (const s of scenarios) {
    for (const t of s.workload_tags) allTags.add(t);
  }

  const result: Record<string, WorkloadColorEntry> = {};
  const extensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];

  for (const tag of [...allTags].sort()) {
    const slug = toSlug(tag);
    let iconPath = '';
    for (const ext of extensions) {
      const candidate = path.join(WORKLOAD_ICONS_DIR, `${slug}${ext}`);
      if (fs.existsSync(candidate)) {
        iconPath = `/images/tags/workload/${slug}${ext}`;
        break;
      }
    }

    let colors = { light: '#E8F4FD', accent: '#0078D4', mid: '#5CB8E6' };
    const svgPath = path.join(WORKLOAD_ICONS_DIR, `${slug}.svg`);
    if (fs.existsSync(svgPath)) {
      const svgContent = fs.readFileSync(svgPath, 'utf-8');
      const extracted = extractColorsFromSvg(svgContent);
      colors = pickWorkloadColors(extracted);
    }

    result[tag] = { ...colors, icon: iconPath };
  }

  fs.writeFileSync(
    path.join(DATA_DIR, 'workload-colors.json'),
    JSON.stringify(result, null, 2)
  );
}

function copyWorkloadIcons(): void {
  fs.mkdirSync(WORKLOAD_ICONS_PUBLIC_DIR, { recursive: true });
  const files = fs.readdirSync(WORKLOAD_ICONS_DIR);
  for (const file of files) {
    fs.copyFileSync(
      path.join(WORKLOAD_ICONS_DIR, file),
      path.join(WORKLOAD_ICONS_PUBLIC_DIR, file)
    );
  }
}

async function main(): Promise<void> {
  console.log('🔧 Generating website content from scenario YAMLs...');

  const scenarios = loadScenarios();
  console.log(`  Found ${scenarios.length} scenarios`);

  // Generate docs
  generateDocs(scenarios);
  const listed = scenarios.filter((s) => s.include_in_listing).length;
  console.log(`  Generated docs for ${listed} listed scenarios`);

  // Generate data files
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const sideMenu = generateSideMenu(scenarios);
  fs.writeFileSync(
    path.join(DATA_DIR, 'side-menu.json'),
    JSON.stringify(sideMenu, null, 2)
  );
  console.log('  Generated side-menu.json');

  const scenariosJson = generateScenariosJson(scenarios);
  fs.writeFileSync(
    path.join(DATA_DIR, 'scenarios.json'),
    JSON.stringify(scenariosJson, null, 2)
  );
  console.log('  Generated scenarios.json');

  // Generate workload color palette
  generateWorkloadColors(scenarios);
  console.log('  Generated workload-colors.json');

  // Copy shared workload icons to public/ for serving
  copyWorkloadIcons();
  console.log('  Copied workload icons to public/');

  // Fetch Microsoft UHF footer
  await generateUhfData();

  console.log('✅ Content generation complete!');
}

async function generateUhfData(): Promise<void> {
  const UHF_URL =
    'https://uhf.microsoft.com/en-US/shell/xml/AZCloudNative?headerId=AZCloudNativeHeader&footerId=AZCloudNativeFooter';

  try {
    const response = await fetch(UHF_URL);
    const xml = await response.text();

    const extract = (tag: string): string => {
      const re = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`);
      const match = xml.match(re);
      return match ? match[1] : '';
    };

    const uhf = {
      cssIncludes: extract('cssIncludes'),
      javascriptIncludes: extract('javascriptIncludes'),
      footerHtml: extract('footerHtml'),
    };

    fs.writeFileSync(
      path.join(DATA_DIR, 'uhf.json'),
      JSON.stringify(uhf, null, 2)
    );
    console.log('  Generated uhf.json (Microsoft UHF footer)');
  } catch (e) {
    console.warn('  ⚠ Failed to fetch UHF data, using empty fallback:', e);
    fs.writeFileSync(
      path.join(DATA_DIR, 'uhf.json'),
      JSON.stringify({ cssIncludes: '', javascriptIncludes: '', footerHtml: '' })
    );
  }
}

main();
