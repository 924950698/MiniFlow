import {
  callKimi,
  DEFAULT_KIMI_MODEL,
  DEFAULT_SYSTEM_PROMPT,
} from '../services/kimi';
import type { AppNode } from '../nodes/types';
import type { ExecutionContext } from './context';
import { interpolate, parseJsonTemplate } from './variables';

export type NodeExecutionResult = {
  input: unknown;
  output: Record<string, unknown>;
};

async function executeStart(
  node: AppNode,
  ctx: ExecutionContext,
): Promise<NodeExecutionResult> {
  const raw = node.data.variables ?? '';
  const input = { variables: raw };

  let parsed: Record<string, unknown> = {};
  if (raw.trim()) {
    parsed = parseJsonTemplate(raw, ctx);
    Object.assign(ctx.globals, parsed);
  }

  const output = { variables: parsed };
  return { input, output };
}

async function executeLlm(
  node: AppNode,
  ctx: ExecutionContext,
): Promise<NodeExecutionResult> {
  const model = node.data.model ?? DEFAULT_KIMI_MODEL;
  const systemPrompt = node.data.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const userInputRaw = node.data.userInput ?? '';
  const userMessage = interpolate(userInputRaw, ctx);

  const input = { model, systemPrompt, userInput: userMessage };

  if (!userMessage.trim()) {
    throw new Error('LLM 节点缺少用户输入');
  }

  const lastResult = await callKimi({ model, systemPrompt, userMessage });
  const output = { lastResult };

  return { input, output };
}

async function executeHttp(
  node: AppNode,
  ctx: ExecutionContext,
): Promise<NodeExecutionResult> {
  const method = (node.data.method ?? 'GET').toUpperCase();
  const urlRaw = node.data.url ?? '';
  const url = interpolate(urlRaw, ctx);

  if (!url.trim()) {
    throw new Error('HTTP 节点缺少请求 URL');
  }

  let headers: Record<string, string> = {};
  if (node.data.headers?.trim()) {
    const parsed = parseJsonTemplate(node.data.headers, ctx);
    headers = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value)]),
    );
  }

  let body: string | undefined;
  if (node.data.body?.trim() && method !== 'GET' && method !== 'HEAD') {
    body = interpolate(node.data.body, ctx);
  }

  const input = { method, url, headers, body };

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const responseBody = await response.text();
  const output = {
    status: response.status,
    ok: response.ok,
    body: responseBody,
  };

  return { input, output };
}

function evaluateCondition(expression: string, ctx: ExecutionContext): boolean {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error('条件节点缺少表达式');
  }

  try {
    const fn = new Function('globals', 'nodes', `return !!(${trimmed});`);
    return Boolean(fn(ctx.globals, ctx.nodes));
  } catch (error) {
    const message = error instanceof Error ? error.message : '表达式无效';
    throw new Error(`条件表达式执行失败: ${message}`);
  }
}

async function executeCondition(
  node: AppNode,
  ctx: ExecutionContext,
): Promise<NodeExecutionResult> {
  const condition = node.data.condition ?? '';
  const input = { condition, globals: { ...ctx.globals }, nodes: { ...ctx.nodes } };
  const value = evaluateCondition(condition, ctx);
  const branch = value ? 'true' : 'false';
  const output = { value, branch };

  return { input, output };
}

async function executeEnd(
  node: AppNode,
  ctx: ExecutionContext,
): Promise<NodeExecutionResult> {
  const raw = node.data.variables ?? '';
  const input = { variables: raw, outputVariable: node.data.outputVariable };

  let result: Record<string, unknown> = {};
  if (raw.trim()) {
    result = parseJsonTemplate(raw, ctx);
  }

  const output = { result, outputVariable: node.data.outputVariable ?? 'finalResult' };
  return { input, output };
}

const executors: Record<
  string,
  (node: AppNode, ctx: ExecutionContext) => Promise<NodeExecutionResult>
> = {
  start: executeStart,
  llm: executeLlm,
  http: executeHttp,
  condition: executeCondition,
  end: executeEnd,
};

export async function executeNode(
  node: AppNode,
  ctx: ExecutionContext,
): Promise<NodeExecutionResult> {
  const executor = executors[node.type ?? ''];
  if (!executor) {
    throw new Error(`未知节点类型: ${node.type}`);
  }

  return executor(node, ctx);
}
