import { Panel, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

import { nodeTemplates, type NodeTemplate } from '../nodes/templates';
import type { AppNode } from '../nodes/types';

type NodeCreatorProps = {
  onAddNode: (node: AppNode) => void;
};

function createNodeId() {
  return `node-${Date.now()}`;
}

export function NodeCreator({ onAddNode }: NodeCreatorProps) {
  const { screenToFlowPosition } = useReactFlow();

  const handleAdd = useCallback(
    (template: NodeTemplate) => {
      const center = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const offset = Math.random() * 60 - 30;

      onAddNode({
        id: createNodeId(),
        type: template.type,
        position: { x: center.x + offset, y: center.y + offset },
        data: { label: template.label },
      });
    },
    [onAddNode, screenToFlowPosition],
  );

  return (
    <Panel position="top-right" className="node-creator">
      <div className="node-creator__title">添加节点</div>
      <div className="node-creator__buttons">
        {nodeTemplates.map((template) => (
          <button
            key={template.type ?? 'default'}
            type="button"
            className="node-creator__button"
            onClick={() => handleAdd(template)}
          >
            {template.label}
          </button>
        ))}
      </div>
    </Panel>
  );
}
