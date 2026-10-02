import { readFile } from 'node:fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const html = await readFile(
    new URL('../../public/india-trip-game/india.html', import.meta.url),
    'utf8',
  );
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
