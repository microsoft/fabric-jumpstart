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

/**
 * Fonts that drive Mermaid's dagre layout. Node labels render in Consolas and
 * type/subgraph text in Segoe UI (see MermaidDiagram/enhance.ts). Dagre sizes
 * every node from its measured label, so if these fonts are missing the browser
 * falls back to metrically different fonts (DejaVu Sans / DejaVu Sans Mono),
 * producing a different layout than the web diagram-generator (which runs in a
 * browser where Segoe UI / Consolas are present). We locate the real font files
 * and inject them as @font-face rules so headless rendering matches.
 */
interface FontFace {
  family: string;
  weight: number;
  filenames: string[];
}

const REQUIRED_FONTS: FontFace[] = [
  { family: 'Segoe UI', weight: 400, filenames: ['segoeui.ttf', 'SegoeUI.ttf'] },
  { family: 'Segoe UI', weight: 600, filenames: ['seguisb.ttf', 'SegoeUI-Semibold.ttf'] },
  { family: 'Segoe UI', weight: 700, filenames: ['segoeuib.ttf', 'SegoeUI-Bold.ttf'] },
  { family: 'Consolas', weight: 400, filenames: ['consola.ttf', 'Consolas.ttf'] },
  { family: 'Consolas', weight: 700, filenames: ['consolab.ttf', 'Consolas-Bold.ttf'] },
];

/** Candidate directories that may contain the Windows fonts (incl. WSL / macOS). */
function fontSearchDirs(): string[] {
  const dirs: string[] = [];
  if (process.env.DIAGRAM_FONT_DIR) dirs.push(process.env.DIAGRAM_FONT_DIR);
  if (process.platform === 'win32') {
    dirs.push(path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts'));
    if (process.env.LOCALAPPDATA) dirs.push(path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Windows', 'Fonts'));
  } else {
    dirs.push('/mnt/c/Windows/Fonts'); // WSL
    dirs.push('/usr/share/fonts', '/usr/local/share/fonts');
    if (process.env.HOME) dirs.push(path.join(process.env.HOME, '.fonts'), path.join(process.env.HOME, '.local/share/fonts'));
    dirs.push('/Library/Fonts', '/Library/Fonts/Microsoft'); // macOS
    if (process.env.HOME) dirs.push(path.join(process.env.HOME, 'Library/Fonts'));
  }
  return dirs.filter((d) => fs.existsSync(d));
}

/** Recursively find a font file by candidate basenames (case-insensitive). */
function findFontFile(dirs: string[], filenames: string[]): string | null {
  const wanted = new Set(filenames.map((f) => f.toLowerCase()));
  for (const dir of dirs) {
    const hits = glob.sync('**/*.ttf', { cwd: dir, nocase: true, absolute: true });
    for (const hit of hits) {
      if (wanted.has(path.basename(hit).toLowerCase())) return hit;
    }
  }
  return null;
}

/** Build @font-face CSS embedding the discovered Segoe UI / Consolas faces. */
function buildFontFaceCss(): { css: string; found: string[]; missing: string[] } {
  const dirs = fontSearchDirs();
  const rules: string[] = [];
  const found: string[] = [];
  const missing: string[] = [];
  for (const face of REQUIRED_FONTS) {
    const file = dirs.length ? findFontFile(dirs, face.filenames) : null;
    const label = `${face.family} ${face.weight}`;
    if (!file) {
      missing.push(label);
      continue;
    }
    const b64 = fs.readFileSync(file).toString('base64');
    rules.push(
      `@font-face{font-family:'${face.family}';font-weight:${face.weight};font-style:normal;` +
        `src:url(data:font/ttf;base64,${b64}) format('truetype');}`
    );
    found.push(label);
  }
  return { css: rules.join('\n'), found, missing };
}


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

/**
 * Make browser-serialized SVG markup valid XML.
 *
 * Mermaid renders node labels as HTML inside <foreignObject>. Reading the
 * result back via `innerHTML` HTML-serializes void elements without a closing
 * slash (e.g. `<br/>` in a label becomes `<br>`), which is invalid XML and
 * prevents the committed `.svg` file from rendering. Self-close known void
 * elements so the output parses as XML.
 */
function xmlSafeSvg(svg: string): string {
  const voidTags = ['br', 'hr', 'img', 'input', 'area', 'base', 'col', 'embed', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  const re = new RegExp(`<(${voidTags.join('|')})((?:\\s[^>]*?)?)\\s*/?>`, 'gi');
  return svg.replace(re, '<$1$2/>');
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

  // Embed the real layout fonts so headless measurement matches the web tool.
  const { css: fontCss, found: fontsFound, missing: fontsMissing } = buildFontFaceCss();
  if (fontCss) {
    await page.addStyleTag({ content: fontCss });
    // Wait until every embedded face is actually loaded before any render, so
    // Mermaid measures node labels with the correct metrics.
    await page.evaluate(async (families: string[]) => {
      await Promise.all(
        families.map((f) => (document as unknown as { fonts: FontFaceSet }).fonts.load(f))
      );
      await (document as unknown as { fonts: FontFaceSet }).fonts.ready;
    }, ['400 16px "Segoe UI"', '600 16px "Segoe UI"', '700 16px "Segoe UI"', '400 16px "Consolas"', '700 16px "Consolas"']);
    console.log(`  Embedded layout fonts: ${fontsFound.join(', ')}`);
  }
  if (fontsMissing.length) {
    console.warn(
      `  ⚠ Missing layout fonts (${fontsMissing.join(', ')}) — diagram layout may differ from the web diagram-generator. ` +
        `Set DIAGRAM_FONT_DIR to a folder containing Segoe UI / Consolas .ttf files.`
    );
  }

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
              securityLevel: 'loose',
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

        fs.writeFileSync(outFile, xmlSafeSvg(svg));
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
