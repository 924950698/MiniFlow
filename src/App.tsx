import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useState } from 'react';

import { NodeConfigPanel } from './components/NodeConfigPanel';
import { NodeCreator } from './components/NodeCreator';
import { initialEdges, edgeTypes } from './edges';
import { initialNodes, nodeTypes } from './nodes';
import type { AppNode, WorkflowNodeData } from './nodes/types';

export default function App() {
  const [nodes, setNodes] = useState<AppNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange<AppNode>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge(connection, eds)),
    [],
  );

  const onNodesDelete = useCallback((deleted: AppNode[]) => {
    const deletedIds = new Set(deleted.map((node) => node.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !deletedIds.has(edge.source) && !deletedIds.has(edge.target),
      ),
    );
    setSelectedNode((current) =>
      current && deletedIds.has(current.id) ? null : current,
    );
  }, []);

  const onAddNode = useCallback((node: AppNode) => {
    setNodes((nds) => [...nds, node]);
  }, []);

  const onUpdateNode = useCallback(
    (nodeId: string, data: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node,
        ),
      );
      setSelectedNode((current) =>
        current?.id === nodeId
          ? { ...current, data: { ...current.data, ...data } }
          : current,
      );
    },
    [],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const node =
        selectedNodes.length === 1 ? (selectedNodes[0] as AppNode) : null;
      setSelectedNode(node);
    },
    [],
  );

  const onClosePanel = useCallback(() => {
    setSelectedNode(null);
    setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
  }, []);

  return (
    <div className={`app-shell${selectedNode ? ' app-shell--with-panel' : ''}`}>
      <div className="app-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onSelectionChange={onSelectionChange}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
        >
          <Background />
          <Controls />
          <Panel position="top-left" className="react-flow-hint">
            点击节点右侧配置 · 拖拽连线 · Delete 删除
          </Panel>
          <NodeCreator onAddNode={onAddNode} />
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdateNode={onUpdateNode}
          onClose={onClosePanel}
        />
      )}
    </div>
  );
}
