/**
 * Pre-build content generation script.
 *
 * Reads scenario YAML files from ../fabric_jumpstart/jumpstarts/core/
 * and generates:
 * - docs/ directory with markdown per scenario
 * - src/data/side-menu.json (navigation tree)
 * - src/data/scenarios.json (scenario cards data)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';

const JUMPSTARTS_DIR = path.resolve(
  __dirname,
  '../../fabric_jumpstart/jumpstarts/core'
);
const DOCS_DIR = path.resolve(__dirname, '../docs');
const DATA_DIR = path.resolve(__dirname, '../src/data');
const PUBLIC_DIR = path.resolve(__dirname, '../public');

interface ScenarioYml {
  id: number;
  logical_id: string;
  name: string;
  description: string;
  date_added: string;
  include_in_listing: boolean;
  workload_tags: string[];
  scenario_tags: string[];
  type: string;
  source: {
    repo_url?: string;
    repo_ref?: string;
    workspace_path: string;
    preview_image_path: string;
  };
  items_in_scope: string[];
  jumpstart_docs_uri: string;
  entry_point: string;
  owner_email: string;
  minutes_to_deploy: number;
  minutes_to_complete_jumpstart: number;
  web?: {
    title?: string;
    summary?: string;
    preview_image_url?: string;
    video_url?: string;
    tags_display?: string[];
    difficulty?: string;
    last_updated?: string;
  };
}

interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  tags: string[];
  previewImage: string;
  videoUrl: string;
  minutesToDeploy: number;
  minutesToComplete: number;
  itemsInScope: string[];
  docsUri: string;
  slug: string;
  lastUpdated: string;
  body: string;
}

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
  const title = scenario.web?.title || scenario.name;
  return `---\ntype: docs\ntitle: "${title}"\nlinkTitle: "${title}"\nweight: ${scenario.id}\ndescription: >-\n  ${scenario.description}\n---\n`;
}

function generateContentMd(scenario: ScenarioYml): string {
  const title = scenario.web?.title || scenario.name;
  const summary = scenario.web?.summary || scenario.description;

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
        title: scenario.web?.title || scenario.name,
        linkTitle: scenario.web?.title || scenario.name,
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
        title: s.web?.title || s.name,
        description: s.web?.summary || s.description,
        type: s.type,
        difficulty: s.web?.difficulty || 'Intermediate',
        tags: s.web?.tags_display || [...s.workload_tags, ...s.scenario_tags],
        previewImage:
          s.web?.preview_image_url ||
          `https://placehold.co/600x400?text=${encodeURIComponent(s.name)}`,
        videoUrl: s.web?.video_url || '',
        minutesToDeploy: s.minutes_to_deploy,
        minutesToComplete: s.minutes_to_complete_jumpstart,
        itemsInScope: s.items_in_scope,
        docsUri: s.jumpstart_docs_uri,
        slug: s.logical_id,
        lastUpdated: s.web?.last_updated || s.date_added,
        body,
      };
    });
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
