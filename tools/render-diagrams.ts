#!/usr/bin/env node
/**
 * Pre-render Mermaid architecture diagrams to static SVG files.
 *
 * Reads `architecture` fields from jumpstart YAML files, renders them via
 * mermaid-cli (mmdc), and outputs dark + light SVGs with Fabric item icons
 * to assets/images/diagrams/.
 *
 * Usage: npx tsx tools/render-diagrams.ts
 *
 * Note: Requires Chrome/Chromium system libraries. If missing (e.g. in a
 * devcontainer), the script will attempt to extract them from .deb packages.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const JUMPSTARTS_DIR = path.resolve(
  REPO_ROOT,
  'src/fabric_jumpstart/fabric_jumpstart/jumpstarts/core'
);
const OUTPUT_DIR = path.resolve(REPO_ROOT, 'assets/images/diagrams');
const MMDC = path.resolve(REPO_ROOT, 'node_modules/.bin/mmdc');
const ICONS_DIR = path.resolve(
  REPO_ROOT,
  'src/fabric_jumpstart_web/node_modules/@fabric-msft/svg-icons/dist/svg'
);

/** Map of Fabric item class names to SVG icon filenames. */
const FABRIC_ITEM_ICON_MAP: Record<string, string> = {
  Notebook: 'notebook_20_item.svg',
  Lakehouse: 'lakehouse_20_item.svg',
  Environment: 'environment_20_item.svg',
  SparkJobDefinition: 'spark_job_direction_20_item.svg',
  VariableLibrary: 'variable_library_20_item.svg',
  Eventhouse: 'event_house_20_item.svg',
  Eventstream: 'eventstream_20_item.svg',
  KQLDatabase: 'kql_database_20_item.svg',
  KQLQueryset: 'kql_queryset_20_item.svg',
  KQLDashboard: 'real_time_dashboard_20_item.svg',
  Reflex: 'generic_placeholder_20_item.svg',
  DataPipeline: 'pipeline_20_item.svg',
  Dataflow: 'dataflow_gen2_20_item.svg',
  CopyJob: 'copy_job_20_item.svg',
  Warehouse: 'data_warehouse_20_item.svg',
  SQLEndpoint: 'data_warehouse_20_item.svg',
  MirroredDatabase: 'mirrored_generic_database_20_item.svg',
  SQLDatabase: 'sql_database_20_item.svg',
  Report: 'report_20_item.svg',
  SemanticModel: 'semantic_model_20_item.svg',
  DataAgent: 'data_agent_20_item.svg',
  MLExperiment: 'experiments_20_item.svg',
  UserDataFunction: 'user_data_function_20_item.svg',
  GraphQLApi: 'generic_placeholder_20_item.svg',
};

/** Build a data URI for an SVG icon file. */
function iconDataUri(svgFile: string): string | null {
  const p = path.join(ICONS_DIR, svgFile);
  if (!fs.existsSync(p)) return null;
  const b64 = fs.readFileSync(p).toString('base64');
  return `data:image/svg+xml;base64,${b64}`;
}

// Pre-compute icon data URIs
const ICON_URIS: Record<string, string> = {};
for (const [itemType, svgFile] of Object.entries(FABRIC_ITEM_ICON_MAP)) {
  const uri = iconDataUri(svgFile);
  if (uri) ICON_URIS[itemType] = uri;
}

/**
 * Ensure Chrome system libraries are available.
 * Downloads .deb packages and extracts them if libnss3 is missing.
 * Returns the LD_LIBRARY_PATH addition needed, or empty string.
 */
function ensureChromeLibs(): string {
  const libDir = '/tmp/chrome-libs/extracted/usr/lib/x86_64-linux-gnu';

  // Check if libs already extracted from a previous run
  if (fs.existsSync(path.join(libDir, 'libnss3.so'))) {
    return libDir;
  }

  // Check if system already has the library
  try {
    execSync('ldconfig -p 2>/dev/null | grep -q "libnss3.so"', { stdio: 'pipe' });
    return '';
  } catch {
    // libnss3 not in system — need to extract
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
  } catch (e) {
    console.warn('  ⚠ Could not install Chrome dependencies. Pre-rendering skipped.');
    return '';
  }
}

interface JumpstartInfo {
  logicalId: string;
  architecture: string;
}

function loadJumpstarts(): JumpstartInfo[] {
  const files = glob.sync(path.join(JUMPSTARTS_DIR, '*.yml'));
  const results: JumpstartInfo[] = [];

  for (const file of files) {
    const raw = yaml.load(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    if (raw.architecture && raw.logical_id) {
      results.push({
        logicalId: raw.logical_id as string,
        architecture: raw.architecture as string,
      });
    }
  }
  return results;
}

interface ThemeConfig {
  name: string;
  mermaidTheme: string;
  bg: string;
}

const THEMES: ThemeConfig[] = [
  { name: 'light', mermaidTheme: 'default', bg: 'transparent' },
  { name: 'dark', mermaidTheme: 'dark', bg: 'transparent' },
];

function renderDiagram(
  js: JumpstartInfo,
  themeConfig: ThemeConfig,
  env: Record<string, string>,
): boolean {
  const outFile = path.join(OUTPUT_DIR, `${js.logicalId}_${themeConfig.name}.svg`);

  const tmpDir = path.join(REPO_ROOT, '.tmp-diagrams');
  fs.mkdirSync(tmpDir, { recursive: true });
  const mmdFile = path.join(tmpDir, `${js.logicalId}.mmd`);
  fs.writeFileSync(mmdFile, js.architecture);

  const configFile = path.join(tmpDir, `config-${themeConfig.name}.json`);
  fs.writeFileSync(configFile, JSON.stringify({
    theme: themeConfig.mermaidTheme,
    flowchart: { useMaxWidth: false, curve: 'basis' },
  }));

  const puppeteerConfig = path.join(tmpDir, 'puppeteer-config.json');
  fs.writeFileSync(puppeteerConfig, JSON.stringify({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }));

  try {
    execSync(
      `"${MMDC}" -i "${mmdFile}" -o "${outFile}" -c "${configFile}" ` +
      `-p "${puppeteerConfig}" -b "${themeConfig.bg}" --quiet`,
      { env, stdio: 'pipe', timeout: 30000 }
    );

    if (fs.existsSync(outFile)) {
      let svg = fs.readFileSync(outFile, 'utf8');
      svg = injectItemIcons(svg, js.architecture);
      fs.writeFileSync(outFile, svg);
      return true;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message.split('\n')[0] : String(e);
    console.error(`  ✗ ${js.logicalId} (${themeConfig.name}): ${msg}`);
  }
  return false;
}

/**
 * Post-process SVG to inject Fabric item icons next to node labels.
 */
function injectItemIcons(svg: string, chart: string): string {
  const nodeRegex = /([A-Za-z_]\w*)\[([^\]]*)\]:::(\w+)/g;
  let m: RegExpExecArray | null;
  const nodes: Array<{ label: string; itemType: string }> = [];

  while ((m = nodeRegex.exec(chart)) !== null) {
    nodes.push({ label: m[2].trim(), itemType: m[3] });
  }

  for (const node of nodes) {
    const iconUri = ICON_URIS[node.itemType];
    if (!iconUri) continue;

    const labelPattern = new RegExp(
      `(<span[^>]*class="nodeLabel"[^>]*>)(<p>)?(${escapeRegex(node.label)})(</p>)?</span>`,
      'g'
    );
    svg = svg.replace(labelPattern, (_match, prefix, pOpen, label, pClose) => {
      const img = `<img src="${iconUri}" width="16" height="16" style="vertical-align:middle;margin-right:4px" />`;
      return `${prefix}${pOpen || ''}${img}${label}${pClose || ''}</span>`;
    });
  }

  return svg;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main(): void {
  console.log('🎨 Rendering Mermaid architecture diagrams...');

  const extraLibPath = ensureChromeLibs();
  if (extraLibPath === '' && !process.env.CI) {
    // Check if we actually need extra libs
    try {
      execSync('ldconfig -p 2>/dev/null | grep -q "libnss3.so"', { stdio: 'pipe' });
    } catch {
      console.log('  ⚠ Chrome dependencies unavailable. Skipping pre-render.');
      console.log('  Diagrams will render client-side instead.');
      return;
    }
  }

  const env = { ...process.env } as Record<string, string>;
  if (extraLibPath) {
    env.LD_LIBRARY_PATH = extraLibPath + (env.LD_LIBRARY_PATH ? ':' + env.LD_LIBRARY_PATH : '');
  }

  const jumpstarts = loadJumpstarts();
  console.log(`  Found ${jumpstarts.length} jumpstarts with architecture diagrams`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let failed = 0;
  for (const js of jumpstarts) {
    let ok = true;
    for (const theme of THEMES) {
      if (renderDiagram(js, theme, env)) {
        success++;
      } else {
        failed++;
        ok = false;
      }
    }
    if (ok) console.log(`  ✓ ${js.logicalId}`);
  }

  // Cleanup temp files
  const tmpDir = path.join(REPO_ROOT, '.tmp-diagrams');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }

  console.log(`✅ Rendered ${success} SVGs (${failed} failed) to ${path.relative(REPO_ROOT, OUTPUT_DIR)}/`);
}

main();
