import { Handle, Position, type NodeProps } from '@xyflow/react';

import { formatDisplayValue } from '../engine/variables';
import type { AppNode, NodeRunStatus, WorkflowNodeType } from './types';

type WorkflowNodeShellProps = {
  variant: WorkflowNodeType;
  icon: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  handles: React.ReactNode;
  runStatus?: NodeRunStatus;
};

const runStatusLabel: Record<NodeRunStatus, string> = {
  idle: '',
  running: '运行中',
  success: '已完成',
  error: '失败',
  skipped: '已跳过',
};

function WorkflowNodeShell({
  variant,
  icon,
  title,
  subtitle,
  children,
  handles,
  runStatus = 'idle',
}: WorkflowNodeShellProps) {
  const statusLabel = runStatusLabel[runStatus];

  return (
    <div
      className={`workflow-node workflow-node--${variant}${
        runStatus === 'running' ? ' workflow-node--active' : ''
      }${runStatus === 'success' ? ' workflow-node--done' : ''}${
        runStatus === 'error' ? ' workflow-node--failed' : ''
      }`}
    >
      <div className="workflow-node__header">
        <span className="workflow-node__icon">{icon}</span>
        <div className="workflow-node__titles">
          <div className="workflow-node__title">{title}</div>
          {subtitle && <div className="workflow-node__subtitle">{subtitle}</div>}
        </div>
      </div>
      {statusLabel && (
        <div className={`workflow-node__badge workflow-node__badge--${runStatus}`}>
          {statusLabel}
        </div>
      )}
      {children}
      {handles}
    </div>
  );
}

function RunOutputPreview({ output }: { output: unknown }) {
  const text = formatDisplayValue(output);
  if (!text) {
    return null;
  }

  const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;

  return (
    <div className="workflow-node__detail workflow-node__detail--mono">{preview}</div>
  );
}

export function StartNode({ data }: NodeProps<AppNode>) {
  return (
    <WorkflowNodeShell
      variant="start"
      icon="▶"
      title={data.label}
      subtitle="流程入口"
      runStatus={data.runStatus}
      handles={<Handle type="source" position={Position.Bottom} />}
    >
      {data.runOutput != null && (
        <RunOutputPreview output={(data.runOutput as { variables?: unknown }).variables} />
      )}
    </WorkflowNodeShell>
  );
}

export function LlmNode({ data }: NodeProps<AppNode>) {
  const runStatus = data.runStatus ?? 'idle';
  const runOutput = data.runOutput as { lastResult?: string } | undefined;
  const preview =
    runOutput?.lastResult ??
    data.lastResult ??
    data.userInput ??
    data.systemPrompt ??
    data.prompt;

  return (
    <WorkflowNodeShell
      variant="llm"
      icon="K"
      title={data.label}
      subtitle={`Kimi · ${data.model ?? 'kimi-k2.5'}`}
      runStatus={runStatus}
      handles={
        <>
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </>
      }
    >
      {preview && <div className="workflow-node__detail">{preview}</div>}
    </WorkflowNodeShell>
  );
}

export function HttpNode({ data }: NodeProps<AppNode>) {
  const method = data.method ?? 'GET';
  const url = data.url || '未配置 URL';
  const runOutput = data.runOutput as { status?: number; body?: string } | undefined;

  return (
    <WorkflowNodeShell
      variant="http"
      icon="⇄"
      title={data.label}
      subtitle={`${method} 请求`}
      runStatus={data.runStatus}
      handles={
        <>
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </>
      }
    >
      <div className="workflow-node__detail workflow-node__detail--mono">{url}</div>
      {runOutput && (
        <div className="workflow-node__detail workflow-node__detail--mono">
          {runOutput.status != null ? `HTTP ${runOutput.status}` : ''}
          {runOutput.body ? ` · ${runOutput.body.slice(0, 40)}` : ''}
        </div>
      )}
    </WorkflowNodeShell>
  );
}

export function ConditionNode({ data }: NodeProps<AppNode>) {
  const runOutput = data.runOutput as { branch?: string; value?: boolean } | undefined;

  return (
    <WorkflowNodeShell
      variant="condition"
      icon="?"
      title={data.label}
      subtitle="条件判断"
      runStatus={data.runStatus}
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
      {runOutput && (
        <div className="workflow-node__detail">
          结果: {runOutput.value ? '是' : '否'} → {runOutput.branch === 'true' ? '是分支' : '否分支'}
        </div>
      )}
      <div className="workflow-node__branch-labels">
        <span>{data.trueLabel ?? '是'}</span>
        <span>{data.falseLabel ?? '否'}</span>
      </div>
    </WorkflowNodeShell>
  );
}

export function EndNode({ data }: NodeProps<AppNode>) {
  const runOutput = data.runOutput as { result?: unknown } | undefined;

  return (
    <WorkflowNodeShell
      variant="end"
      icon="■"
      title={data.label}
      subtitle="流程出口"
      runStatus={data.runStatus}
      handles={<Handle type="target" position={Position.Top} />}
    >
      {runOutput?.result != null && <RunOutputPreview output={runOutput.result} />}
    </WorkflowNodeShell>
  );
}
