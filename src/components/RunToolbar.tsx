import { Panel, type Edge } from '@xyflow/react';
import { useCallback, useState } from 'react';

import { runWorkflow, type WorkflowRunResult } from '../engine/runWorkflow';
import { formatDisplayValue } from '../engine/variables';
import type { AppNode, WorkflowNodeData } from '../nodes/types';

type RunToolbarProps = {
  nodes: AppNode[];
  edges: Edge[];
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
};

export function RunToolbar({ nodes, edges, onUpdateNode }: RunToolbarProps) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<WorkflowRunResult | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setLastResult(null);

    const result = await runWorkflow(nodes, edges, onUpdateNode);
    setLastResult(result);
    setRunning(false);
  }, [nodes, edges, onUpdateNode]);

  return (
    <Panel position="top-center" className="run-toolbar">
      <button
        type="button"
        className="run-toolbar__button"
        onClick={handleRun}
        disabled={running}
      >
        {running ? '运行中...' : '▶ 运行'}
      </button>

      {lastResult && (
        <div
          className={`run-toolbar__result run-toolbar__result--${
            lastResult.success ? 'success' : 'error'
          }`}
        >
          {lastResult.success ? (
            <>
              <span className="run-toolbar__result-label">完成</span>
              {lastResult.finalOutput != null && (
                <pre className="run-toolbar__result-body">
                  {formatDisplayValue(lastResult.finalOutput)}
                </pre>
              )}
            </>
          ) : (
            <>
              <span className="run-toolbar__result-label">失败</span>
              <span className="run-toolbar__result-error">{lastResult.error}</span>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
