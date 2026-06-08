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

import { LlmConfigPanel } from './components/LlmConfigPanel';
import { NodeCreator } from './components/NodeCreator';
import { initialEdges, edgeTypes } from './edges';
import { initialNodes, nodeTypes } from './nodes';
import type { AppNode, WorkflowNodeData } from './nodes/types';

export default function App() {
  const [nodes, setNodes] = useState<AppNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedLlmNode, setSelectedLlmNode] = useState<AppNode | null>(null);

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
    setSelectedLlmNode((current) =>
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
      setSelectedLlmNode((current) =>
        current?.id === nodeId
          ? { ...current, data: { ...current.data, ...data } }
          : current,
      );
    },
    [],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const llmNode =
        selectedNodes.length === 1 && selectedNodes[0].type === 'llm'
          ? (selectedNodes[0] as AppNode)
          : null;
      setSelectedLlmNode(llmNode);
    },
    [],
  );

  return (
    <div style={{ height: '100%', width: '100%' }}>
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
          拖拽移动节点 · 连线 · Delete 删除 · 选中 LLM 节点可配置并调用 Kimi
        </Panel>
        <NodeCreator onAddNode={onAddNode} />
        {selectedLlmNode && (
          <LlmConfigPanel node={selectedLlmNode} onUpdateNode={onUpdateNode} />
        )}
      </ReactFlow>
    </div>
  );
}
