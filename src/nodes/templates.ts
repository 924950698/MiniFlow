import type { WorkflowNodeData, WorkflowNodeType } from './types';

export type NodeTemplate = {
  label: string;
  type: WorkflowNodeType;
  data?: Partial<WorkflowNodeData>;
};

export const nodeTemplates: NodeTemplate[] = [
  { label: '开始节点', type: 'start' },
  {
    label: 'LLM 调用',
    type: 'llm',
    data: { model: 'kimi-k2.5', systemPrompt: '', userInput: '' },
  },
  {
    label: 'HTTP 请求',
    type: 'http',
    data: { method: 'GET', url: '' },
  },
  {
    label: '条件分支',
    type: 'condition',
    data: { condition: '' },
  },
  { label: '结束节点', type: 'end' },
];
