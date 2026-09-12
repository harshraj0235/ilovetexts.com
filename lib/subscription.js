// ═══════════════════════════════════════════════════════
// lib/subscription.js — Freemium plan & usage tracking
// Stores everything in localStorage (no server needed)
// ═══════════════════════════════════════════════════════

const STORAGE_KEY = 'ilt_subscription';
const USAGE_KEY = 'ilt_usage';

// ── Plan Definitions ─────────────────────────────────
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    badge: '🆓',
    color: '#6b7280',
    limits: {
      'batch-pdf-processor':      3,   // files per batch
      'pdf-to-excel':             3,   // pages per day
      'ocr-unlimited':            5,   // pages per day
      'pdf-redactor':             3,   // pages per day
      'pdf-watermark-remover':    2,   // pages per day
      'pdf-summarizer':           3,   // summaries per day
      'pdf-compressor':           3,   // files per day
      '_maxFileSize':             10,  // MB
      '_maxPages':                20,  // max pages per PDF
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 199,
    priceYearly: 1499,
    badge: '⚡',
    color: '#7c3aed',
    limits: {
      'batch-pdf-processor':      50,
      'pdf-to-excel':             999,
      'ocr-unlimited':            999,
      'pdf-redactor':             999,
      'pdf-watermark-remover':    999,
      'pdf-summarizer':           999,
      'pdf-compressor':           999,
      '_maxFileSize':             50,
      '_maxPages':                200,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 499,
    priceYearly: 3999,
    badge: '🏢',
    color: '#0ea5e9',
    limits: {
      'batch-pdf-processor':      999,
      'pdf-to-excel':             999,
      'ocr-unlimited':            999,
      'pdf-redactor':             999,
      'pdf-watermark-remover':    999,
      'pdf-summarizer':           999,
      'pdf-compressor':           999,
      '_maxFileSize':             100,
      '_maxPages':                500,
    },
  },
};

// ── Feature list for pricing cards ───────────────────
export const FEATURES = [
  { name: 'Basic PDF tools (split, merge, convert)',   free: true,  pro: true,  business: true  },
  { name: 'Batch PDF processing',                      free: '3 files',  pro: '50 files',  business: 'Unlimited' },
  { name: 'PDF to Excel with table detection',         free: '3 pages/day', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'OCR for scanned PDFs',                      free: '5 pages/day', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'PDF redaction tool',                        free: '3 pages/day', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Watermark remover',                         free: '2 pages/day', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'AI PDF summarizer',                         free: '3/day',  pro: 'Unlimited', business: 'Unlimited' },
  { name: 'PDF compressor',                            free: '3/day',  pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Max file size',                             free: '10 MB', pro: '50 MB',  business: '100 MB' },
  { name: 'Max pages per PDF',                         free: '20',    pro: '200',    business: '500'    },
  { name: 'API access',                                free: false,   pro: false,    business: true     },
  { name: 'Priority support',                          free: false,   pro: true,     business: true     },
];

// ── Premium tool IDs (tools that have usage limits) ──
export const PREMIUM_TOOL_IDS = [
  'batch-pdf-processor',
  'pdf-to-excel',
  'ocr-unlimited',
  'pdf-redactor',
  'pdf-watermark-remover',
  'pdf-summarizer',
  'pdf-compressor',
];

// ── Helpers ──────────────────────────────────────────

function getToday() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJSON(key, value) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Plan Management ──────────────────────────────────

/** Get the user's current plan ID */
export function getPlan() {
  const sub = readJSON(STORAGE_KEY, {});
  if (!sub.planId || !PLANS[sub.planId]) return 'free';
  // Check expiry
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return 'free';
  return sub.planId;
}

/** Get full plan object */
export function getPlanDetails() {
  return PLANS[getPlan()];
}

/** Check if user has Pro or higher */
export function isPro() {
  const plan = getPlan();
  return plan === 'pro' || plan === 'business';
}

/** Activate a plan (called after payment or for testing) */
export function activatePlan(planId, durationMonths = 1) {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + durationMonths);
  writeJSON(STORAGE_KEY, {
    planId,
    activatedAt: new Date().toISOString(),
    expiresAt: expires.toISOString(),
  });
}

/** Deactivate / revert to free */
export function deactivatePlan() {
  writeJSON(STORAGE_KEY, { planId: 'free' });
}

/** Get subscription info */
export function getSubscriptionInfo() {
  const sub = readJSON(STORAGE_KEY, {});
  return {
    planId: getPlan(),
    plan: getPlanDetails(),
    activatedAt: sub.activatedAt || null,
    expiresAt: sub.expiresAt || null,
  };
}

// ── Usage Tracking ───────────────────────────────────

/** Get today's usage for a tool */
export function getUsage(toolId) {
  const usage = readJSON(USAGE_KEY, {});
  const today = getToday();
  if (!usage[today] || !usage[today][toolId]) return 0;
  return usage[today][toolId];
}

/** Record one use of a tool */
export function recordUsage(toolId) {
  const usage = readJSON(USAGE_KEY, {});
  const today = getToday();
  // Clean up old dates (keep only today)
  const cleaned = { [today]: usage[today] || {} };
  cleaned[today][toolId] = (cleaned[today][toolId] || 0) + 1;
  writeJSON(USAGE_KEY, cleaned);
  return cleaned[today][toolId];
}

/** Check if user can use a tool (returns usage info) */
export function checkUsage(toolId) {
  const plan = getPlanDetails();
  const limit = plan.limits[toolId];
  if (limit === undefined) return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
  
  const used = getUsage(toolId);
  const remaining = Math.max(0, limit - used);
  return {
    allowed: remaining > 0,
    used,
    limit,
    remaining,
  };
}

/** Get the max file size in bytes for current plan */
export function getMaxFileSize() {
  const plan = getPlanDetails();
  return (plan.limits._maxFileSize || 10) * 1024 * 1024;
}

/** Get the max pages for current plan */
export function getMaxPages() {
  const plan = getPlanDetails();
  return plan.limits._maxPages || 20;
}

/** Check file size against plan limit */
export function checkFileSize(sizeBytes) {
  const max = getMaxFileSize();
  return {
    allowed: sizeBytes <= max,
    size: sizeBytes,
    maxSize: max,
    maxMB: max / (1024 * 1024),
  };
}
