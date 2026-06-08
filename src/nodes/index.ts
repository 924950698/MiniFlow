import type { NodeTypes } from '@xyflow/react';

import {
  ConditionNode,
  EndNode,
  HttpNode,
  LlmNode,
  StartNode,
} from './WorkflowNodes';
import type { AppNode } from './types';

export const initialNodes: AppNode[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 0, y: 200 },
    data: { label: '开始' },
  },
  {
    id: 'llm-1',
    type: 'llm',
    position: { x: 220, y: 200 },
    data: {
      label: 'LLM 调用',
      model: 'kimi-k2.5',
      systemPrompt: '你是 Kimi，请简洁准确地回答用户问题。',
      userInput: '用一句话介绍你自己',
    },
  },
  {
    id: 'cond-1',
    type: 'condition',
    position: { x: 460, y: 200 },
    data: {
      label: '条件分支',
      condition: 'result.score > 0.8',
      trueLabel: '通过',
      falseLabel: '拒绝',
    },
  },
  {
    id: 'http-1',
    type: 'http',
    position: { x: 700, y: 80 },
    data: {
      label: 'HTTP 请求',
      method: 'POST',
      url: '/api/notify',
      headers: '{"Content-Type": "application/json"}',
      body: '{"message": "{{llm-1.lastResult}}"}',
    },
  },
  {
    id: 'end-1',
    type: 'end',
    position: { x: 940, y: 200 },
    data: {
      label: '结束',
      outputVariable: 'finalResult',
      variables: '{"result": "{{llm-1.lastResult}}"}',
    },
  },
];

export const nodeTypes = {
  start: StartNode,
  llm: LlmNode,
  http: HttpNode,
  condition: ConditionNode,
  end: EndNode,
} satisfies NodeTypes;
