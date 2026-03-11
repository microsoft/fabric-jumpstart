/**
 * Parses a Mermaid flowchart definition and simplifies it to workload-level flow.
 *
 * Nodes are annotated with Fabric item types via `:::ClassName` syntax:
 *   A[label]:::Notebook --> B[label]:::Lakehouse
 *
 * The parser maps each item type to its workload, collapses nodes into workload
 * groups, and derives deduplicated workload-to-workload edges.
 */

/**
 * Maps Fabric item class names (used as :::ClassName in Mermaid) to their
 * SVG icon filenames in @fabric-msft/svg-icons.
 */
export const FABRIC_ITEM_ICON_MAP: Record<string, string> = {
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

export const ITEM_WORKLOAD_MAP: Record<string, string> = {
  Notebook: 'Data Engineering',
  Lakehouse: 'Data Engineering',
  Environment: 'Data Engineering',
  SparkJobDefinition: 'Data Engineering',
  VariableLibrary: 'Data Engineering',
  Eventhouse: 'Real-Time Intelligence',
  Eventstream: 'Real-Time Intelligence',
  KQLDatabase: 'Real-Time Intelligence',
  KQLQueryset: 'Real-Time Intelligence',
  KQLDashboard: 'Real-Time Intelligence',
  Reflex: 'Real-Time Intelligence',
  DataPipeline: 'Data Factory',
  Dataflow: 'Data Factory',
  CopyJob: 'Data Factory',
  MountedDataFactory: 'Data Factory',
  ApacheAirflowJob: 'Data Factory',
  Warehouse: 'Data Warehouse',
  SQLEndpoint: 'Data Warehouse',
  MirroredDatabase: 'Data Warehouse',
  SQLDatabase: 'SQL Database',
  Report: 'Power BI',
  SemanticModel: 'Power BI',
  OrgApp: 'Power BI',
  MLExperiment: 'Data Science',
  DataAgent: 'Data Science',
  UserDataFunction: 'Data Science',
  GraphQLApi: 'Data Engineering',
};

export interface WorkloadFlow {
  workloads: string[];
  edges: [string, string][];
}

export function parseMermaidToWorkloadFlow(mermaidDef: string): WorkloadFlow {
  // Extract node definitions: nodeId[label]:::ItemType
  const nodeClassMap: Record<string, string> = {};
  const nodeDefRegex = /([A-Za-z_]\w*)\[([^\]]*)\](?:::(\w+))?/g;
  let match: RegExpExecArray | null;

  while ((match = nodeDefRegex.exec(mermaidDef)) !== null) {
    const [, nodeId, , itemType] = match;
    if (itemType) {
      nodeClassMap[nodeId] = itemType;
    }
  }

  // Also capture bare node:::ItemType references (without brackets)
  const bareNodeRegex = /\b([A-Za-z_]\w*):::(\w+)/g;
  while ((match = bareNodeRegex.exec(mermaidDef)) !== null) {
    const [, nodeId, itemType] = match;
    if (!nodeClassMap[nodeId]) {
      nodeClassMap[nodeId] = itemType;
    }
  }

  // Extract edges: A --> B, A -.-> B, A ==> B
  const edgeRegex = /([A-Za-z_]\w*)\s*(?:-->|-.->|==>)\s*(?:\|[^|]*\|\s*)?([A-Za-z_]\w*)/g;
  const rawEdges: [string, string][] = [];

  while ((match = edgeRegex.exec(mermaidDef)) !== null) {
    const [, from, to] = match;
    rawEdges.push([from, to]);
  }

  // Map nodes to workloads
  const nodeWorkload: Record<string, string> = {};
  for (const [nodeId, itemType] of Object.entries(nodeClassMap)) {
    const workload = ITEM_WORKLOAD_MAP[itemType];
    if (workload) {
      nodeWorkload[nodeId] = workload;
    }
  }

  // Collect workloads in order of first appearance
  const workloadOrder: string[] = [];
  const workloadSet = new Set<string>();

  for (const [from, to] of rawEdges) {
    for (const nodeId of [from, to]) {
      const w = nodeWorkload[nodeId];
      if (w && !workloadSet.has(w)) {
        workloadSet.add(w);
        workloadOrder.push(w);
      }
    }
  }

  // Also add workloads from nodes not involved in edges
  for (const w of Object.values(nodeWorkload)) {
    if (!workloadSet.has(w)) {
      workloadSet.add(w);
      workloadOrder.push(w);
    }
  }

  // Derive workload-level edges (deduplicated, preserving order)
  const edges: [string, string][] = [];
  const edgeSet = new Set<string>();

  for (const [from, to] of rawEdges) {
    const wFrom = nodeWorkload[from];
    const wTo = nodeWorkload[to];
    if (wFrom && wTo && wFrom !== wTo) {
      const key = `${wFrom}|${wTo}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([wFrom, wTo]);
      }
    }
  }

  return { workloads: workloadOrder, edges };
}
