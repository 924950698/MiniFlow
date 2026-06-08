import type { AppNode } from './types';

export type NodeTemplate = {
  label: string;
  type?: AppNode['type'];
};

export const nodeTemplates: NodeTemplate[] = [
  { label: '默认节点' },
  { label: '输入节点', type: 'input' },
  { label: '输出节点', type: 'output' },
  { label: '位置节点', type: 'position-logger' },
];
