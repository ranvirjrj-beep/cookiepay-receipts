# CookiePay Receipts 🍪

**Human-readable payment proof for Cookie Chain.**

CookiePay is an open-source Cookie Chain cApp built for the Superteam **Create an App on Cookie Chain** bounty. It connects Nightly Wallet, validates the active Cookie Chain SVM, sends native COOK when the connected wallet is funded, waits for on-chain confirmation, and turns a confirmed transaction into a clean receipt that can be copied, downloaded as JSON, and verified on CookieScan.

> Live app: https://ranvirjrj-beep.github.io/cookiepay-receipts/  
> Repository: https://github.com/ranvirjrj-beep/cookiepay-receipts

## What it does

- Connects **Nightly Wallet** through Wallet Standard.
- Validates that Nightly is on **Cookie Chain** using the live network genesis hash.
- Displays the connected wallet address.
- Sends a native **COOK** transfer to any valid Cookie Chain address when the wallet has sufficient COOK.
- Shows clear states for prepare → wallet approval → broadcast → confirmation → failure.
- Waits for `confirmed` commitment before creating a receipt.
- Shows live COOK balance, current slot, RPC latency, and recent wallet activity.
- Creates a receipt with sender, recipient, amount, timestamp, confirmed slot, and transaction signature.
- Links every receipt/activity item directly to **CookieScan**.
- Copies receipts to the clipboard or downloads structured JSON proof.
- Includes an optional **Cookie Jar** preset using the documented community vault address. Nothing is auto-sent; Nightly still requires explicit user approval.

## Network and wallet integration

CookiePay uses:

- Cookie Chain RPC: `https://rpc.cookiescan.io`
- Explorer: `https://cookiescan.io`
- Bridge: `https://hyperlane.cookiescan.io`
- Nightly injected Solana/SVM wallet API: `window.nightly.solana`
- Solana Web3.js: `@solana/web3.js` / browser bundle `1.98.4`

The app derives Cookie Chain's genesis hash from the live RPC and compares it with Nightly's active SVM. This avoids forcing a duplicate/unknown custom-network prompt when the user already selected Cookie Chain in Nightly.

## Run locally — zero build

The production bounty demo is intentionally plain static HTML/CSS/JS. From the repository root:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080` in a browser with Nightly installed.

Do **not** open `index.html` via `file://`; wallet extensions and browser security policies may behave differently outside an HTTP origin.

## Conventional React source

A React + TypeScript implementation is included in [`react-source/`](./react-source) for reviewers who prefer a normal application source tree.

```bash
cd react-source
npm install
npm run build
npm run dev
```

The root static version remains the deployment target so the public demo has no build-time dependency or secret requirement.

## Security model

- CookiePay never asks for or handles a seed phrase/private key.
- Signing happens inside Nightly Wallet.
- Transfers require explicit wallet approval.
- The app does not custody funds.
- No backend stores wallet addresses, receipts, or activity.
- Receipt JSON is created locally in the browser after confirmation.

Always review the recipient and amount in Nightly before approving a transaction.

## Live validation status

Verified in a real browser on 2026-09-07:

- Public GitHub Pages deployment loads successfully.
- Cookie Chain RPC responds live and returns current slot/latency.
- Nightly extension is detected by the app.
- A Nightly wallet connects successfully through Wallet Standard.
- Cookie Chain custom SVM is selected and validated without the previous `Unknown network` loop.
- Connected wallet address is displayed in the UI.
- Live balance query works and correctly reported the test wallet's `0.0000 COOK` balance.
- Transaction construction, Nightly signing request, RPC broadcast, confirmation handling, receipt rendering and CookieScan linking are implemented in source.

The project wallet used for browser validation is intentionally unfunded. **No fake or simulated on-chain transaction is claimed.** A funded user or reviewer can execute the transfer path directly from the public app; the app provides explicit status/error feedback if funds are insufficient.

See [`docs/VALIDATION.md`](./docs/VALIDATION.md) for implementation validation and [`docs/SUBMISSION.md`](./docs/SUBMISSION.md) for the final submission copy.

## Bounty requirement mapping

| Requirement | CookiePay |
|---|---|
| Public web app | GitHub Pages deployment |
| Open source | MIT |
| Nightly support | Wallet Standard + active SVM validation |
| Display wallet | Connected address in header |
| On-chain interaction | Native COOK transfer |
| Execute transaction | Signed in Nightly, broadcast through Cookie Chain RPC |
| Confirmation handling | Waits for confirmed commitment |
| Error/user feedback | Status panel and visible error messages |
| App-specific data | Receipt, balance, slot, latency, wallet activity |
| Explorer integration | CookieScan links on receipts/activity |
| README/setup | This document |
| X demo preparation | [`docs/X_THREAD_DRAFT.md`](./docs/X_THREAD_DRAFT.md) |

## Project layout

```text
.
├── index.html               # deployed app shell
├── app.js                   # Cookie Chain + Nightly logic
├── styles.css               # responsive UI
├── react-source/            # React/TypeScript reference implementation
├── docs/
│   ├── VALIDATION.md
│   ├── SUBMISSION.md
│   └── X_THREAD_DRAFT.md
└── .github/workflows/pages.yml
```

## Official resources

- Cookie Chain: https://www.cookiechain.wtf
- Cookie Chain docs: https://docs.cookiechain.wtf
- CookieScan: https://cookiescan.io
- Cookie Chain API: https://api.cookiescan.io
- Nightly Solana docs: https://docs.nightly.app/docs/solana/solana/
- Bounty listing: https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app

## License

MIT — see [`LICENSE`](./LICENSE).
