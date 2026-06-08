import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { AppNode, WorkflowNodeType } from './types';

type WorkflowNodeShellProps = {
  variant: WorkflowNodeType;
  icon: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  handles: React.ReactNode;
};

function WorkflowNodeShell({
  variant,
  icon,
  title,
  subtitle,
  children,
  handles,
}: WorkflowNodeShellProps) {
  return (
    <div className={`workflow-node workflow-node--${variant}`}>
      <div className="workflow-node__header">
        <span className="workflow-node__icon">{icon}</span>
        <div className="workflow-node__titles">
          <div className="workflow-node__title">{title}</div>
          {subtitle && <div className="workflow-node__subtitle">{subtitle}</div>}
        </div>
      </div>
      {children}
      {handles}
    </div>
  );
}

export function StartNode({ data }: NodeProps<AppNode>) {
  return (
    <WorkflowNodeShell
      variant="start"
      icon="▶"
      title={data.label}
      subtitle="流程入口"
      handles={<Handle type="source" position={Position.Bottom} />}
    />
  );
}

const llmStatusLabel: Record<string, string> = {
  running: '调用中',
  success: '已完成',
  error: '失败',
};

export function LlmNode({ data }: NodeProps<AppNode>) {
  const status = data.status ?? 'idle';
  const preview = data.lastResult ?? data.userInput ?? data.systemPrompt ?? data.prompt;

  return (
    <WorkflowNodeShell
      variant="llm"
      icon="K"
      title={data.label}
      subtitle={`Kimi · ${data.model ?? 'kimi-k2.5'}`}
      handles={
        <>
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </>
      }
    >
      {status !== 'idle' && (
        <div className={`workflow-node__badge workflow-node__badge--${status}`}>
          {llmStatusLabel[status] ?? status}
        </div>
      )}
      {preview && (
        <div className="workflow-node__detail">{preview}</div>
      )}
    </WorkflowNodeShell>
  );
}

export function HttpNode({ data }: NodeProps<AppNode>) {
  const method = data.method ?? 'GET';
  const url = data.url || '未配置 URL';

  return (
    <WorkflowNodeShell
      variant="http"
      icon="⇄"
      title={data.label}
      subtitle={`${method} 请求`}
      handles={
        <>
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </>
      }
    >
      <div className="workflow-node__detail workflow-node__detail--mono">{url}</div>
    </WorkflowNodeShell>
  );
}

export function ConditionNode({ data }: NodeProps<AppNode>) {
  return (
    <WorkflowNodeShell
      variant="condition"
      icon="?"
      title={data.label}
      subtitle="条件判断"
      handles={
        <>
          <Handle type="target" position={Position.Top} />
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            style={{ left: '30%' }}
          />
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            style={{ left: '70%' }}
          />
        </>
      }
    >
      <div className="workflow-node__detail">
        {data.condition || '未配置条件表达式'}
      </div>
      <div className="workflow-node__branch-labels">
        <span>{data.trueLabel ?? '是'}</span>
        <span>{data.falseLabel ?? '否'}</span>
      </div>
    </WorkflowNodeShell>
  );
}

export function EndNode({ data }: NodeProps<AppNode>) {
  return (
    <WorkflowNodeShell
      variant="end"
      icon="■"
      title={data.label}
      subtitle="流程出口"
      handles={<Handle type="target" position={Position.Top} />}
    />
  );
}
