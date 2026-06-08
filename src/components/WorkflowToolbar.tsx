import { Panel, type Edge } from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';

import { runWorkflow, type WorkflowRunResult } from '../engine/runWorkflow';
import { formatDisplayValue } from '../engine/variables';
import type { AppNode, WorkflowNodeData } from '../nodes/types';
import {
  downloadWorkflowJson,
  parseWorkflowFile,
  deserializeWorkflow,
} from '../workflow/serialization';

type WorkflowToolbarProps = {
  nodes: AppNode[];
  edges: Edge[];
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onLoadWorkflow: (nodes: AppNode[], edges: Edge[]) => void;
};

export function WorkflowToolbar({
  nodes,
  edges,
  onUpdateNode,
  onLoadWorkflow,
}: WorkflowToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<WorkflowRunResult | null>(null);
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setLastResult(null);
    setImportMessage(null);

    const result = await runWorkflow(nodes, edges, onUpdateNode);
    setLastResult(result);
    setRunning(false);
  }, [nodes, edges, onUpdateNode]);

  const handleExport = useCallback(() => {
    setImportMessage(null);
    downloadWorkflowJson(nodes, edges);
  }, [nodes, edges]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) {
        return;
      }

      setImportMessage(null);

      try {
        const text = await file.text();
        const parsed = parseWorkflowFile(text);
        const restored = deserializeWorkflow(parsed);
        onLoadWorkflow(restored.nodes, restored.edges);
        setImportMessage({
          type: 'success',
          text: `已导入 ${restored.nodes.length} 个节点、${restored.edges.length} 条连线`,
        });
      } catch (error) {
        setImportMessage({
          type: 'error',
          text: error instanceof Error ? error.message : '导入失败',
        });
      }
    },
    [onLoadWorkflow],
  );

  return (
    <Panel position="top-center" className="workflow-toolbar">
      <div className="workflow-toolbar__actions">
        <button
          type="button"
          className="workflow-toolbar__button workflow-toolbar__button--run"
          onClick={handleRun}
          disabled={running}
        >
          {running ? '运行中...' : '▶ 运行'}
        </button>
        <button
          type="button"
          className="workflow-toolbar__button workflow-toolbar__button--secondary"
          onClick={handleExport}
        >
          导出 JSON
        </button>
        <button
          type="button"
          className="workflow-toolbar__button workflow-toolbar__button--secondary"
          onClick={handleImportClick}
        >
          导入 JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="workflow-toolbar__file-input"
          onChange={handleImportFile}
        />
      </div>

      {lastResult && (
        <div
          className={`workflow-toolbar__message workflow-toolbar__message--${
            lastResult.success ? 'success' : 'error'
          }`}
        >
          {lastResult.success ? (
            <>
              <span className="workflow-toolbar__message-label">运行完成</span>
              {lastResult.finalOutput != null && (
                <pre className="workflow-toolbar__message-body">
                  {formatDisplayValue(lastResult.finalOutput)}
                </pre>
              )}
            </>
          ) : (
            <>
              <span className="workflow-toolbar__message-label">运行失败</span>
              <span className="workflow-toolbar__message-error">{lastResult.error}</span>
            </>
          )}
        </div>
      )}

      {importMessage && (
        <div
          className={`workflow-toolbar__message workflow-toolbar__message--${importMessage.type}`}
        >
          {importMessage.text}
        </div>
      )}
    </Panel>
  );
}
