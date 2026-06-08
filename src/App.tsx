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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useState } from 'react';

import { NodeCreator } from './components/NodeCreator';
import { initialEdges, edgeTypes } from './edges';
import { initialNodes, nodeTypes } from './nodes';
import type { AppNode } from './nodes/types';

export default function App() {
  const [nodes, setNodes] = useState<AppNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

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
  }, []);

  const onAddNode = useCallback((node: AppNode) => {
    setNodes((nds) => [...nds, node]);
  }, []);

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
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="react-flow-hint">
          拖拽移动节点 · 从连接点拖出连线 · 选中后按 Delete 删除 · 右上角添加节点
        </Panel>
        <NodeCreator onAddNode={onAddNode} />
      </ReactFlow>
    </div>
  );
}
