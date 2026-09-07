# Validation record

## Source-level checks

- `node --check app.js` passes.
- The static deployment has no package-install or build step.
- React source is retained separately for reviewer readability.

## Nightly integration checked against current docs

CookiePay uses the documented Nightly Solana/SVM interfaces:

- `window.nightly.solana.features['standard:connect'].connect()`
- `window.nightly.solana.features['standard:disconnect'].disconnect()`
- `window.nightly.solana.features['standard:signTransaction'].signTransaction(...)`
- `window.nightly.solana.changeNetwork({ genesisHash, url })`

The network genesis hash is obtained from Cookie Chain via `Connection.getGenesisHash()` before requesting the switch.

References:

- https://docs.nightly.app/docs/solana/solana/connect/
- https://docs.nightly.app/docs/solana/solana/sign_transaction/
- https://docs.nightly.app/docs/solana/solana/change_network/

## Cookie Chain resources checked

- RPC: `https://rpc.cookiescan.io`
- Explorer: `https://cookiescan.io`
- Bridge: `https://hyperlane.cookiescan.io`
- Cookie Jar Vault 1: `568tU9FMksJDxjkLBjWisSA4J4C5uPH87NCCkyREwrxe`

Cookie Jar reference:

- https://docs.cookiechain.wtf/cookie-jar

## Required live validation

A real wallet is deliberately not automated because transaction approval belongs to the user. Before submission, capture one successful tiny transfer showing:

1. Nightly connection.
2. Cookie Chain network switch.
3. Non-zero wallet balance.
4. Transaction approval.
5. Confirmed receipt.
6. Matching CookieScan transaction.
7. Downloaded JSON receipt.

Record the signature and live URL in `docs/SUBMISSION.md` only after they exist. Never fabricate a transaction receipt.
