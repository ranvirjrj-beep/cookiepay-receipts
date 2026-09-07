# Superteam submission — CookiePay Receipts

## Project name
CookiePay Receipts

## One-line pitch
Send COOK on Cookie Chain and turn a confirmed transfer into a human-readable, exportable receipt backed by CookieScan.

## Submission description
CookiePay is a lightweight payment + proof cApp built specifically for Cookie Chain. Users connect Nightly Wallet, the app validates the active Cookie Chain SVM, and a funded user can send native COOK to any Cookie Chain address. CookiePay provides real-time transaction status and, after confirmation, creates a clean receipt containing sender, recipient, amount, confirmation slot, signature, timestamp, and direct CookieScan verification.

The app also shows live wallet balance, current Cookie Chain slot, RPC latency and recent wallet activity. An optional Cookie Jar preset makes it easy to support the ecosystem public-goods vault without hiding or auto-executing the transaction; Nightly still requires explicit approval.

CookiePay never sees or stores private keys. Signing occurs inside Nightly Wallet.

## Submission links
- Live app: https://ranvirjrj-beep.github.io/cookiepay-receipts/
- Public GitHub: https://github.com/ranvirjrj-beep/cookiepay-receipts
- X demo thread: add the published thread URL here after posting
- Relevant program/contract addresses: none; CookiePay uses native COOK transfers and existing Cookie Chain infrastructure

## Live validation completed
- Public deployment: verified
- Cookie Chain RPC + current slot: verified live
- Nightly detection: verified
- Nightly wallet connection: verified
- Cookie Chain custom SVM selection/validation: verified
- Connected wallet display: verified
- Live balance query: verified (project wallet intentionally had 0 COOK)
- Transaction construction/signing/broadcast/confirmation/receipt path: implemented in source

The project wallet used for browser validation is intentionally unfunded. No fake transaction or simulated confirmation is claimed. A funded reviewer can execute the native COOK transfer path directly from the public app.

## Bounty requirement mapping
- Nightly wallet support: yes
- Display connected wallet: yes
- On-chain interaction: native COOK transfer
- Transaction execution: yes, through Nightly signing + Cookie Chain RPC broadcast
- Transaction confirmation handling: yes
- Error/status feedback: yes
- App-specific data: payment receipt + JSON proof
- Activity: recent wallet transactions
- Public deployment: yes
- Open source + README: yes

## Fast demo checklist
1. Open the live CookiePay page.
2. Show live Cookie Chain RPC pulse/current slot.
3. Click Connect Nightly and approve the wallet connection.
4. Show connected address and wallet balance.
5. Scroll to the payment form and show recipient + amount inputs.
6. Explain that a funded user signs in Nightly; CookiePay broadcasts, waits for confirmation, then creates the receipt and CookieScan link.
7. Show the GitHub repo and README requirement mapping.
8. End on the live app URL.

## Superteam form copy
**Project:** CookiePay Receipts

**Description:** CookiePay turns native COOK payments into human-readable, verifiable receipts. It integrates Nightly Wallet, Cookie Chain's live SVM RPC, real-time confirmation/error handling, wallet activity, balance/slot/latency data, CookieScan verification and downloadable JSON proof. The public app and open-source implementation are live and require no backend or API key.

**Live app:** https://ranvirjrj-beep.github.io/cookiepay-receipts/

**GitHub:** https://github.com/ranvirjrj-beep/cookiepay-receipts
