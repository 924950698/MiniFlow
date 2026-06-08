export type ExecutionContext = {
  globals: Record<string, unknown>;
  nodes: Record<string, Record<string, unknown>>;
};

export function createExecutionContext(): ExecutionContext {
  return { globals: {}, nodes: {} };
}
