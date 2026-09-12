# Office pilot: first release

## What is implemented

- Home: Free Tools / Workflows navigation, preserving the existing catalogue.
- `/workflows`: guided-work hub with one available free statement-review workflow and separately labelled optional paid assistance.
- `/workflows/statement-review`: local PDF/CSV draft extraction, source references, corrections, review state, duplicate and balance alerts, CSV/Excel/JSON export. No statement upload API, database, OCR or bank connection.
- `/office`: proposed pilot starting at ₹2,499, subject to feasibility, availability and written terms. The form prepares an email draft; it does not send or store a lead or charge a customer. The recipient is the contact address already published on the site.

## Founder decisions needed before paid delivery

Confirm the business identity, monitored support inbox, actual fulfilment availability and maximum monthly operating budget. Configure an approved merchant account without sharing secret keys in chat. Agree scope, document handling, delivery times, taxes, cancellation/refund terms and payment details with each pilot customer before taking payment. Do not accept live financial documents by an unapproved channel; use synthetic/redacted samples for feasibility review.

## First 30 days: sales experiment, not a revenue forecast

1. Manually recruit five small-office/accountant interviews through the founder's own network. Nothing has been sent automatically. Ask about one repetitive task, file types, volume, present time spent and the result they would pay for.
2. Demonstrate using synthetic data. Run a time-on-task comparison against their existing process. Measure missing/incorrect rows against independently checked source files, not just whether export succeeded.
3. Quote only a small volume and format that has passed the feasibility review. Record written acceptance, actual payments, delivery cost and refunds. Pilot enquiries are not revenue.
4. After the pilot, ask whether the customer would pay for another month. Expand only the workflow that customers repeatedly use and buy.

₹2–3 lakh in monthly revenue would require, for example, 81–121 purchases at ₹2,499 before taxes, fees, refunds and delivery costs. That is not a next-month forecast. Higher-value recurring plans require demonstrated value and a support/processing model that can sustain them. Do not buy traffic before validating a paid offer.

## Measurements

Track enquiries actually received, qualified conversations, written pilot agreements, payments collected, turnaround, correction rate, time saved, support time and renewals. The email-draft UI deliberately does not record enquiry text, names or financial data in analytics. Page visits alone are not leads. Configure consent-aware, content-free funnel events only after choosing the analytics/privacy setup.

Review Search Console monthly: eligible pages at positions 4–20, high-impression/low-click queries, and actual indexing exclusions. Improve the matching page and its tool, not repeated keyword pages. No first-page or traffic guarantees.

## Known limits and release gates

The new extractor is a conservative draft parser, not universal bank support. It does not handle scans, password entry, all PDF layouts, wrapped descriptions or accounting-package-specific imports. Inspect every source page for missing rows. Files must represent one currency per workspace. A running-balance alert does not establish completeness or correctness.

The older standalone finance tools still contain their earlier parsers and broad claims; this release introduces a separate reviewed workflow and does not certify those tools. Audit and migrate each one with feature-parity tests before marketing universal bank support or accuracy percentages.

Before offering paid extraction at scale: add representative authorized/redacted layout fixtures, independent accuracy evaluation, secure agreed document handling, authenticated customer access if required, server-verified payment webhooks and a measured fulfilment process. No live payments or paid infrastructure were enabled in this release.

Run `npm run test:statement-review`, the browser smoke test against a running local site, scoped lint and `npm run build` before deployment.
