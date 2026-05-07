/**
 * Generates a canonical jumpstart YAML string from a JumpstartDraft.
 *
 * The `id` field is intentionally omitted — it will be assigned by maintainers
 * when the PR is reviewed and merged.
 */
import type { JumpstartDraft } from './formState';

function escapeYamlString(value: string): string {
  if (value === '') return "''";
  // Quote if contains special YAML characters
  if (/[:#\[\]{}&*!|>'"%@`,]/.test(value) || value.includes('\n')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

function yamlStringList(items: string[]): string {
  if (items.length === 0) return '[]\n';
  return '\n' + items.map((i) => `- ${i}`).join('\n') + '\n';
}

function blockScalar(value: string, indent = '  '): string {
  if (!value.trim()) return "''\n";
  const lines = value.trimEnd().split('\n');
  return '|\n' + lines.map((l) => indent + l).join('\n') + '\n';
}

function foldedScalar(value: string, indent = '  ', width = 76): string {
  if (!value.trim()) return "''\n";
  const words = value.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let current = indent;
  for (const word of words) {
    if (current.length + word.length + 1 > width && current.trim()) {
      lines.push(current.trimEnd());
      current = indent + word + ' ';
    } else {
      current += word + ' ';
    }
  }
  if (current.trim()) lines.push(current.trimEnd());
  return '>-\n' + lines.join('\n') + '\n';
}

export function generateYaml(draft: JumpstartDraft, diagramSaved = false): string {
  const minutesDeploy = draft.minutes_to_deploy === '' ? 0 : Number(draft.minutes_to_deploy);
  const minutesComplete =
    draft.minutes_to_complete_jumpstart === '' ? 0 : Number(draft.minutes_to_complete_jumpstart);

  const lines: string[] = [];

  lines.push(`# id: <will be assigned by maintainers at merge>`);
  lines.push(`logical_id: ${escapeYamlString(draft.logical_id)}`);
  lines.push(`name: ${escapeYamlString(draft.name)}`);
  lines.push(`description: ${foldedScalar(draft.description).trimEnd()}`);
  lines.push(`date_added: ${escapeYamlString(draft.date_added)}`);
  lines.push(`workload_tags: ${yamlStringList(draft.workload_tags).trimEnd()}`);
  lines.push(`scenario_tags: ${yamlStringList(draft.scenario_tags).trimEnd()}`);
  lines.push(`type: ${escapeYamlString(draft.type)}`);
  lines.push(`source:`);
  lines.push(`  repo_url: ${escapeYamlString(draft.repo_url)}`);
  lines.push(`  repo_ref: ${escapeYamlString(draft.repo_ref)}`);
  lines.push(`  workspace_path: ${escapeYamlString(draft.workspace_path)}`);
  lines.push(`items_in_scope: ${yamlStringList(draft.items_in_scope).trimEnd()}`);
  lines.push(`jumpstart_docs_uri: ${escapeYamlString(draft.jumpstart_docs_uri)}`);
  lines.push(`entry_point: ${escapeYamlString(draft.entry_point)}`);
  lines.push(`owner_email: ${escapeYamlString(draft.owner_email)}`);
  lines.push(`minutes_to_deploy: ${minutesDeploy}`);
  lines.push(`minutes_to_complete_jumpstart: ${minutesComplete}`);
  lines.push(`video_url: ${escapeYamlString(draft.video_url)}`);
  lines.push(`difficulty: ${escapeYamlString(draft.difficulty)}`);
  lines.push(`last_updated: "${draft.last_updated}"`);

  if (diagramSaved && draft.mermaid_diagram.trim()) {
    lines.push(`mermaid_diagram: ${blockScalar(draft.mermaid_diagram).trimEnd()}`);
  } else {
    lines.push(`mermaid_diagram: ''`);
  }

  return lines.join('\n') + '\n';
}
