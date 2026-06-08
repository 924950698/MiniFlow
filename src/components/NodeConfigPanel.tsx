import { useCallback, useState } from 'react';

import {
  callKimi,
  DEFAULT_KIMI_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  KIMI_MODELS,
} from '../services/kimi';
import {
  NODE_TYPE_LABELS,
  type AppNode,
  type WorkflowNodeData,
  type WorkflowNodeType,
} from '../nodes/types';

type NodeConfigPanelProps = {
  node: AppNode;
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onClose: () => void;
};

type FieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="node-config__field">
      <span className="node-config__label">{label}</span>
      {hint && <span className="node-config__hint">{hint}</span>}
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="node-config__section">
      <h3 className="node-config__section-title">{title}</h3>
      {children}
    </section>
  );
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const VARIABLES_HINT =
  'JSON 格式，支持 {{nodeId.output}} 引用上游节点输出，例如 {"input": "{{llm-1.lastResult}}"}';

function StartConfig({
  data,
  update,
}: {
  data: WorkflowNodeData;
  update: (patch: Partial<WorkflowNodeData>) => void;
}) {
  return (
    <Section title="流程入口">
      <Field label="描述" hint="说明此流程的触发方式或用途">
        <textarea
          rows={3}
          value={data.description ?? ''}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="例如：用户提交表单后触发"
        />
      </Field>
      <Field label="初始变量" hint="流程启动时注入的变量">
        <textarea
          rows={4}
          value={data.variables ?? ''}
          onChange={(e) => update({ variables: e.target.value })}
          placeholder='{"userId": "", "query": ""}'
          className="node-config__mono"
        />
      </Field>
    </Section>
  );
}

function LlmConfig({
  node,
  data,
  update,
}: {
  node: AppNode;
  data: WorkflowNodeData;
  update: (patch: Partial<WorkflowNodeData>) => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const model = data.model ?? DEFAULT_KIMI_MODEL;
  const systemPrompt = data.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const userInput = data.userInput ?? '';
  const status = data.status ?? 'idle';

  const handleRun = useCallback(async () => {
    if (!userInput.trim()) {
      setError('请先填写用户输入');
      return;
    }

    setRunning(true);
    setError(null);
    update({ status: 'running', lastResult: undefined });

    try {
      const result = await callKimi({ model, systemPrompt, userMessage: userInput });
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
    <Section title="Kimi 参数">
      <div className="node-config__status-row">
        <span className={`node-config__status node-config__status--${status}`}>
          {status === 'running'
            ? '调用中'
            : status === 'success'
              ? '成功'
              : status === 'error'
                ? '失败'
                : '待运行'}
        </span>
        <span className="node-config__node-id">{node.id}</span>
      </div>

      <Field label="模型">
        <select value={model} onChange={(e) => update({ model: e.target.value })}>
          {KIMI_MODELS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="系统提示词 (System Prompt)">
        <textarea
          rows={4}
          value={systemPrompt}
          onChange={(e) => update({ systemPrompt: e.target.value })}
          placeholder="定义 Kimi 的角色与行为"
        />
      </Field>

      <Field label="用户输入 (User Prompt)" hint="支持 {{变量名}} 引用流程变量">
        <textarea
          rows={4}
          value={userInput}
          onChange={(e) => update({ userInput: e.target.value })}
          placeholder="发送给 Kimi 的消息"
        />
      </Field>

      <button
        type="button"
        className="node-config__action node-config__action--primary"
        onClick={handleRun}
        disabled={running}
      >
        {running ? '调用中...' : '测试调用 Kimi'}
      </button>

      {error && <div className="node-config__error">{error}</div>}

      {data.lastResult && (
        <Field label="最近输出">
          <pre className="node-config__result">{data.lastResult}</pre>
        </Field>
      )}
    </Section>
  );
}

function HttpConfig({
  data,
  update,
}: {
  data: WorkflowNodeData;
  update: (patch: Partial<WorkflowNodeData>) => void;
}) {
  return (
    <Section title="HTTP 参数">
      <Field label="请求方法">
        <select
          value={data.method ?? 'GET'}
          onChange={(e) => update({ method: e.target.value })}
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </Field>

      <Field label="请求 URL" hint="支持 {{变量}} 动态替换">
        <input
          type="text"
          value={data.url ?? ''}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="https://api.example.com/data"
          className="node-config__mono"
        />
      </Field>

      <Field label="请求头 (Headers)" hint="JSON 格式">
        <textarea
          rows={3}
          value={data.headers ?? ''}
          onChange={(e) => update({ headers: e.target.value })}
          placeholder='{"Content-Type": "application/json"}'
          className="node-config__mono"
        />
      </Field>

      <Field label="请求体 (Body)" hint="POST/PUT 时使用，支持 {{变量}}">
        <textarea
          rows={5}
          value={data.body ?? ''}
          onChange={(e) => update({ body: e.target.value })}
          placeholder='{"key": "{{input}}"}'
          className="node-config__mono"
        />
      </Field>
    </Section>
  );
}

function ConditionConfig({
  data,
  update,
}: {
  data: WorkflowNodeData;
  update: (patch: Partial<WorkflowNodeData>) => void;
}) {
  return (
    <Section title="分支条件">
      <Field
        label="条件表达式"
        hint="JavaScript 表达式，返回 true 走「是」分支，false 走「否」分支"
      >
        <textarea
          rows={3}
          value={data.condition ?? ''}
          onChange={(e) => update({ condition: e.target.value })}
          placeholder="result.score > 0.8"
          className="node-config__mono"
        />
      </Field>

      <div className="node-config__row">
        <Field label="是分支标签">
          <input
            type="text"
            value={data.trueLabel ?? '是'}
            onChange={(e) => update({ trueLabel: e.target.value })}
          />
        </Field>
        <Field label="否分支标签">
          <input
            type="text"
            value={data.falseLabel ?? '否'}
            onChange={(e) => update({ falseLabel: e.target.value })}
          />
        </Field>
      </div>
    </Section>
  );
}

function EndConfig({
  data,
  update,
}: {
  data: WorkflowNodeData;
  update: (patch: Partial<WorkflowNodeData>) => void;
}) {
  return (
    <Section title="流程输出">
      <Field label="输出变量名" hint="将最终结果写入此变量名">
        <input
          type="text"
          value={data.outputVariable ?? ''}
          onChange={(e) => update({ outputVariable: e.target.value })}
          placeholder="finalResult"
          className="node-config__mono"
        />
      </Field>
      <Field label="输出映射" hint="JSON 格式，定义返回给调用方的数据结构">
        <textarea
          rows={5}
          value={data.variables ?? ''}
          onChange={(e) => update({ variables: e.target.value })}
          placeholder='{"result": "{{llm-1.lastResult}}"}'
          className="node-config__mono"
        />
      </Field>
    </Section>
  );
}

function TypeSpecificConfig({
  node,
  data,
  update,
}: {
  node: AppNode;
  data: WorkflowNodeData;
  update: (patch: Partial<WorkflowNodeData>) => void;
}) {
  const type = node.type as WorkflowNodeType;

  switch (type) {
    case 'start':
      return <StartConfig data={data} update={update} />;
    case 'llm':
      return <LlmConfig node={node} data={data} update={update} />;
    case 'http':
      return <HttpConfig data={data} update={update} />;
    case 'condition':
      return <ConditionConfig data={data} update={update} />;
    case 'end':
      return <EndConfig data={data} update={update} />;
    default:
      return null;
  }
}

export function NodeConfigPanel({
  node,
  onUpdateNode,
  onClose,
}: NodeConfigPanelProps) {
  const type = node.type as WorkflowNodeType;
  const data = node.data;

  const update = useCallback(
    (patch: Partial<WorkflowNodeData>) => onUpdateNode(node.id, patch),
    [node.id, onUpdateNode],
  );

  const showCommonVariables = type !== 'start' && type !== 'end';

  return (
    <aside className="node-config">
      <div className="node-config__header">
        <div>
          <div className="node-config__title">{NODE_TYPE_LABELS[type]}</div>
          <div className="node-config__subtitle">{data.label}</div>
        </div>
        <button
          type="button"
          className="node-config__close"
          onClick={onClose}
          aria-label="关闭配置面板"
        >
          ×
        </button>
      </div>

      <div className="node-config__body">
        <Section title="基础信息">
          <Field label="节点名称">
            <input
              type="text"
              value={data.label}
              onChange={(e) => update({ label: e.target.value })}
            />
          </Field>
          <Field label="节点 ID" hint="流程内唯一标识，可用于变量引用">
            <input type="text" value={node.id} readOnly className="node-config__readonly" />
          </Field>
          {showCommonVariables && (
            <Field label="输入变量" hint={VARIABLES_HINT}>
              <textarea
                rows={3}
                value={data.variables ?? ''}
                onChange={(e) => update({ variables: e.target.value })}
                placeholder='{"input": "{{start-1.variables.query}}"}'
                className="node-config__mono"
              />
            </Field>
          )}
        </Section>

        <TypeSpecificConfig node={node} data={data} update={update} />
      </div>
    </aside>
  );
}
