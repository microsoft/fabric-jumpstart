#!/usr/bin/env node
/**
 * Pre-render Mermaid mermaid_diagram diagrams to static SVG files.
 *
 * Uses puppeteer to replicate the exact same rendering pipeline as the
 * client-side MermaidDiagram component: mermaid.render() → enhanceDiagram().
 *
 * Outputs dark + light SVGs to assets/images/diagrams/.
 *
 * Usage: npx tsx tools/render-diagrams.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const WEB_ROOT = path.resolve(REPO_ROOT, 'src/fabric_jumpstart_web');
const JUMPSTARTS_DIRS = [
  path.resolve(REPO_ROOT, 'src/fabric_jumpstart/fabric_jumpstart/jumpstarts/core'),
  path.resolve(REPO_ROOT, 'src/fabric_jumpstart/fabric_jumpstart/jumpstarts/community'),
];
const OUTPUT_DIR = path.resolve(REPO_ROOT, 'assets/images/diagrams');
const ICONS_JSON = path.join(WEB_ROOT, 'src/data/fabric-item-icons.json');

/** Generate fabric-item-icons.json from @fabric-msft/svg-icons if stale/missing. */
function ensureItemIconsJson(): void {
  const iconsDir = path.resolve(WEB_ROOT, 'node_modules/@fabric-msft/svg-icons/dist/svg');
  if (!fs.existsSync(iconsDir)) {
    console.warn('  ⚠ @fabric-msft/svg-icons not installed — skipping icon generation');
    return;
  }

  // Read FABRIC_ITEM_ICON_MAP from mermaidParser.ts
  const parserSrc = fs.readFileSync(
    path.join(WEB_ROOT, 'src/utils/mermaidParser.ts'),
    'utf8'
  );
  const mapMatch = parserSrc.match(
    /export const FABRIC_ITEM_ICON_MAP[^{]*(\{[\s\S]*?\n\})/
  );
  if (!mapMatch) throw new Error('Could not extract FABRIC_ITEM_ICON_MAP');
  // eslint-disable-next-line no-eval
  const iconMap = eval(`(${mapMatch[1]})`) as Record<string, string>;

  const result: Record<string, string> = {};
  for (const [itemType, svgFile] of Object.entries(iconMap)) {
    const svgPath = path.join(iconsDir, svgFile);
    if (fs.existsSync(svgPath)) {
      const b64 = fs.readFileSync(svgPath).toString('base64');
      result[itemType] = `data:image/svg+xml;base64,${b64}`;
    } else {
      console.warn(`  ⚠ Missing icon for ${itemType}: ${svgFile}`);
    }
  }

  fs.mkdirSync(path.dirname(ICONS_JSON), { recursive: true });
  fs.writeFileSync(ICONS_JSON, JSON.stringify(result, null, 2));
  console.log(`  Generated fabric-item-icons.json (${Object.keys(result).length} icons)`);
}

interface JumpstartInfo {
  logicalId: string;
  mermaid_diagram: string;
}

function loadJumpstarts(): JumpstartInfo[] {
  const results: JumpstartInfo[] = [];
  for (const dir of JUMPSTARTS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = glob.sync(path.join(dir, '*.yml'));
    for (const file of files) {
      const raw = yaml.load(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
      if (raw.mermaid_diagram && raw.logical_id) {
        results.push({
          logicalId: raw.logical_id as string,
          mermaid_diagram: raw.mermaid_diagram as string,
        });
      }
    }
  }
  return results;
}

/**
 * Ensure Chrome system libraries are available.
 * Downloads .deb packages and extracts them if libnss3 is missing.
 */
function ensureChromeLibs(): string {
  const libDir = '/tmp/chrome-libs/extracted/usr/lib/x86_64-linux-gnu';
  if (fs.existsSync(path.join(libDir, 'libnss3.so'))) return libDir;

  try {
    execSync('ldconfig -p 2>/dev/null | grep -q "libnss3.so"', { stdio: 'pipe' });
    return '';
  } catch {
    // libnss3 not in system
  }

  console.log('  Installing Chrome dependencies...');
  try {
    execSync(
      'mkdir -p /tmp/chrome-libs && cd /tmp/chrome-libs && ' +
        'apt-get download libnss3 libnspr4 libasound2t64 2>/dev/null && ' +
        'for f in *.deb; do dpkg-deb -x "$f" ./extracted; done',
      { stdio: 'pipe', timeout: 30000 }
    );
    return libDir;
  } catch {
    return '';
  }
}

/** Build the inline data needed to drive enhance.ts inside the browser. */
async function buildEnhancePayload(): Promise<{
  enhanceScript: string;
  itemIcons: Record<string, string>;
  itemDisplayNames: Record<string, string>;
}> {
  // Load item icon data URIs
  const itemIcons = JSON.parse(
    fs.readFileSync(path.join(WEB_ROOT, 'src/data/fabric-item-icons.json'), 'utf8')
  );

  // Load item display names
  const itemDisplayNames = JSON.parse(
    fs.readFileSync(path.join(WEB_ROOT, 'src/data/item-display-names.json'), 'utf8')
  );

  // Load the enhance.ts source and transpile to browser-compatible JS
  const enhanceSrc = fs.readFileSync(
    path.join(WEB_ROOT, 'src/components/MermaidDiagram/enhance.ts'),
    'utf8'
  );

  // Strip imports and externalized data references before transpiling
  const strippedTs = enhanceSrc
    .replace(/^import\s+.*;\s*$/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(
      /const itemIcons = itemIconData as Record<string, string>;/,
      '// itemIcons injected globally'
    )
    .replace(
      /const itemDisplayNames = itemDisplayNamesData as Record<string, string>;/,
      '// itemDisplayNames injected globally'
    );

  // Transpile TS → JS
  const ts = await import('typescript');
  const { outputText: enhanceScript } = ts.transpileModule(strippedTs, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      removeComments: false,
      strict: false,
    },
  });

  return { enhanceScript, itemIcons, itemDisplayNames };
}

async function main(): Promise<void> {
  console.log('🎨 Rendering Mermaid mermaid_diagram diagrams...');

  ensureItemIconsJson();

  const extraLibPath = ensureChromeLibs();
  if (extraLibPath) {
    process.env.LD_LIBRARY_PATH = extraLibPath +
      (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
  }

  const jumpstarts = loadJumpstarts();
  console.log(`  Found ${jumpstarts.length} jumpstarts with mermaid_diagram diagrams`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const payload = await buildEnhancePayload();

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // Load Mermaid from node_modules
  const mermaidJs = fs.readFileSync(
    path.join(WEB_ROOT, 'node_modules/mermaid/dist/mermaid.min.js'),
    'utf8'
  );

  // Set up the page with Mermaid + enhance logic
  await page.setContent(`<!DOCTYPE html>
    <html><head><style>body{margin:0;padding:0;}</style></head>
    <body><div id="container"></div></body></html>`);

  await page.evaluate(mermaidJs);

  // Inject enhance dependencies and script
  await page.evaluate(
    (icons, displayNames, enhScript) => {
      // Make data available globally
      (window as Record<string, unknown>).itemIcons = icons;
      (window as Record<string, unknown>).itemDisplayNames = displayNames;

      // Inject the enhance script
      const script = document.createElement('script');
      script.textContent = `
        const itemIcons = window.itemIcons;
        const itemDisplayNames = window.itemDisplayNames;
        ${enhScript}
        window.enhanceDiagram = enhanceDiagram;
      `;
      document.head.appendChild(script);
    },
    payload.itemIcons,
    payload.itemDisplayNames,
    payload.enhanceScript
  );

  let success = 0;
  let failed = 0;

  for (const js of jumpstarts) {
    for (const isDark of [false, true]) {
      const themeName = isDark ? 'dark' : 'light';
      const outFile = path.join(OUTPUT_DIR, `${js.logicalId}_${themeName}.svg`);

      try {
        const svg = await page.evaluate(
          async (chart: string, dark: boolean) => {
            const mermaid = (window as Record<string, unknown>).mermaid as {
              initialize: (cfg: Record<string, unknown>) => void;
              render: (id: string, chart: string) => Promise<{ svg: string }>;
            };
            const enhance = (window as { enhanceDiagram?: (root: SVGSVGElement, chart: string, isDark: boolean) => void }).enhanceDiagram;

            // Same config as MermaidDiagram/index.tsx
            mermaid.initialize({
              startOnLoad: false,
              theme: 'base',
              themeVariables: {
                primaryColor: dark ? '#2a2a32' : '#f5f8fa',
                primaryTextColor: dark ? '#e0e0e0' : '#242424',
                primaryBorderColor: dark ? '#4a4a55' : '#c8c8c8',
                lineColor: dark ? '#5a8a9a' : '#219580',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '13px',
              },
              flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis',
                padding: 22,
                nodeSpacing: 70,
                rankSpacing: 85,
              },
            });

            const id = `diagram-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const container = document.getElementById('container')!;
            // Strip :::Type from subgraph lines (Mermaid doesn't support it)
            const mermaidChart = chart.replace(/^(\s*subgraph\s+.+?):::(\w+)\s*$/gm, '$1');
            const { svg } = await mermaid.render(id, mermaidChart);
            container.innerHTML = svg;

            const svgEl = container.querySelector('svg') as SVGSVGElement;
            if (svgEl && enhance) {
              // Pass original chart so enhance can parse :::Type
              enhance(svgEl, chart, dark);
            }

            return container.innerHTML;
          },
          js.mermaid_diagram,
          isDark
        );

        fs.writeFileSync(outFile, svg);
        success++;
      } catch (e) {
        const msg = e instanceof Error ? e.message.split('\n')[0] : String(e);
        console.error(`  ✗ ${js.logicalId} (${themeName}): ${msg}`);
        failed++;
      }
    }
    console.log(`  ✓ ${js.logicalId}`);
  }

  await browser.close();

  // Copy rendered SVGs to public directory for dev server
  const PUBLIC_DIR = path.resolve(WEB_ROOT, 'public/images/diagrams');
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const svgFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.svg'));
  for (const f of svgFiles) {
    fs.copyFileSync(path.join(OUTPUT_DIR, f), path.join(PUBLIC_DIR, f));
  }

  console.log(
    `✅ Rendered ${success} SVGs (${failed} failed) to ${path.relative(REPO_ROOT, OUTPUT_DIR)}/`
  );
  console.log(
    `   Copied ${svgFiles.length} SVGs to ${path.relative(REPO_ROOT, PUBLIC_DIR)}/`
  );
}

main();
