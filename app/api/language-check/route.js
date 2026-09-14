const LANGUAGE_TOOL_URL = 'https://api.languagetoolplus.com/v2/check';
const MAX_TEXT_LENGTH = 20_000;

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const text = String(formData.get('text') || '').trim();
  const language = String(formData.get('language') || 'auto');

  if (!text) {
    return Response.json({ error: 'Text is required.' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json({ error: `Text must be ${MAX_TEXT_LENGTH.toLocaleString()} characters or fewer.` }, { status: 413 });
  }
  if (!/^(auto|[a-z]{2,3}(?:-[A-Z]{2})?)$/.test(language)) {
    return Response.json({ error: 'Unsupported language value.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(LANGUAGE_TOOL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text, language }),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) {
      return Response.json({ error: 'The checking service is temporarily unavailable.' }, { status: 502 });
    }
    const data = await upstream.json();
    return Response.json({ matches: Array.isArray(data.matches) ? data.matches : [] }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'The checking service is temporarily unavailable.' }, { status: 502 });
  }
}
