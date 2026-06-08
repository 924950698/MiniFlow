import type { Edge } from '@xyflow/react';

import type { AppNode } from '../nodes/types';

export type WorkflowValidation = {
  ok: boolean;
  error?: string;
};

export function findStartNode(nodes: AppNode[]): AppNode | null {
  const starts = nodes.filter((node) => node.type === 'start');
  if (starts.length === 0) {
    return null;
  }
  return starts[0];
}

export function getNodeById(nodes: AppNode[], nodeId: string): AppNode | undefined {
  return nodes.find((node) => node.id === nodeId);
}

export function getOutgoingEdges(nodeId: string, edges: Edge[]): Edge[] {
  return edges.filter((edge) => edge.source === nodeId);
}

export function getNextNode(
  current: AppNode,
  edges: Edge[],
  nodes: AppNode[],
  branch?: 'true' | 'false',
): AppNode | null {
  const outgoing = getOutgoingEdges(current.id, edges);

  if (outgoing.length === 0) {
    return null;
  }

  let nextEdge: Edge | undefined;

  if (current.type === 'condition') {
    nextEdge = outgoing.find((edge) => edge.sourceHandle === branch);
    if (!nextEdge) {
      nextEdge = outgoing.find((edge) => !edge.sourceHandle && branch === 'true');
    }
  } else {
    nextEdge = outgoing[0];
  }

  if (!nextEdge) {
    return null;
  }

  return getNodeById(nodes, nextEdge.target) ?? null;
}

function collectReachable(startId: string, edges: Edge[]): Set<string> {
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    for (const edge of getOutgoingEdges(nodeId, edges)) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return visited;
}

function hasCycle(startId: string, edges: Edge[]): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (visiting.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);

    for (const edge of getOutgoingEdges(nodeId, edges)) {
      if (dfs(edge.target)) {
        return true;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  return dfs(startId);
}

export function validateWorkflow(nodes: AppNode[], edges: Edge[]): WorkflowValidation {
  const starts = nodes.filter((node) => node.type === 'start');
  if (starts.length === 0) {
    return { ok: false, error: '工作流缺少开始节点' };
  }
  if (starts.length > 1) {
    return { ok: false, error: '工作流只能有一个开始节点' };
  }

  const ends = nodes.filter((node) => node.type === 'end');
  if (ends.length === 0) {
    return { ok: false, error: '工作流缺少结束节点' };
  }

  const startId = starts[0].id;
  if (hasCycle(startId, edges)) {
    return { ok: false, error: '工作流存在循环，无法执行' };
  }

  const reachable = collectReachable(startId, edges);
  const reachableEnd = ends.some((node) => reachable.has(node.id));
  if (!reachableEnd) {
    return { ok: false, error: '从开始节点无法到达结束节点' };
  }

  for (const node of nodes) {
    if (node.type === 'condition') {
      continue;
    }
    const outgoing = getOutgoingEdges(node.id, edges);
    if (outgoing.length > 1) {
      return {
        ok: false,
        error: `节点「${node.data.label}」有多条出边，当前仅支持线性或条件分支`,
      };
    }
  }

  return { ok: true };
}
