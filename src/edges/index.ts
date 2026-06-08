import type { Edge, EdgeTypes } from '@xyflow/react';

export const initialEdges: Edge[] = [
  { id: 'start-llm', source: 'start-1', target: 'llm-1' },
  { id: 'llm-cond', source: 'llm-1', target: 'cond-1' },
  {
    id: 'cond-http',
    source: 'cond-1',
    sourceHandle: 'true',
    target: 'http-1',
    label: '是',
  },
  {
    id: 'cond-end',
    source: 'cond-1',
    sourceHandle: 'false',
    target: 'end-1',
    label: '否',
  },
  { id: 'http-end', source: 'http-1', target: 'end-1' },
];

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
