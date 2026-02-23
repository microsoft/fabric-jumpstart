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
    expect(Array.isArray(web.tags_display)).toBe(true);
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
