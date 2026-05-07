/**
 * TypeScript types and initial state for the Create Jumpstart form draft.
 */

export type JumpstartType = 'Tutorial' | 'Demo' | 'Accelerator' | '';
export type JumpstartDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | '';

export interface JumpstartDraft {
  // Step 1 — Basic Info
  name: string;
  logical_id: string;
  description: string;
  type: JumpstartType;
  difficulty: JumpstartDifficulty;
  date_added: string; // MM/DD/YYYY

  // Step 2 — Tags
  workload_tags: string[];
  scenario_tags: string[];

  // Step 3 — Source & Scope
  repo_url: string;
  repo_ref: string;
  workspace_path: string;
  entry_point: string;
  items_in_scope: string[];
  files_source_path: string;
  files_destination_lakehouse: string;
  files_destination_path: string;

  // Step 4 — Timing & Links
  owner_email: string;
  minutes_to_deploy: number | '';
  minutes_to_complete_jumpstart: number | '';
  jumpstart_docs_uri: string;
  video_url: string;
  last_updated: string; // YYYY-MM-DD

  // Step 5 — Architecture Diagram
  mermaid_diagram: string;
  svgLight: string | null;
  svgDark: string | null;
}

function todayMDY(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export const WORKLOAD_TAGS = [
  'Data Engineering',
  'Data Factory',
  'Data Science',
  'Data Warehouse',
  'Power BI',
  'Real-Time Intelligence',
] as const;

export const SCENARIO_TAG_SUGGESTIONS = [
  'Streaming',
  'Monitoring',
  'Batch Processing',
  'Modeling',
];

export const ITEMS_IN_SCOPE_OPTIONS = [
  'CopyJob',
  'DataAgent',
  'DataPipeline',
  'Dataflow',
  'Environment',
  'Eventhouse',
  'Eventstream',
  'KQLDashboard',
  'KQLDatabase',
  'KQLQueryset',
  'Lakehouse',
  'Notebook',
  'Reflex',
  'Report',
  'SemanticModel',
  'SparkJobDefinition',
  'VariableLibrary',
  'Warehouse',
] as const;

export const DIAGRAM_STARTER = `graph LR

  %% Source systems
  SRC[Your Data Source]:::U1F4BE

  %% FABRIC WORKSPACE
  subgraph Fabric:::Workspace
    LH[your_lakehouse]:::Lakehouse
    NB[GettingStarted]:::Notebook
    direction LR
  end

  SRC -.-> LH
  LH <-.-> NB`;

export const initialDraft: JumpstartDraft = {
  name: '',
  logical_id: '',
  description: '',
  type: '',
  difficulty: '',
  date_added: todayMDY(),
  workload_tags: [],
  scenario_tags: [],
  repo_url: '',
  repo_ref: '',
  workspace_path: '',
  entry_point: '',
  items_in_scope: [],
  files_source_path: '',
  files_destination_lakehouse: '',
  files_destination_path: '',
  owner_email: '',
  minutes_to_deploy: '',
  minutes_to_complete_jumpstart: '',
  jumpstart_docs_uri: '',
  video_url: '',
  last_updated: todayISO(),
  mermaid_diagram: DIAGRAM_STARTER,
  svgLight: null,
  svgDark: null,
};

/** Derive a kebab-case logical_id from a display name. */
export function deriveLogicalId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}
