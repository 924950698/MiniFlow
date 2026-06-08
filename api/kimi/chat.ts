const PLACEHOLDER_KEYS = new Set([
  '',
  'your_moonshot_api_key_here',
  'sk-xxxxxxxx',
]);

type KimiChatRequest = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
};

function getMoonshotConfig() {
  return {
    apiKey: (process.env.MOONSHOT_API_KEY ?? '').trim(),
    apiBase: (process.env.MOONSHOT_API_BASE ?? 'https://api.moonshot.cn/v1').trim(),
  };
}

function isApiKeyConfigured(apiKey: string): boolean {
  return Boolean(apiKey) && !PLACEHOLDER_KEYS.has(apiKey.trim());
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await request.json()) as KimiChatRequest;
    const { apiKey, apiBase } = getMoonshotConfig();

    if (!isApiKeyConfigured(apiKey)) {
      return jsonResponse(
        {
          error:
            '未配置有效的 MOONSHOT_API_KEY。请在 Vercel → Settings → Environment Variables 添加 MOONSHOT_API_KEY（勾选 Production），保存后进入 Deployments 重新 Deploy。',
        },
        500,
      );
    }

    const upstream = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Kimi API 请求失败' },
      500,
    );
  }
}
