import { ReactFlow, Background, Controls,  applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useState, useCallback } from 'react';


export default function App() {

  const initialNodes = [
    {
      id: 'n1',
      position: { x: 0, y: 0 },
      data: { label: 'Node 1' },
      type: 'input',
    },
    {
      id: 'n2',
      position: { x: 100, y: 100 },
      data: { label: 'Node 2' },
    },
     {
      id: 'n3',
      position: { x: 200, y: 200 },
      data: { label: 'Node 3' },
    },
  ];

  const initialEdges = [
    {
      id: 'n1-n2',
      source: 'n1',
      target: 'n2',
      type: 'step',
      label: 'connects with',
    },
     {
      id: 'n2-n3',
      source: 'n2',
      target: 'n3',
    },
  ];

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow 
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

