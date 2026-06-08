import type { Edge } from '@xyflow/react';

import type { AppNode, WorkflowNodeData } from '../nodes/types';
import { createExecutionContext } from './context';
import { executeNode } from './executors';
import { findStartNode, getNextNode, validateWorkflow } from './graph';

export type WorkflowRunResult = {
  success: boolean;
  finalOutput?: unknown;
  error?: string;
  executedNodeIds: string[];
};

export type NodeUpdateCallback = (
  nodeId: string,
  patch: Partial<WorkflowNodeData>,
) => void;

function resetRunState(nodes: AppNode[], onNodeUpdate: NodeUpdateCallback) {
  for (const node of nodes) {
    onNodeUpdate(node.id, {
      runStatus: 'idle',
      runInput: undefined,
      runOutput: undefined,
      runError: undefined,
    });
  }
}

function markSkippedNodes(
  nodes: AppNode[],
  executedIds: Set<string>,
  onNodeUpdate: NodeUpdateCallback,
) {
  for (const node of nodes) {
    if (!executedIds.has(node.id)) {
      onNodeUpdate(node.id, { runStatus: 'skipped' });
    }
  }
}

export async function runWorkflow(
  nodes: AppNode[],
  edges: Edge[],
  onNodeUpdate: NodeUpdateCallback,
): Promise<WorkflowRunResult> {
  const validation = validateWorkflow(nodes, edges);
  if (!validation.ok) {
    return { success: false, error: validation.error, executedNodeIds: [] };
  }

  resetRunState(nodes, onNodeUpdate);

  const ctx = createExecutionContext();
  const executedNodeIds: string[] = [];
  const executedSet = new Set<string>();

  let current = findStartNode(nodes);
  if (!current) {
    return { success: false, error: '缺少开始节点', executedNodeIds: [] };
  }

  while (current) {
    onNodeUpdate(current.id, { runStatus: 'running', runError: undefined });

    try {
      const { input, output } = await executeNode(current, ctx);
      ctx.nodes[current.id] = output;

      onNodeUpdate(current.id, {
        runStatus: 'success',
        runInput: input,
        runOutput: output,
      });

      executedNodeIds.push(current.id);
      executedSet.add(current.id);

      if (current.type === 'end') {
        markSkippedNodes(nodes, executedSet, onNodeUpdate);
        return {
          success: true,
          finalOutput: output.result ?? output,
          executedNodeIds,
        };
      }

      const branch =
        current.type === 'condition'
          ? (output.branch as 'true' | 'false' | undefined)
          : undefined;

      const next = getNextNode(current, edges, nodes, branch);
      if (!next) {
        markSkippedNodes(nodes, executedSet, onNodeUpdate);
        return {
          success: false,
          error: `节点「${current.data.label}」执行后无后续连线`,
          executedNodeIds,
        };
      }

      current = next;
    } catch (error) {
      const message = error instanceof Error ? error.message : '节点执行失败';
      onNodeUpdate(current.id, {
        runStatus: 'error',
        runError: message,
      });
      markSkippedNodes(nodes, executedSet, onNodeUpdate);
      return { success: false, error: message, executedNodeIds };
    }
  }

  markSkippedNodes(nodes, executedSet, onNodeUpdate);
  return { success: false, error: '未到达结束节点', executedNodeIds };
}
