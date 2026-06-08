import type { VercelRequest, VercelResponse } from '@vercel/node';

import { handleNotifyPayload } from '../../server/moonshot';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody =
      typeof req.body === 'string'
        ? req.body
        : req.body
          ? JSON.stringify(req.body)
          : '';

    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    return res.send(handleNotifyPayload(rawBody));
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Notify mock failed',
    });
  }
}
