/**
 * Contract validation test for scenario YAML files.
 *
 * Ensures all scenarios in jumpstarts/core/ conform to the expected contract,
 * including both required base fields and optional web extension fields.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';

const JUMPSTARTS_DIR = path.resolve(
  __dirname,
  '../../fabric_jumpstart/jumpstarts/core'
);

interface ScenarioYml {
  [key: string]: unknown;
}

function loadAllScenarios(): { file: string; data: ScenarioYml }[] {
  const files = glob.sync('*.yml', { cwd: JUMPSTARTS_DIR });
  return files.map((file) => {
    const content = fs.readFileSync(path.join(JUMPSTARTS_DIR, file), 'utf-8');
    const data = yaml.load(content) as ScenarioYml;
    return { file, data };
  });
}

describe('Scenario YAML contract', () => {
  const scenarios = loadAllScenarios();

  it('should find at least one scenario file', () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  const requiredBaseFields = [
    'id',
    'logical_id',
    'name',
    'description',
    'date_added',
    'include_in_listing',
    'workload_tags',
    'scenario_tags',
    'type',
    'source',
    'items_in_scope',
    'entry_point',
    'owner_email',
    'minutes_to_deploy',
    'minutes_to_complete_jumpstart',
  ];

  test.each(scenarios)('$file has all required base fields', ({ data }) => {
    for (const field of requiredBaseFields) {
      expect(data).toHaveProperty(field);
    }
  });

  test.each(scenarios)('$file has valid types for base fields', ({ data }) => {
    expect(typeof data.id).toBe('number');
    expect(typeof data.logical_id).toBe('string');
    expect(typeof data.name).toBe('string');
    expect(typeof data.description).toBe('string');
    expect(typeof data.include_in_listing).toBe('boolean');
    expect(Array.isArray(data.workload_tags)).toBe(true);
    expect(Array.isArray(data.scenario_tags)).toBe(true);
    expect(['Demo', 'Tutorial', 'Accelerator']).toContain(data.type);
    expect(typeof data.source).toBe('object');
    expect(Array.isArray(data.items_in_scope)).toBe(true);
    expect(typeof data.minutes_to_deploy).toBe('number');
    expect(typeof data.minutes_to_complete_jumpstart).toBe('number');
  });

  test.each(scenarios)(
    '$file has valid source fields',
    ({ data }) => {
      const source = data.source as Record<string, unknown>;
      expect(source).toHaveProperty('workspace_path');
      expect(source).toHaveProperty('preview_image_path');
    }
  );

  test.each(scenarios)('$file has web extension fields', ({ data }) => {
    expect(data).toHaveProperty('web');
    const web = data.web as Record<string, unknown>;
    expect(typeof web.title).toBe('string');
    expect(typeof web.summary).toBe('string');
    expect(typeof web.preview_image_url).toBe('string');
    expect(typeof web.difficulty).toBe('string');
    expect(['Beginner', 'Intermediate', 'Advanced']).toContain(web.difficulty);
  });

  test.each(scenarios)(
    '$file logical_id matches filename',
    ({ file, data }) => {
      const expected = file.replace('.yml', '');
      expect(data.logical_id).toBe(expected);
    }
  );

  test.each(
    scenarios.filter((s) => s.data.include_in_listing)
  )('listed scenario $file has non-empty description', ({ data }) => {
    expect((data.description as string).length).toBeGreaterThan(10);
  });
});

const REGISTRY_PATH = path.resolve(
  __dirname,
  '../../fabric_jumpstart/registry.yml'
);
const WORKLOAD_IMAGES_DIR = path.resolve(
  __dirname,
  '../public/images/tags/workload'
);

function toSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface RegistryYml {
  jumpstarts: { workload_tags?: string[] }[];
}

function collectDistinctWorkloadTags(): string[] {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  const registry = yaml.load(content) as RegistryYml;
  const tags = new Set<string>();
  for (const js of registry.jumpstarts) {
    (js.workload_tags ?? []).forEach((t) => tags.add(t));
  }
  return [...tags].sort();
}

describe('Tag image coverage', () => {
  const workloadTags = collectDistinctWorkloadTags();

  const IMAGE_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];

  function imageExists(dir: string, slug: string): boolean {
    return IMAGE_EXTENSIONS.some((ext) =>
      fs.existsSync(path.join(dir, `${slug}${ext}`))
    );
  }

  test.each(workloadTags.map((t) => ({ tag: t, slug: toSlug(t) })))(
    'workload tag "$tag" has a corresponding image',
    ({ tag, slug }) => {
      if (!imageExists(WORKLOAD_IMAGES_DIR, slug)) {
        throw new Error(
          `Missing image for workload tag "${tag}". ` +
            `Please find a high-quality image that represents this workload and add it as "${slug}.svg" (or .png/.jpg/.webp) to:\n` +
            `  src/fabric_jumpstart_web/public/images/tags/workload/`
        );
      }
    }
  );
});
