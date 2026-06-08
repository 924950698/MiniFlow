import type { VercelRequest, VercelResponse } from '@vercel/node';

import { proxyKimiChat, type KimiChatRequest } from '../../server/moonshot';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as KimiChatRequest;
    const result = await proxyKimiChat(body);

    res.status(result.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(result.body);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Kimi API 请求失败',
    });
  }
}
