# Superteam submission — CookiePay Receipts

## Project name
CookiePay Receipts

## One-line pitch
Send COOK on Cookie Chain and instantly turn the confirmed transaction into a human-readable, exportable receipt backed by CookieScan.

## Submission description
CookiePay is a lightweight payment + proof cApp built specifically for Cookie Chain. Users connect Nightly Wallet, send native COOK to any Cookie Chain address, receive real-time transaction status, and get a clean receipt containing sender, recipient, amount, confirmation slot, signature, timestamp, and direct CookieScan verification.

The app also shows live wallet balance, current Cookie Chain slot, RPC latency and recent wallet activity. An optional Cookie Jar preset makes it easy to support the ecosystem public-goods vault without hiding or auto-executing the transaction; Nightly still requires explicit approval.

CookiePay never sees or stores private keys. Signing occurs inside Nightly Wallet.

## Required links before submission
- Live app: https://ranvirjrj-beep.github.io/cookiepay-receipts/ (verify after Pages activation)
- Public GitHub: https://github.com/ranvirjrj-beep/cookiepay-receipts
- X demo thread: [ADD AFTER POSTING]
- Example confirmed CookieScan transaction: [ADD AFTER TINY TEST TX]

## Bounty requirement mapping
- Nightly wallet support: yes
- Display connected wallet: yes
- On-chain interaction: native COOK transfer
- Transaction execution: yes
- Confirmation handling: yes
- Error/status feedback: yes
- App-specific data: payment receipt + JSON proof
- Activity: recent wallet transactions
- Public deployment: ready
- Open source + README: ready

## Demo capture checklist
1. Show CookiePay landing page.
2. Click Connect Nightly.
3. Approve Cookie Chain network and wallet connection.
4. Show wallet address, balance, current slot and RPC pulse.
5. Enter recipient + tiny amount (or use Cookie Jar preset).
6. Click Send & create receipt.
7. Show Nightly approval popup without exposing sensitive data.
8. Show status transitions: preparing → approve → broadcasting → confirmation.
9. Show confirmed receipt.
10. Open Verify on CookieScan.
11. Download JSON receipt.
12. Show transaction in Recent Wallet Activity.
