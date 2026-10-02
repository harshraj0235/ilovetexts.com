import { mapsHandler } from '../../../../neon-coast/server/maps-api.mjs';

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function GET(request) {
  let status = 200, headers = {}, body = '';
  // Adapt the shared map service to Next's Web Response API.
  await mapsHandler({
    url: request.url,
    method: 'GET',
    socket: { remoteAddress: process.env.VERCEL ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown' : 'shared' },
  }, {
    writeHead(code, values = {}) { status = code; headers = values; },
    end(value = '') { body = value; },
  });
  return new Response(body, { status, headers });
}
