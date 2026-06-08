import type { Plugin, PreviewServer, ViteDevServer } from 'vite';

type KimiChatRequest = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
};

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const PLACEHOLDER_KEYS = new Set([
  '',
  'your_moonshot_api_key_here',
  'sk-xxxxxxxx',
]);

function isApiKeyConfigured(apiKey: string) {
  return Boolean(apiKey) && !PLACEHOLDER_KEYS.has(apiKey.trim());
}

function createKimiHandler(apiKey: string, apiBase: string) {
  return async (
    req: import('http').IncomingMessage,
    res: import('http').ServerResponse,
    next: () => void,
  ) => {
    if (req.method !== 'POST') {
      next();
      return;
    }

    if (!isApiKeyConfigured(apiKey)) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            '未配置有效的 MOONSHOT_API_KEY。请在 .env 中填入从 https://platform.moonshot.cn/console/api-keys 获取的真实 API Key，然后重启 npm run dev',
        }),
      );
      return;
    }

    try {
      const rawBody = await readBody(req);
      const body = JSON.parse(rawBody) as KimiChatRequest;

      const response = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.text();
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(result);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Kimi API 请求失败',
        }),
      );
    }
  };
}

function attachKimiMiddleware(
  server: ViteDevServer | PreviewServer,
  apiKey: string,
  apiBase: string,
) {
  server.middlewares.use('/api/kimi/chat', createKimiHandler(apiKey, apiBase));

  server.middlewares.use(
    '/api/notify',
    (
      req: import('http').IncomingMessage,
      res: import('http').ServerResponse,
      next: () => void,
    ) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      readBody(req)
        .then((rawBody) => {
          let payload: unknown = rawBody;
          try {
            payload = JSON.parse(rawBody);
          } catch {
            // keep raw string
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              received: payload,
              message: 'Mock notify endpoint',
            }),
          );
        })
        .catch((error) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Notify mock failed',
            }),
          );
        });
    },
  );
}

export function kimiApiPlugin(apiKey: string, apiBase: string): Plugin {
  return {
    name: 'kimi-api',
    configureServer(server) {
      attachKimiMiddleware(server, apiKey, apiBase);
    },
    configurePreviewServer(server) {
      attachKimiMiddleware(server, apiKey, apiBase);
    },
  };
}
