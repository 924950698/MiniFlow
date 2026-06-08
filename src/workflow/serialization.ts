import type { Edge } from '@xyflow/react';

import type { AppNode, WorkflowNodeData, WorkflowNodeType } from '../nodes/types';

export const WORKFLOW_FILE_VERSION = 1;
export const WORKFLOW_STORAGE_KEY = 'miniflow-workflow-draft';

const VALID_NODE_TYPES = new Set<WorkflowNodeType>([
  'start',
  'llm',
  'http',
  'condition',
  'end',
]);

export type SerializedNode = {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
};

export type SerializedEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
};

export type WorkflowFile = {
  version: number;
  name?: string;
  exportedAt: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
};

function stripRuntimeFromData(data: WorkflowNodeData): WorkflowNodeData {
  const {
    status,
    lastResult,
    runStatus,
    runInput,
    runOutput,
    runError,
    ...config
  } = data;
  void status;
  void lastResult;
  void runStatus;
  void runInput;
  void runOutput;
  void runError;
  return config;
}

export function serializeWorkflow(
  nodes: AppNode[],
  edges: Edge[],
  name?: string,
): WorkflowFile {
  return {
    version: WORKFLOW_FILE_VERSION,
    name,
    exportedAt: new Date().toISOString(),
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type as WorkflowNodeType,
      position: { x: node.position.x, y: node.position.y },
      data: stripRuntimeFromData(node.data),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: typeof edge.label === 'string' ? edge.label : undefined,
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parsePosition(value: unknown): { x: number; y: number } | null {
  if (!isRecord(value)) {
    return null;
  }
  const { x, y } = value;
  if (typeof x !== 'number' || typeof y !== 'number') {
    return null;
  }
  return { x, y };
}

function parseNode(value: unknown, index: number): SerializedNode {
  if (!isRecord(value)) {
    throw new Error(`节点 #${index + 1} 格式无效`);
  }

  const { id, type, position, data } = value;

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(`节点 #${index + 1} 缺少有效 id`);
  }

  if (typeof type !== 'string' || !VALID_NODE_TYPES.has(type as WorkflowNodeType)) {
    throw new Error(`节点「${id}」类型无效: ${String(type)}`);
  }

  const parsedPosition = parsePosition(position);
  if (!parsedPosition) {
    throw new Error(`节点「${id}」位置无效`);
  }

  if (!isRecord(data) || typeof data.label !== 'string') {
    throw new Error(`节点「${id}」缺少 label 配置`);
  }

  return {
    id,
    type: type as WorkflowNodeType,
    position: parsedPosition,
    data: data as WorkflowNodeData,
  };
}

function parseEdge(value: unknown, index: number): SerializedEdge {
  if (!isRecord(value)) {
    throw new Error(`连线 #${index + 1} 格式无效`);
  }

  const { id, source, target, sourceHandle, targetHandle, label } = value;

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(`连线 #${index + 1} 缺少有效 id`);
  }

  if (typeof source !== 'string' || typeof target !== 'string') {
    throw new Error(`连线「${id}」缺少 source 或 target`);
  }

  return {
    id,
    source,
    target,
    sourceHandle: typeof sourceHandle === 'string' ? sourceHandle : null,
    targetHandle: typeof targetHandle === 'string' ? targetHandle : null,
    label: typeof label === 'string' ? label : undefined,
  };
}

export function parseWorkflowFile(json: string): WorkflowFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('JSON 解析失败，请检查文件格式');
  }

  if (!isRecord(parsed)) {
    throw new Error('工作流文件必须是 JSON 对象');
  }

  const version = parsed.version;
  if (typeof version !== 'number' || version > WORKFLOW_FILE_VERSION) {
    throw new Error(`不支持的工作流版本: ${String(version)}`);
  }

  if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    throw new Error('工作流缺少节点');
  }

  if (!Array.isArray(parsed.edges)) {
    throw new Error('工作流缺少连线');
  }

  const nodes = parsed.nodes.map(parseNode);
  const edges = parsed.edges.map(parseEdge);

  const nodeIds = new Set(nodes.map((node) => node.id));
  const duplicateIds = nodes
    .map((node) => node.id)
    .filter((id, index, list) => list.indexOf(id) !== index);

  if (duplicateIds.length > 0) {
    throw new Error(`存在重复节点 id: ${duplicateIds[0]}`);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      throw new Error(`连线「${edge.id}」引用了不存在的节点: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      throw new Error(`连线「${edge.id}」引用了不存在的节点: ${edge.target}`);
    }
  }

  return {
    version,
    name: typeof parsed.name === 'string' ? parsed.name : undefined,
    exportedAt:
      typeof parsed.exportedAt === 'string'
        ? parsed.exportedAt
        : new Date().toISOString(),
    nodes,
    edges,
  };
}

export function deserializeWorkflow(file: WorkflowFile): {
  nodes: AppNode[];
  edges: Edge[];
} {
  const nodes: AppNode[] = file.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: stripRuntimeFromData(node.data),
  }));

  const edges: Edge[] = file.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    label: edge.label,
  }));

  return { nodes, edges };
}

export function workflowToJson(file: WorkflowFile, pretty = true): string {
  return JSON.stringify(file, null, pretty ? 2 : 0);
}

export function downloadWorkflowJson(nodes: AppNode[], edges: Edge[], name?: string) {
  const file = serializeWorkflow(nodes, edges, name);
  const blob = new Blob([workflowToJson(file)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = file.exportedAt.replace(/[:.]/g, '-').slice(0, 19);

  anchor.href = url;
  anchor.download = `miniflow-${timestamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function saveWorkflowToStorage(nodes: AppNode[], edges: Edge[]) {
  const file = serializeWorkflow(nodes, edges, 'draft');
  localStorage.setItem(WORKFLOW_STORAGE_KEY, workflowToJson(file, false));
}

export function loadWorkflowFromStorage(): { nodes: AppNode[]; edges: Edge[] } | null {
  try {
    const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const file = parseWorkflowFile(raw);
    return deserializeWorkflow(file);
  } catch {
    return null;
  }
}
