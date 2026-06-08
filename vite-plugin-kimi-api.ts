import type { Plugin, PreviewServer, ViteDevServer } from 'vite';

import {
  handleNotifyPayload,
  proxyKimiChat,
  type KimiChatRequest,
} from './api/_lib/moonshot';

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

    try {
      const rawBody = await readBody(req);
      const body = JSON.parse(rawBody) as KimiChatRequest;
      const result = await proxyKimiChat(body, { apiKey, apiBase });

      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(result.body);
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
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(handleNotifyPayload(rawBody));
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
