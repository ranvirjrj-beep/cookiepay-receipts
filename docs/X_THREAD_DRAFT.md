# X thread draft — replace bracketed URLs after deployment

1/ Most crypto payments leave you with a transaction hash.

Technically proof. Practically, not a receipt.

So I built CookiePay 🍪 — a tiny Cookie Chain cApp that turns a COOK transfer into human-readable, verifiable proof.

[DEMO CLIP]

2/ Connect Nightly → enter a recipient + COOK amount → approve the transaction.

CookiePay handles the rest:
• broadcasts on Cookie Chain
• tracks confirmation
• shows failures clearly
• creates the receipt only after the chain confirms it

3/ The receipt includes:
• amount
• sender + recipient
• timestamp
• confirmed slot
• transaction signature
• direct CookieScan verification

You can copy it or export the proof as JSON.

4/ I also added a small network/wallet dashboard: live COOK balance, Cookie Chain slot, RPC latency and recent wallet activity.

And there’s an optional Cookie Jar preset for anyone who wants to support the ecosystem public-goods vault.

5/ Under the hood, CookiePay uses Cookie Chain’s SVM RPC and Nightly Wallet for signing.

The app never sees a seed phrase or private key. Approval stays inside the wallet.

6/ Try it: https://ranvirjrj-beep.github.io/cookiepay-receipts/
Source: https://github.com/ranvirjrj-beep/cookiepay-receipts
Bridge / get COOK: https://hyperlane.cookiescan.io

Built for the Cookie Chain cApp bounty. 🍪
