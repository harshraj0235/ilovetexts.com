// IndexNow verification endpoint — used by Bing, Yandex, and other search engines
// for instant page indexing notification
export async function GET() {
  return new Response('ilovetexts-indexnow-key-2026', {
    headers: { 'Content-Type': 'text/plain' },
  });
}
