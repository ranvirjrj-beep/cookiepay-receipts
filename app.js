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
  let toastTimer = null;

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

  function showToast(message, isError = false) {
    let toast = document.getElementById('cookiepayToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cookiepayToast';
      Object.assign(toast.style, {
        position: 'fixed',
        top: '88px',
        right: '24px',
        zIndex: '9999',
        maxWidth: '420px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid #5b4a2d',
        background: '#15120d',
        color: '#f5efe5',
        boxShadow: '0 16px 40px rgba(0,0,0,.35)',
        font: '600 14px/1.45 Inter, system-ui, sans-serif',
      });
      document.body.appendChild(toast);
    }
    toast.style.borderColor = isError ? '#8a3d32' : '#5b4a2d';
    toast.textContent = message;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
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
    if (!nightly) throw new Error('Nightly Wallet was not detected in this browser. Make sure the Nightly extension is installed, enabled for this site, and unlocked, then refresh.');
    return nightly;
  }

  async function validateCookieChainNetwork() {
    const nightly = provider();
    const targetGenesisHash = await connection.getGenesisHash();
    const activeGenesisHash = nightly.genesisHash;

    // Nightly exposes the currently selected SVM genesis hash. We validate it
    // instead of forcing changeNetwork(), because custom SVMs may be displayed
    // as "Unknown" by the approval UI even when the user already selected them.
    if (activeGenesisHash && activeGenesisHash !== targetGenesisHash) {
      throw new Error('Nightly is connected, but Cookie Chain is not the active SVM. Open Nightly → Change network → Cookie, then try again.');
    }

    return targetGenesisHash;
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
    if (busy) return;
    setBusy(true);
    clearReceipt();
    try {
      const nightly = provider();
      const connectFeature = nightly.features?.['standard:connect'];
      if (typeof connectFeature?.connect !== 'function') {
        throw new Error('This Nightly build does not expose Wallet Standard connect. Please update Nightly and refresh.');
      }

      setStatus('Approve the connection in Nightly…', true);
      showToast('Nightly detected. Approve the wallet connection in the extension popup.');

      const result = await connectFeature.connect(false);
      const nextAccount = result?.accounts?.[0];
      if (!nextAccount?.address) throw new Error('Nightly connected but did not return a wallet account.');

      account = nextAccount;
      publicKey = new PublicKey(nextAccount.address);

      setStatus('Wallet connected. Verifying Cookie Chain…', true);
      await validateCookieChainNetwork();

      walletButton.className = 'ghost';
      walletButton.textContent = short(nextAccount.address, 4, 4);
      walletButton.title = nextAccount.address;
      setStatus('Nightly connected to Cookie Chain.');
      showToast('Connected to Cookie Chain successfully.');
      await refresh();
    } catch (error) {
      console.error(error);
      account = null;
      publicKey = null;
      const message = error instanceof Error ? error.message : 'Could not connect Nightly.';
      walletButton.className = 'primary compact';
      walletButton.textContent = 'Connect Nightly';
      setStatus(message);
      showToast(message, true);
    } finally {
      setBusy(false);
    }
  }

  async function disconnectWallet() {
    try {
      const disconnectFeature = window.nightly?.solana?.features?.['standard:disconnect'];
      if (typeof disconnectFeature?.disconnect === 'function') await disconnectFeature.disconnect();
    } catch (error) {
      console.warn(error);
    }
    account = null;
    publicKey = null;
    walletButton.className = 'primary compact';
    walletButton.textContent = 'Connect Nightly';
    walletButton.title = '';
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
      await validateCookieChainNetwork();
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
      const signFeature = nightly.features?.['standard:signTransaction'];
      if (typeof signFeature?.signTransaction !== 'function') throw new Error('Nightly signTransaction is unavailable.');

      setStatus('Approve the transaction in Nightly…', true);
      showToast('Review the recipient and amount in Nightly before approving.');
      const unsigned = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const signed = await signFeature.signTransaction({ account, transaction: unsigned });
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
      showToast('Transaction confirmed — receipt created.');
      await refresh();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Transaction failed.';
      setStatus(message);
      showToast(message, true);
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
    return String(value).replace(/[&<>'\"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '\"': '&quot;'
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

  setTimeout(() => {
    if (!window.nightly?.solana) {
      setStatus('Nightly extension not detected yet. Install/enable Nightly for this site, unlock it, then refresh.');
    }
  }, 900);

  refresh();
})();
