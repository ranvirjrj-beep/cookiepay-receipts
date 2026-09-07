/* CookiePay Receipts — zero-build browser app for Cookie Chain. */
(() => {
  'use strict';

  const RPC_URL = 'https://rpc.cookiescan.io';
  const EXPLORER_URL = 'https://cookiescan.io';
  const COOKIE_JAR = '568tU9FMksJDxjkLBjWisSA4J4C5uPH87NCCkyREwrxe';
  const { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } = window.solanaWeb3;
  const connection = new Connection(RPC_URL, 'confirmed');

  let account = null;
  let publicKey = null;
  let busy = false;
  let receipt = null;

  const $ = (id) => document.getElementById(id);
  const walletButton = $('walletButton');
  const refreshButton = $('refreshButton');
  const paymentForm = $('paymentForm');
  const recipientInput = $('recipient');
  const amountInput = $('amount');
  const jarButton = $('jarButton');
  const sendButton = $('sendButton');
  const statusText = $('statusText');
  const statusDot = $('statusDot');
  const rpcLatency = $('rpcLatency');
  const slotText = $('slot');
  const balanceText = $('balance');
  const activityContent = $('activityContent');
  const receiptContent = $('receiptContent');
  const confirmedBadge = $('confirmedBadge');

  const short = (value, start = 5, end = 5) =>
    value.length <= start + end + 3 ? value : `${value.slice(0, start)}…${value.slice(-end)}`;

  function setStatus(message, working = false) {
    statusText.textContent = message;
    statusDot.classList.toggle('pulse', working);
  }

  function setBusy(next) {
    busy = next;
    walletButton.disabled = next;
    sendButton.disabled = next || !account;
    if (next) sendButton.textContent = 'Working…';
    else sendButton.textContent = account ? 'Send & create receipt →' : 'Connect Nightly to send';
  }

  function provider() {
    const nightly = window.nightly?.solana;
    if (!nightly) throw new Error('Nightly Wallet was not detected. Install Nightly and refresh this page.');
    return nightly;
  }

  async function switchToCookieChain() {
    const nightly = provider();
    const genesisHash = await connection.getGenesisHash();
    if (typeof nightly.changeNetwork === 'function') {
      await nightly.changeNetwork({ genesisHash, url: RPC_URL });
    }
    return genesisHash;
  }

  async function refresh() {
    const started = performance.now();
    try {
      const currentSlot = await connection.getSlot('confirmed');
      slotText.textContent = currentSlot.toLocaleString();
      rpcLatency.textContent = `${Math.max(1, Math.round(performance.now() - started))} ms`;

      if (!publicKey) return;
      const [lamports, signatures] = await Promise.all([
        connection.getBalance(publicKey, 'confirmed'),
        connection.getSignaturesForAddress(publicKey, { limit: 8 }, 'confirmed'),
      ]);
      balanceText.textContent = `${(lamports / LAMPORTS_PER_SOL).toFixed(4)} COOK`;
      renderActivity(signatures);
    } catch (error) {
      console.error(error);
      setStatus('RPC refresh failed. Check your network connection and retry.');
    }
  }

  async function connectWallet() {
    setBusy(true);
    clearReceipt();
    try {
      await switchToCookieChain();
      const nightly = provider();
      const connect = nightly.features?.['standard:connect']?.connect;
      if (typeof connect !== 'function') throw new Error('This Nightly build does not expose Wallet Standard connect.');
      const result = await connect();
      const nextAccount = result?.accounts?.[0];
      if (!nextAccount?.address) throw new Error('Nightly did not return a wallet account.');

      account = nextAccount;
      publicKey = new PublicKey(nextAccount.address);
      walletButton.className = 'ghost';
      walletButton.textContent = short(nextAccount.address, 4, 4);
      setStatus('Nightly connected to Cookie Chain.');
      await refresh();
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'Could not connect Nightly.');
    } finally {
      setBusy(false);
    }
  }

  async function disconnectWallet() {
    try {
      const disconnect = window.nightly?.solana?.features?.['standard:disconnect']?.disconnect;
      if (typeof disconnect === 'function') await disconnect();
    } catch (error) {
      console.warn(error);
    }
    account = null;
    publicKey = null;
    walletButton.className = 'primary compact';
    walletButton.textContent = 'Connect Nightly';
    balanceText.textContent = '—';
    activityContent.className = 'activityEmpty';
    activityContent.textContent = 'Connect Nightly to load the wallet’s latest Cookie Chain transactions.';
    clearReceipt();
    setBusy(false);
    setStatus('Wallet disconnected.');
  }

  async function sendCook(event) {
    event.preventDefault();
    if (!account || !publicKey) return setStatus('Connect Nightly first.');

    setBusy(true);
    clearReceipt();
    try {
      await switchToCookieChain();
      const target = new PublicKey(recipientInput.value.trim());
      const cook = Number(amountInput.value);
      if (!Number.isFinite(cook) || cook <= 0) throw new Error('Enter a valid COOK amount greater than zero.');

      const lamports = Math.round(cook * LAMPORTS_PER_SOL);
      if (!Number.isSafeInteger(lamports) || lamports < 1) throw new Error('Amount is too small or too large.');

      setStatus('Preparing Cookie Chain transaction…', true);
      const latest = await connection.getLatestBlockhash('confirmed');
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: latest.blockhash }).add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: target, lamports })
      );

      const nightly = provider();
      const signTransaction = nightly.features?.['standard:signTransaction']?.signTransaction;
      if (typeof signTransaction !== 'function') throw new Error('Nightly signTransaction is unavailable.');

      setStatus('Approve the transaction in Nightly…', true);
      const unsigned = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const signed = await signTransaction({ account, transaction: unsigned });
      const signedBytes = signed?.[0]?.signedTransaction;
      if (!(signedBytes instanceof Uint8Array)) throw new Error('Nightly did not return a signed transaction.');

      setStatus('Broadcasting to Cookie Chain…', true);
      const signature = await connection.sendRawTransaction(signedBytes, { skipPreflight: false, maxRetries: 3 });

      setStatus('Waiting for on-chain confirmation…', true);
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      }, 'confirmed');
      if (confirmation.value.err) throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);

      receipt = {
        signature,
        sender: account.address,
        recipient: target.toBase58(),
        amount: cook.toLocaleString(undefined, { maximumFractionDigits: 9 }),
        timestamp: new Date().toISOString(),
        slot: confirmation.context.slot,
        network: 'Cookie Chain',
        status: 'confirmed',
      };
      renderReceipt();
      setStatus('Confirmed. Your verifiable Cookie Chain receipt is ready.');
      await refresh();
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'Transaction failed.');
    } finally {
      setBusy(false);
    }
  }

  function renderReceipt() {
    if (!receipt) return;
    confirmedBadge.hidden = false;
    receiptContent.className = 'receipt';
    receiptContent.innerHTML = `
      <div class="receiptAmount"><span>PAID</span><strong>${escapeHtml(receipt.amount)} COOK</strong></div>
      <dl>
        <div><dt>From</dt><dd title="${escapeHtml(receipt.sender)}">${escapeHtml(short(receipt.sender, 8, 8))}</dd></div>
        <div><dt>To</dt><dd title="${escapeHtml(receipt.recipient)}">${escapeHtml(short(receipt.recipient, 8, 8))}</dd></div>
        <div><dt>Time</dt><dd>${escapeHtml(new Date(receipt.timestamp).toLocaleString())}</dd></div>
        <div><dt>Slot</dt><dd>${Number(receipt.slot).toLocaleString()}</dd></div>
        <div><dt>Signature</dt><dd title="${escapeHtml(receipt.signature)}">${escapeHtml(short(receipt.signature, 8, 8))}</dd></div>
      </dl>
      <div class="receiptActions">
        <a class="primary compact" href="${EXPLORER_URL}/tx/${encodeURIComponent(receipt.signature)}" target="_blank" rel="noreferrer">Verify ↗</a>
        <button id="copyReceiptButton" class="ghost">Copy receipt</button>
        <button id="downloadReceiptButton" class="ghost">Download JSON</button>
      </div>`;
    $('copyReceiptButton').addEventListener('click', copyReceipt);
    $('downloadReceiptButton').addEventListener('click', downloadReceipt);
  }

  function clearReceipt() {
    receipt = null;
    confirmedBadge.hidden = true;
    receiptContent.className = 'emptyReceipt';
    receiptContent.innerHTML = '<div class="cookieStamp">🍪</div><h3>Your proof appears here</h3><p>After confirmation, CookiePay creates a shareable receipt linked to the transaction on CookieScan.</p>';
  }

  function renderActivity(signatures) {
    if (!signatures.length) {
      activityContent.className = 'activityEmpty';
      activityContent.textContent = 'No recent activity found for this wallet.';
      return;
    }
    activityContent.className = 'activityList';
    activityContent.innerHTML = signatures.map((item) => {
      const time = item.blockTime ? new Date(item.blockTime * 1000).toLocaleString() : `Slot ${item.slot.toLocaleString()}`;
      return `<a href="${EXPLORER_URL}/tx/${encodeURIComponent(item.signature)}" target="_blank" rel="noreferrer" class="activityItem">
        <span class="${item.err ? 'failDot' : 'okDot'}"></span>
        <div><strong>${escapeHtml(short(item.signature, 9, 9))}</strong><small>${escapeHtml(time)}</small></div>
        <span>${item.err ? 'Failed' : 'Confirmed'} ↗</span>
      </a>`;
    }).join('');
  }

  async function copyReceipt() {
    if (!receipt) return;
    const text = [
      'CookiePay Receipt 🍪',
      `Amount: ${receipt.amount} COOK`,
      `From: ${receipt.sender}`,
      `To: ${receipt.recipient}`,
      `Slot: ${receipt.slot}`,
      `Tx: ${receipt.signature}`,
      `${EXPLORER_URL}/tx/${receipt.signature}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setStatus('Receipt copied.');
  }

  function downloadReceipt() {
    if (!receipt) return;
    const payload = {
      app: 'CookiePay Receipts',
      version: 1,
      ...receipt,
      explorerUrl: `${EXPLORER_URL}/tx/${receipt.signature}`,
      rpc: RPC_URL,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cookiepay-${receipt.signature.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Receipt JSON downloaded.');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[char]));
  }

  walletButton.addEventListener('click', () => account ? disconnectWallet() : connectWallet());
  refreshButton.addEventListener('click', refresh);
  paymentForm.addEventListener('submit', sendCook);
  jarButton.addEventListener('click', () => {
    recipientInput.value = COOKIE_JAR;
    amountInput.value = '0.001';
    setStatus('Cookie Jar selected. Review the amount, then approve only if you want to donate.');
  });

  refresh();
})();
