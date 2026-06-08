export const PLACEHOLDER_KEYS = new Set([
  '',
  'your_moonshot_api_key_here',
  'sk-xxxxxxxx',
]);

export type MoonshotConfig = {
  apiKey: string;
  apiBase: string;
};

export function getMoonshotConfig(
  overrides?: Partial<MoonshotConfig>,
): MoonshotConfig {
  return {
    apiKey: overrides?.apiKey ?? process.env.MOONSHOT_API_KEY ?? '',
    apiBase:
      overrides?.apiBase ??
      process.env.MOONSHOT_API_BASE ??
      'https://api.moonshot.cn/v1',
  };
}

export function isApiKeyConfigured(apiKey: string): boolean {
  return Boolean(apiKey) && !PLACEHOLDER_KEYS.has(apiKey.trim());
}

export const MISSING_API_KEY_MESSAGE =
  '未配置有效的 MOONSHOT_API_KEY。请在 Vercel 项目 Settings → Environment Variables 中添加 MOONSHOT_API_KEY，或在本地 .env 中配置后重启开发服务器';

export type KimiChatRequest = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
};

export async function proxyKimiChat(
  body: KimiChatRequest,
  config?: Partial<MoonshotConfig>,
): Promise<{ status: number; body: string }> {
  const { apiKey, apiBase } = getMoonshotConfig(config);

  if (!isApiKeyConfigured(apiKey)) {
    return {
      status: 500,
      body: JSON.stringify({ error: MISSING_API_KEY_MESSAGE }),
    };
  }

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

export function handleNotifyPayload(rawBody: string): string {
  let payload: unknown = rawBody;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // keep raw string
  }

  return JSON.stringify({
    ok: true,
    received: payload,
    message: 'Mock notify endpoint',
  });
}
