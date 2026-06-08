import type { Node } from '@xyflow/react';

export type WorkflowNodeType = 'start' | 'llm' | 'http' | 'condition' | 'end';

export type LlmNodeStatus = 'idle' | 'running' | 'success' | 'error';

export type NodeRunStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'error'
  | 'skipped';

export type WorkflowNodeData = {
  label: string;
  description?: string;
  variables?: string;
  model?: string;
  prompt?: string;
  systemPrompt?: string;
  userInput?: string;
  lastResult?: string;
  status?: LlmNodeStatus;
  method?: string;
  url?: string;
  headers?: string;
  body?: string;
  condition?: string;
  trueLabel?: string;
  falseLabel?: string;
  outputVariable?: string;
  runStatus?: NodeRunStatus;
  runInput?: unknown;
  runOutput?: unknown;
  runError?: string;
};

export type AppNode = Node<WorkflowNodeData, WorkflowNodeType>;

export const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  start: '开始节点',
  llm: 'LLM 调用节点',
  http: 'HTTP 请求节点',
  condition: '条件分支节点',
  end: '结束节点',
};
