# CookiePay Receipts 🍪

**Human-readable payment proof for Cookie Chain.**

CookiePay is an open-source Cookie Chain cApp built for the Superteam **Create an App on Cookie Chain** bounty. It connects Nightly Wallet, switches the wallet to Cookie Chain, sends native COOK, waits for on-chain confirmation, and turns the confirmed transaction into a clean receipt that can be copied, downloaded as JSON, and verified on CookieScan.

> Repository: https://github.com/ranvirjrj-beep/cookiepay-receipts  
> Intended GitHub Pages URL: https://ranvirjrj-beep.github.io/cookiepay-receipts/

## What it does

- Connects **Nightly Wallet** through Wallet Standard.
- Requests a switch to **Cookie Chain** using the live network genesis hash and official RPC.
- Displays the connected wallet address.
- Sends a native **COOK** transfer to any valid Cookie Chain address.
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

Nightly's documented custom SVM flow uses `changeNetwork({ genesisHash, url })`; CookiePay derives the genesis hash from the Cookie Chain RPC instead of hard-coding it.

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

## Validation status

Completed in source:

- Static JavaScript syntax validation with `node --check app.js`.
- Wallet method shapes cross-checked against current Nightly docs (`standard:connect`, `standard:disconnect`, `standard:signTransaction`, `changeNetwork`).
- Cookie Jar address cross-checked against Cookie Chain documentation.
- RPC/explorer/bridge URLs cross-checked against the current bounty/resources.
- Responsive static UI and receipt/activity flows implemented.

Still requires a user-controlled wallet validation before bounty submission:

1. Open the public deployment in a browser with Nightly installed.
2. Approve the Cookie Chain network switch and wallet connection.
3. Execute one tiny COOK transfer.
4. Capture the confirmed receipt and its CookieScan transaction URL.
5. Record the short X demo and submit the live app + GitHub + X thread to Superteam.

No confirmed transaction is claimed in this repository until that wallet-controlled test is performed.

## Bounty requirement mapping

| Requirement | CookiePay |
|---|---|
| Public web app | Root static app + Pages workflow |
| Open source | MIT |
| Nightly support | Wallet Standard + Nightly network switch |
| Display wallet | Connected address in header |
| On-chain interaction | Native COOK transfer |
| Execute transaction | Signed in Nightly, broadcast through Cookie Chain RPC |
| Confirmation handling | Waits for confirmed commitment |
| Error/user feedback | Status panel and failure messages |
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
