# X thread — final draft

1/ Most crypto payments leave you with a transaction hash.

Technically proof. Practically, not a receipt.

So I built CookiePay 🍪 — a Cookie Chain cApp that turns native COOK transfers into human-readable, verifiable receipts.

2/ The flow is simple:

Connect Nightly → enter a recipient + COOK amount → approve in the wallet.

CookiePay constructs the transfer, broadcasts it through Cookie Chain RPC, tracks confirmation, shows errors clearly, and only creates the receipt after confirmation.

3/ Each confirmed receipt can include:

• amount
• sender + recipient
• timestamp
• confirmed slot
• transaction signature
• direct CookieScan verification

It can also be copied or exported as JSON proof.

4/ I added a lightweight network + wallet dashboard too:

• live COOK balance
• current Cookie Chain slot
• RPC latency
• recent wallet activity

There’s also an optional Cookie Jar preset for the ecosystem public-goods vault.

5/ Nightly integration is live-tested on the public app, including wallet detection, connection, Cookie Chain custom SVM validation, connected-address display and live balance/RPC queries.

The project wallet used for validation is intentionally unfunded, so I’m not pretending a fake demo transaction happened.

6/ CookiePay is fully open source, static-deployable and needs no backend/API key.

Live app: https://ranvirjrj-beep.github.io/cookiepay-receipts/
GitHub: https://github.com/ranvirjrj-beep/cookiepay-receipts
Bridge: https://hyperlane.cookiescan.io

Built for the Cookie Chain cApp bounty. 🍪
