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
    const rawBody = await request.text();
    let payload: unknown = rawBody;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      // keep raw string
    }

    return jsonResponse({
      ok: true,
      received: payload,
      message: 'Mock notify endpoint',
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Notify mock failed' },
      500,
    );
  }
}
