#!/usr/bin/env node
// Regenerates data/ and api/v1/ from the IANA Service Name and Transport
// Protocol Port Number Registry CSV. No timestamp in the output: unchanged
// source data must produce byte-identical files, or "commit only if changed"
// never settles.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv';
const ROOT = path.join(__dirname, '..');

// RFC 4180: IANA rows contain quoted fields with embedded commas and newlines,
// so a naive split(',') mangles hundreds of rows.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const emptyToNull = (value) => (value === '' ? null : value);

async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} for ${SOURCE_URL}`);
  }
  const text = await res.text();

  const rows = parseCSV(text);
  const header = rows[0];
  const expected = ['Service Name', 'Port Number', 'Transport Protocol', 'Description', 'Assignee', 'Contact', 'Registration Date', 'Modification Date', 'Reference', 'Service Code', 'Unauthorized Use Reported', 'Assignment Notes'];
  if (header.join(',') !== expected.join(',')) {
    throw new Error(`Unexpected CSV header: ${header.join(',')}`);
  }

  // Single ports get an integer; range rows (e.g. "225-241", historically
  // reserved blocks) get portRange instead. transport is null when IANA left
  // it blank — that happens for deprecated and removed entries too.
  const records = rows.slice(1).map((r) => ({
    port: /^\d+$/.test(r[1]) ? parseInt(r[1], 10) : null,
    portRange: /^\d+-\d+$/.test(r[1]) ? r[1] : null,
    transport: emptyToNull(r[2]),
    name: emptyToNull(r[0]),
    description: emptyToNull(r[3]),
    assignee: emptyToNull(r[4]),
    registrationDate: emptyToNull(r[6]),
  }));

  // Bucket by the low 1000s: 0-999 … 49000-49999, plus no-port.json for rows
  // without a usable port. Range rows are filed under their start port.
  const buckets = new Map();
  for (const record of records) {
    let key;
    if (record.port !== null) key = `${Math.floor(record.port / 1000) * 1000}`;
    else if (record.portRange !== null) key = `${Math.floor(parseInt(record.portRange, 10) / 1000) * 1000}`;
    else key = 'no-port';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(record);
  }

  const index = [];
  for (const [key, list] of buckets) {
    const label = key === 'no-port' ? 'no-port' : `${key}-${Math.min(Number(key) + 999, 65535)}`;
    index.push({ bucket: label, file: `ports/${label}.json`, count: list.length });
  }
  index.sort((a, b) => (a.bucket === 'no-port') - (b.bucket === 'no-port') || a.bucket.localeCompare(b.bucket, undefined, { numeric: true }));

  const write = (rel, data) => {
    const file = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  };

  const document = { generatedFrom: SOURCE_URL, count: records.length, records };
  write('data/ports.json', document);
  write('api/v1/ports.json', document);
  write('api/v1/ports/index.json', { generatedFrom: SOURCE_URL, buckets: index });
  for (const [key, list] of buckets) {
    const label = key === 'no-port' ? 'no-port' : `${key}-${Math.min(Number(key) + 999, 65535)}`;
    write(`api/v1/ports/${label}.json`, {
      generatedFrom: SOURCE_URL,
      bucket: label,
      count: list.length,
      records: list,
    });
  }

  const transports = {};
  for (const r of records) transports[r.transport ?? 'unspecified'] = (transports[r.transport ?? 'unspecified'] ?? 0) + 1;
  console.log(
    `ports: ${records.length} records written; ` +
    `transports: ${JSON.stringify(transports)}; ` +
    `range rows: ${records.filter((r) => r.portRange).length}; ` +
    `bucket files: ${buckets.size}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
