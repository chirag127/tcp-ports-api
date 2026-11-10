# TCP Ports API

All 14,545 records from the IANA Service Name and Transport Protocol Port Number Registry —
every port, transport, service name, description, assignee and registration date — served as free
static JSON.

No authentication. No server. No rate limit. The committed JSON is the database. Data is
refreshed automatically by GitHub Actions from the IANA registry.

    curl https://chirag127.github.io/tcp-ports-api/api/v1/ports.json

## What you get

| Field | Example | Notes |
|---|---|---|
| `port` | `443` | Integer port number, or `null` for rows without a usable port |
| `portRange` | `"225-241"` | Reserved blocks, e.g. historically reserved ranges — filed under their start port |
| `transport` | `"tcp"` | `tcp`, `udp`, `sctp`, `dccp` — or `null` when IANA left it blank (deprecated entries) |
| `name` | `"https"` | The IANA service name |
| `description` | `"http protocol over TLS/SSL"` | IANA's description, quoted verbatim |
| `assignee` | `"[IESG]"` | Assignee or contact, quoted verbatim (bracketed references included) |
| `registrationDate` | `"2012-07-31"` | ISO date, or `null` when not recorded |

## Endpoints

| Endpoint | Description | Size |
|---|---|---|
| `GET /api/v1/ports.json` | All 14,545 records | ~3.2 MB |
| `GET /api/v1/ports/index.json` | Bucket index: file name and record count per bucket | ~1 KB |
| `GET /api/v1/ports/{bucket}.json` | One bucket per file, e.g. `0-999.json` (1,525 records) through `49000-49999.json`, plus `no-port.json` (1,076 records without a usable port) | 51 files |
| `GET /data/ports.json` | Same data as above (source of truth for the repo) | ~3.2 MB |

## How it stays fresh

The `update.yml` workflow runs monthly, fetches
https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv,
regenerates the JSON and commits only when the data actually changed. GitHub Pages serves the
result. No server to run.

## Data source and accuracy

The [IANA Service Name and Transport Protocol Port Number Registry](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)
is the authoritative list of port assignments, maintained under IANA's assignment procedure.
All 14,545 registry rows are included: 6,614 tcp, 6,360 udp, 93 sctp, 11 dccp, and 1,467 rows
without a transport (deprecated or removed entries). It does not cover ephemeral ports that are
unregistered, and it carries IANA's records verbatim — including bracketed references and
historical notes. The CSV is parsed with an RFC 4180-compliant parser because IANA rows contain
quoted fields with embedded commas and newlines.

## Limits, stated plainly

- The full dataset is ~3.2 MB — fine for a one-off fetch, but use the bucket files if you need one range at a time.
- Deprecated and removed entries are kept with `null` fields rather than dropped, so the record count is larger than the number of usable ports.
- IANA's CSV is the source of truth for dates and assignees; some rows are sparse or historical.
- The registry is updated irregularly, so the monthly workflow may go many runs without a commit.

## Licence

Data: the IANA registry is published for informational use; this API republishes it with attribution
to IANA. Code: MIT.

---

## About the author

**Chirag Singhal** — building free, open APIs and tools. Everything here is free, no
authentication, no rate limits, no telemetry. If it saves you time and you want to work
together, that is exactly what this is for.

- **Email — the fastest way to reach me:** [chirag@oriz.in](mailto:chirag@oriz.in)
- **GitHub:** [github.com/chirag127](https://github.com/chirag127)
- **LinkedIn:** [linkedin.com/in/chirag127](https://www.linkedin.com/in/chirag127/)
- **X:** [x.com/singhal127](https://x.com/singhal127)
- **YouTube:** [@ChiragSinghal127](https://www.youtube.com/@ChiragSinghal127)
- **Instagram:** [chiragsinghal127](https://www.instagram.com/chiragsinghal127/)
- **Reddit:** [Far_Macaron_9910](https://www.reddit.com/user/Far_Macaron_9910/)
- **Buy me a coffee:** [buymeacoffee.com/chirag127](https://buymeacoffee.com/chirag127)

**Hiring?** I build developer tooling, data APIs and web platforms. Email me — I reply to
everything.
