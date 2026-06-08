import { Panel } from '@xyflow/react';
import { useCallback, useState } from 'react';

import {
  callKimi,
  DEFAULT_KIMI_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  KIMI_MODELS,
} from '../services/kimi';
import type { AppNode, WorkflowNodeData } from '../nodes/types';

type LlmConfigPanelProps = {
  node: AppNode;
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
};

export function LlmConfigPanel({ node, onUpdateNode }: LlmConfigPanelProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const model = node.data.model ?? DEFAULT_KIMI_MODEL;
  const systemPrompt = node.data.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const userInput = node.data.userInput ?? '';
  const lastResult = node.data.lastResult;
  const status = node.data.status ?? 'idle';

  const update = useCallback(
    (patch: Partial<WorkflowNodeData>) => {
      onUpdateNode(node.id, patch);
    },
    [node.id, onUpdateNode],
  );

  const handleRun = useCallback(async () => {
    if (!userInput.trim()) {
      setError('请先填写用户输入');
      return;
    }

    setRunning(true);
    setError(null);
    update({ status: 'running', lastResult: undefined });

    try {
      const result = await callKimi({
        model,
        systemPrompt,
        userMessage: userInput,
      });
      update({ status: 'success', lastResult: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : '调用失败';
      setError(message);
      update({ status: 'error', lastResult: message });
    } finally {
      setRunning(false);
    }
  }, [model, systemPrompt, update, userInput]);

  return (
    <Panel position="bottom-left" className="llm-config-panel">
      <div className="llm-config-panel__header">
        <div>
          <div className="llm-config-panel__title">Kimi 节点配置</div>
          <div className="llm-config-panel__subtitle">{node.data.label}</div>
        </div>
        <span className={`llm-config-panel__status llm-config-panel__status--${status}`}>
          {status === 'running'
            ? '调用中'
            : status === 'success'
              ? '成功'
              : status === 'error'
                ? '失败'
                : '待运行'}
        </span>
      </div>

      <label className="llm-config-panel__field">
        <span>模型</span>
        <select
          value={model}
          onChange={(e) => update({ model: e.target.value })}
        >
          {KIMI_MODELS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="llm-config-panel__field">
        <span>系统提示词</span>
        <textarea
          rows={3}
          value={systemPrompt}
          onChange={(e) => update({ systemPrompt: e.target.value })}
          placeholder="定义 Kimi 的角色与行为"
        />
      </label>

      <label className="llm-config-panel__field">
        <span>用户输入</span>
        <textarea
          rows={3}
          value={userInput}
          onChange={(e) => update({ userInput: e.target.value })}
          placeholder="发送给 Kimi 的消息"
        />
      </label>

      <button
        type="button"
        className="llm-config-panel__run"
        onClick={handleRun}
        disabled={running}
      >
        {running ? '调用中...' : '调用 Kimi'}
      </button>

      {error && <div className="llm-config-panel__error">{error}</div>}

      {lastResult && (
        <div className="llm-config-panel__result">
          <div className="llm-config-panel__result-title">最近输出</div>
          <pre>{lastResult}</pre>
        </div>
      )}
    </Panel>
  );
}
