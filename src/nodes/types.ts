import type { Node } from '@xyflow/react';

export type WorkflowNodeType = 'start' | 'llm' | 'http' | 'condition' | 'end';

export type LlmNodeStatus = 'idle' | 'running' | 'success' | 'error';

export type WorkflowNodeData = {
  label: string;
  model?: string;
  prompt?: string;
  systemPrompt?: string;
  userInput?: string;
  lastResult?: string;
  status?: LlmNodeStatus;
  method?: string;
  url?: string;
  condition?: string;
};

export type AppNode = Node<WorkflowNodeData, WorkflowNodeType>;
