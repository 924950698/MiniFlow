import type { ExecutionContext } from './context';

const VAR_PATTERN = /\{\{([^}]+)\}\}/g;

function getByPath(root: unknown, path: string): unknown {
  const parts = path.trim().split('.');
  let current: unknown = root;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function resolveRef(path: string, ctx: ExecutionContext): unknown {
  const trimmed = path.trim();
  if (!trimmed) {
    return undefined;
  }

  const dotIndex = trimmed.indexOf('.');
  if (dotIndex === -1) {
    if (trimmed in ctx.globals) {
      return ctx.globals[trimmed];
    }
    return ctx.nodes[trimmed];
  }

  const nodeId = trimmed.slice(0, dotIndex);
  const fieldPath = trimmed.slice(dotIndex + 1);

  if (nodeId in ctx.nodes) {
    return getByPath(ctx.nodes[nodeId], fieldPath);
  }

  return getByPath({ ...ctx.globals, ...ctx.nodes }, trimmed);
}

export function interpolate(template: string, ctx: ExecutionContext): string {
  return template.replace(VAR_PATTERN, (_match, rawPath: string) => {
    const value = resolveRef(rawPath, ctx);
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  });
}

export function parseJsonTemplate(
  jsonStr: string,
  ctx: ExecutionContext,
): Record<string, unknown> {
  const trimmed = jsonStr.trim();
  if (!trimmed) {
    return {};
  }

  const interpolated = interpolate(trimmed, ctx);
  const parsed = JSON.parse(interpolated) as unknown;

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('变量模板必须是 JSON 对象');
  }

  return parsed as Record<string, unknown>;
}

export function formatDisplayValue(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
