This repo is a free static-JSON API for the IANA Service Name and Transport Protocol Port Number
Registry (14,545 records across tcp/udp/sctp/dccp, including deprecated and removed entries).
`scripts/build.js` fetches
https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv with an
RFC 4180-compliant parser (IANA rows contain quoted fields with embedded commas and newlines) and
regenerates `data/ports.json` plus the `api/v1/` bucket tree; the build is deterministic
(byte-identical output for unchanged source), and `.github/workflows/update.yml` runs it monthly
and commits only when the data changed. GitHub Pages serves the result at
https://chirag127.github.io/tcp-ports-api/. Never edit the JSON under `data/` or `api/v1/` by
hand — regenerate with the script.
