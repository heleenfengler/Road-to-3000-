#!/usr/bin/env node
/**
 * Pull weekly tracker rows from Google Apps Script (JSONP) and write data.json.
 *
 * Usage:
 *   node scripts/sync-data.mjs
 *   WEEKLY_DATA_URL=https://... node scripts/sync-data.mjs
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'data.json');

const DEFAULT_URL =
  'https://script.google.com/a/macros/healthbridge.co.za/s/AKfycbwFMh4w08yjevcnfcJ9XtBJ81wITzjax-bOG___jjQNFlFf8mCnw9X1WwaAXKgqJLN-aw/exec';

const DATA_URL = process.env.WEEKLY_DATA_URL || DEFAULT_URL;
const CALLBACK = '__hbSync';

function parseJsonp(text, callbackName) {
  const prefix = `${callbackName}(`;
  const start = text.indexOf(prefix);
  if (start === -1) throw new Error('JSONP callback not found in response');
  const jsonText = text.slice(start + prefix.length).replace(/\)\s*;?\s*$/, '');
  return JSON.parse(jsonText);
}

function normalizeRow(row) {
  return {
    date: String(row.date).slice(0, 10),
    total: Number(row.total),
    contributor: row.contributor || '',
    note: row.note || '',
  };
}

async function fetchRows() {
  const url = `${DATA_URL}${DATA_URL.includes('?') ? '&' : '?'}callback=${CALLBACK}&t=${Date.now()}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} from weekly data URL`);
  const text = await res.text();
  const payload = parseJsonp(text, CALLBACK);
  if (!payload?.ok || !Array.isArray(payload.rows)) {
    throw new Error('Unexpected payload shape (expected { ok: true, rows: [...] })');
  }
  return payload.rows.map(normalizeRow).sort((a, b) => a.date.localeCompare(b.date));
}

function loadExistingMeta() {
  try {
    const existing = JSON.parse(readFileSync(OUT, 'utf8'));
    return {
      startOfYear: existing.startOfYear ?? 1715,
      target: existing.target ?? 3000,
      finishDate: existing.finishDate ?? '2026-10-31',
      plan: existing.plan ?? [1769, 1792, 1831, 1898, 2043, 2226, 2458, 2691, 3022],
    };
  } catch {
    return {
      startOfYear: 1715,
      target: 3000,
      finishDate: '2026-10-31',
      plan: [1769, 1792, 1831, 1898, 2043, 2226, 2458, 2691, 3022],
    };
  }
}

async function main() {
  console.log('Fetching weekly data…');
  const rows = await fetchRows();
  if (rows.length === 0) throw new Error('No rows returned from data source');

  const meta = loadExistingMeta();
  const out = {
    updatedAt: new Date().toISOString(),
    ...meta,
    rows,
  };

  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  const last = rows[rows.length - 1];
  console.log(`Wrote ${rows.length} rows to data.json (latest: ${last.date}, total ${last.total})`);
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
