import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <title>Page Not Found | ilovetexts</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #F8F9FC;
            color: #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
          }
          .not-found-container {
            text-align: center;
            padding: 60px 40px;
            max-width: 560px;
            background: #FFFFFF;
            border-radius: 24px;
            box-shadow: 0 20px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03);
          }
          .error-icon {
            font-size: 4rem;
            margin-bottom: 12px;
            display: block;
          }
          .error-code {
            font-size: 7rem;
            font-weight: 900;
            margin: 0;
            line-height: 1;
            letter-spacing: -0.04em;
            background: linear-gradient(135deg, #E5322D, #FF6B6B);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 800;
            margin: 20px 0 12px;
            color: #111827;
            letter-spacing: -0.02em;
          }
          p {
            font-size: 1rem;
            color: #4B5563;
            margin-bottom: 36px;
            line-height: 1.7;
          }
          .btn-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .home-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #E5322D;
            color: white;
            padding: 14px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.95rem;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(229, 50, 45, 0.25);
          }
          .home-btn:hover {
            background: #D42621;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(229, 50, 45, 0.3);
          }
          .tools-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #F1F3F9;
            color: #111827;
            padding: 14px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.95rem;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #E5E7EB;
          }
          .tools-btn:hover {
            background: #E5E7EB;
            transform: translateY(-2px);
          }
          .popular-links {
            margin-top: 40px;
            padding-top: 28px;
            border-top: 1px solid #E5E7EB;
          }
          .popular-links h3 {
            font-size: 0.78rem;
            font-weight: 700;
            color: #9CA3AF;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 16px;
          }
          .popular-links-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
          .popular-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 14px;
            background: #F8F9FC;
            border: 1px solid #E5E7EB;
            border-radius: 9999px;
            color: #4B5563;
            text-decoration: none;
            font-size: 0.82rem;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .popular-link:hover {
            border-color: #E5322D;
            color: #E5322D;
            background: #FFF0EF;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #0B0E17; color: #E8ECF4; }
            .not-found-container { background: #141825; box-shadow: 0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04); }
            h1 { color: #E8ECF4; }
            p { color: #9CA3B8; }
            .tools-btn { background: #1E2235; border-color: #2A2F45; color: #E8ECF4; }
            .tools-btn:hover { background: #2A2F45; }
            .popular-links { border-top-color: #1E2235; }
            .popular-link { background: #1E2235; border-color: #2A2F45; color: #9CA3B8; }
            .popular-link:hover { border-color: #E5322D; color: #FF6B6B; background: rgba(229,50,45,0.1); }
          }
        `}</style>
      </head>
      <body>
        <div className="not-found-container">
          <span className="error-icon">♥</span>
          <div className="error-code">404</div>
          <h1>Page not found</h1>
          <p>
            The page you're looking for doesn't exist or has been moved. 
            Don't worry — we have {`250+`} free text tools waiting for you!
          </p>
          <div className="btn-row">
            <Link href="/" className="home-btn">
              ← Go Home
            </Link>
            <Link href="/#all-tools" className="tools-btn">
              Browse All Tools
            </Link>
          </div>
          <div className="popular-links">
            <h3>Popular Tools</h3>
            <div className="popular-links-grid">
              <Link href="/word-counting-tools/word-counter" className="popular-link">📊 Word Counter</Link>
              <Link href="/text-case-converter/uppercase" className="popular-link">⬆️ Uppercase</Link>
              <Link href="/code-formatter/json-formatter" className="popular-link">📋 JSON Formatter</Link>
              <Link href="/generators-randomizers/password-generator" className="popular-link">🔑 Password Generator</Link>
              <Link href="/text-extractor/regex-tester" className="popular-link">🔍 Regex Tester</Link>
              <Link href="/text-encoder-decoder/base64-encode-decode" className="popular-link">🔐 Base64</Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
