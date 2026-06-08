export const KIMI_MODELS = [
  { id: 'kimi-k2.5', label: 'Kimi K2.5（推荐）' },
  { id: 'kimi-k2.6', label: 'Kimi K2.6（旗舰）' },
  { id: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
  { id: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
  { id: 'moonshot-v1-128k', label: 'Moonshot V1 128K' },
] as const;

export const DEFAULT_KIMI_MODEL = 'kimi-k2.5';

export const DEFAULT_SYSTEM_PROMPT =
  '你是 Kimi，由 Moonshot AI 提供的人工智能助手。请根据用户输入给出准确、有帮助的回答。';

type KimiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type KimiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function formatKimiError(message: string | undefined, status: number) {
  if (!message) {
    return `请求失败 (${status})`;
  }

  if (message.includes('Invalid Authentication')) {
    return 'API Key 无效或未配置，请检查 .env 中的 MOONSHOT_API_KEY 是否正确，并重启开发服务器';
  }

  if (message.includes('insufficient balance') || message.includes('余额')) {
    return '账户余额不足，请在 Moonshot 控制台充值后再试';
  }

  return message;
}

export type KimiCallParams = {
  model: string;
  systemPrompt: string;
  userMessage: string;
};

/** Kimi K2 系列仅支持 temperature = 1 */
function getTemperature(model: string): number {
  if (model.startsWith('kimi-k2')) {
    return 1;
  }
  return 0.3;
}

export async function callKimi({
  model,
  systemPrompt,
  userMessage,
}: KimiCallParams): Promise<string> {
  const messages: KimiMessage[] = [];

  if (systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt.trim() });
  }

  messages.push({ role: 'user', content: userMessage.trim() });

  const response = await fetch('/api/kimi/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      temperature: getTemperature(model),
    }),
  });

  const data = (await response.json()) as KimiChatResponse & {
    error?: string | { message?: string };
  };

  if (!response.ok) {
    const apiError =
      typeof data.error === 'string' ? data.error : data.error?.message;
    throw new Error(formatKimiError(apiError, response.status));
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('Kimi 返回了空结果');
  }

  return content;
}
