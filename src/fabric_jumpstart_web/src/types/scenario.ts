/**
 * Canonical type definitions for jumpstart scenario data.
 *
 * Classes are used so that allowed field names can be derived at runtime
 * via Object.keys(new ClassName()) — no manual allowlists to maintain.
 *
 * ScenarioSource – nested `source:` block in YAML
 * ScenarioYml    – top-level shape of jumpstarts/core/*.yml
 * ScenarioCard   – shape emitted to scenarios.json for UI components
 *
 * Both Python (Pydantic Jumpstart model) and TypeScript share the same YAML
 * contract.  If you add a field to the YAML, add it here AND to the Python
 * model in src/fabric_jumpstart/tests/schemas.py.
 */

// ─── YAML file shape ─────────────────────────────────────────

export class ScenarioSource {
  workspace_path: string = '';
  preview_image_path: string = '';
  repo_url: string | undefined = undefined;
  repo_ref: string | undefined = undefined;

  /** Field names allowed inside the `source:` block. */
  static allowedFields(): Set<string> {
    return new Set(Object.keys(new ScenarioSource()));
  }
}

export class ScenarioYml {
  id: number = 0;
  logical_id: string = '';
  name: string = '';
  description: string = '';
  date_added: string = '';
  include_in_listing: boolean = true;
  workload_tags: string[] = [];
  scenario_tags: string[] = [];
  type: string = '';
  source: ScenarioSource = new ScenarioSource();
  items_in_scope: string[] = [];
  jumpstart_docs_uri: string = '';
  entry_point: string = '';
  owner_email: string = '';
  minutes_to_deploy: number = 0;
  minutes_to_complete_jumpstart: number = 0;
  video_url: string | undefined = undefined;
  difficulty: string | undefined = undefined;
  last_updated: string | undefined = undefined;
  // Python-only (present in YAML, not used by TS at runtime)
  feature_flags: string[] | undefined = undefined;
  test_suite: string | undefined = undefined;

  /** Top-level field names allowed in a scenario YAML file. */
  static allowedFields(): Set<string> {
    return new Set(Object.keys(new ScenarioYml()));
  }
}

// ─── Generated JSON shape (scenarios.json) ───────────────────

export class ScenarioCard {
  id: string = '';
  title: string = '';
  description: string = '';
  type: string = '';
  difficulty: string = '';
  tags: string[] = [];
  workloadTags: string[] = [];
  previewImage: string = '';
  videoUrl: string = '';
  minutesToDeploy: number = 0;
  minutesToComplete: number = 0;
  itemsInScope: string[] = [];
  docsUri: string = '';
  slug: string = '';
  lastUpdated: string = '';
  body: string = '';
}
