export const runtime = 'nodejs';

export function GET(request) {
  return Response.redirect(
    new URL('/india-trip-game/india.html', request.url),
    307,
  );
}
