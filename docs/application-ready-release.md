# ApplicationReady release scope

## Deployable free workflow

Route: `/workflows/application-ready`, linked from the workflow hub and English sitemap. Other language URLs canonicalise to English and are noindexed; this is not a translated service.

This release is a local PDF organiser for Indian university graduates preparing uni-assist application documents. It does not contain a complete university-specific requirements database. Four source-linked starting items, checked against the official country guidance on 2026-09-12, are supplemented by user-entered programme requirements. Official references are embedded in the rule version and export. Reports recommend rechecking sources after 30 days; always recheck before submission.

The browser inspects up to 20 PDFs, 10 MB each, 40 MB total, 100 pages per PDF. Each inspection has a 45-second timeout. Password-protected, damaged, unsupported and over-limit files fail visibly. Low-text pages are not called blank or invalid. Classification and checklist confirmation are manual. Duplicate files are flagged, not discarded.

Every accepted PDF is retained byte-for-byte. PDF.js receives a copy, never the original buffer. ZIP export checks SHA-256 again, uses traversal-safe collision-free paths and includes a text preparation report plus JSON manifest. PDFs are not sanitised or authenticated; users should treat originals as untrusted files. ZIPs are not encrypted and may contain personal data. No sensitive data is logged, uploaded or persisted by this workflow. Ordinary site page analytics remain unchanged.

No payment, account, expert review, automatic submission, OCR, certified translation, admission guarantee, issuer validation, cloud backup or recovery service is offered. None should be advertised as available.

## Verification commands

1. `npm run test:application-ready`
2. Scoped ESLint on the new components, route, engine and tests.
3. `npm run build`
4. `npx next start -p 4116`
5. `npm run test:application-ready:browser -- http://localhost:4116`
6. Alternate engine using the local TLS fixture described below: `npm run test:application-ready:browser -- https://127.0.0.1:4117 webkit`

Browser tests use synthetic PDFs only, block external network requests, compare exported original bytes, verify file removal invalidates checklist evidence and check mobile/dark layouts. They also verify that forms stay disabled without JavaScript. Test output is ignored under `test-results/`. Security headers are not removed or overridden by the test.

WebKit needs HTTPS because the site's production CSP upgrades insecure requests, including HTTP localhost assets. Generate a disposable local certificate with OpenSSL (create `test-results` if missing): `openssl req -x509 -newkey rsa:2048 -nodes -keyout test-results/localhost-key.pem -out test-results/localhost-cert.pem -days 2 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`. Start `node tests/local-https-proxy.mjs` alongside the port-4116 production server. The proxy binds only to 127.0.0.1:4117. Tests allow the self-signed certificate only for the local fixture, preserving production CSP. Never commit its private key or use this test server publicly.

## Operational checks before public launch

- Serve via HTTPS; Web Crypto is required. Verify the same-origin `/pdf.worker.min.mjs` is served and corresponds to the installed PDF.js version. This workflow adds the installed version to the worker URL's query string to avoid reusing a previous version's immutable cache entry.
- Check the actual deployment route, sitemap, canonical, browser console and complete import/export flow after deploy. A successful git push is not deployment verification.
- Confirm general site analytics/privacy disclosures and do not add session replay or form-field capture to this route.
- Review official sources regularly, version changes and test relevant examples. Do not expand scope from general organisation to admissions assessment without a qualified reviewer and representative fixtures.

## Commercial launch is blocked separately

Before enabling paid review: appoint a competent reviewer, define page/revision limits and actual service capacity, agree final consumer price and tax treatment, establish business/support identity, and publish appropriate privacy, cancellation/refund and fulfilment terms. Configure a merchant account with server-side order creation, verified/idempotent webhooks and refund reconciliation. Browser-only success callbacks must not grant paid entitlements.

If human review requires uploads, add explicit informed consent, authenticated and authorised access, private storage, malware controls, retention/deletion policy, access audit and operational security review first. Do not collect applicant files through the current Office email-draft form. No paid review should be exposed merely by changing a client-side flag.

The free workflow is a production candidate, not proof of paid demand. Validate a small paid offer and fulfilment process before investing in a larger platform.
