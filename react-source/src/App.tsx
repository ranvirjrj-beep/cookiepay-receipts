import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'

const RPC_URL = 'https://rpc.cookiescan.io'
const EXPLORER_URL = 'https://cookiescan.io'
const BRIDGE_URL = 'https://hyperlane.cookiescan.io'
const COOKIE_JAR = '568tU9FMksJDxjkLBjWisSA4J4C5uPH87NCCkyREwrxe'
const connection = new Connection(RPC_URL, 'confirmed')

type Activity = {
  signature: string
  slot: number
  blockTime: number | null | undefined
  err: unknown
}

type Receipt = {
  signature: string
  sender: string
  recipient: string
  amount: string
  timestamp: string
}

const short = (value: string, start = 5, end = 5) =>
  value.length <= start + end + 3 ? value : `${value.slice(0, start)}…${value.slice(-end)}`

function App() {
  const [account, setAccount] = useState<NightlyAccount | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [slot, setSlot] = useState<number | null>(null)
  const [rpcLatency, setRpcLatency] = useState<number | null>(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('0.001')
  const [activity, setActivity] = useState<Activity[]>([])
  const [status, setStatus] = useState('Connect Nightly to begin.')
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const publicKey = useMemo(() => {
    if (!account) return null
    try {
      return new PublicKey(account.address)
    } catch {
      return null
    }
  }, [account])

  const refresh = useCallback(async () => {
    const started = performance.now()
    try {
      const currentSlot = await connection.getSlot('confirmed')
      setSlot(currentSlot)
      setRpcLatency(Math.max(1, Math.round(performance.now() - started)))

      if (publicKey) {
        const [lamports, signatures] = await Promise.all([
          connection.getBalance(publicKey, 'confirmed'),
          connection.getSignaturesForAddress(publicKey, { limit: 8 }, 'confirmed'),
        ])
        setBalance(lamports / LAMPORTS_PER_SOL)
        setActivity(signatures)
      }
    } catch (error) {
      console.error(error)
      setStatus('RPC refresh failed. Check your network connection and retry.')
    }
  }, [publicKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  const switchToCookieChain = async () => {
    const provider = window.nightly?.solana
    if (!provider) throw new Error('Nightly Wallet was not detected. Install Nightly and refresh this page.')

    const genesisHash = await connection.getGenesisHash()
    if (provider.changeNetwork) {
      await provider.changeNetwork({ genesisHash, url: RPC_URL })
    }
  }

  const connectWallet = async () => {
    setBusy(true)
    setReceipt(null)
    try {
      await switchToCookieChain()
      const provider = window.nightly?.solana
      const connect = provider?.features?.['standard:connect']?.connect
      if (!connect) throw new Error('This Nightly build does not expose the Wallet Standard connect feature.')
      const result = await connect()
      const nextAccount = result?.accounts?.[0] as NightlyAccount | undefined
      if (!nextAccount?.address) throw new Error('Nightly did not return a wallet account.')
      setAccount(nextAccount)
      setStatus('Nightly connected to Cookie Chain.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not connect Nightly.')
    } finally {
      setBusy(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      const disconnect = window.nightly?.solana?.features?.['standard:disconnect']?.disconnect
      if (disconnect) await disconnect()
    } catch (error) {
      console.warn(error)
    }
    setAccount(null)
    setBalance(null)
    setActivity([])
    setReceipt(null)
    setStatus('Wallet disconnected.')
  }

  const sendCook = async (event: FormEvent) => {
    event.preventDefault()
    if (!account || !publicKey) {
      setStatus('Connect Nightly first.')
      return
    }

    setBusy(true)
    setReceipt(null)
    try {
      await switchToCookieChain()
      const target = new PublicKey(recipient.trim())
      const cook = Number(amount)
      if (!Number.isFinite(cook) || cook <= 0) throw new Error('Enter a valid COOK amount greater than zero.')

      const lamports = Math.round(cook * LAMPORTS_PER_SOL)
      if (!Number.isSafeInteger(lamports) || lamports < 1) throw new Error('Amount is too small or too large.')

      setStatus('Preparing Cookie Chain transaction…')
      const latest = await connection.getLatestBlockhash('confirmed')
      const tx = new Transaction({
        feePayer: publicKey,
        recentBlockhash: latest.blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: target,
          lamports,
        }),
      )

      const provider = window.nightly?.solana
      const signTransaction = provider?.features?.['standard:signTransaction']?.signTransaction
      if (!signTransaction) throw new Error('Nightly signTransaction is unavailable.')

      setStatus('Approve the transaction in Nightly…')
      const unsigned = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
      const signed = await signTransaction({ account, transaction: unsigned })
      const signedBytes = signed?.[0]?.signedTransaction as Uint8Array | undefined
      if (!signedBytes) throw new Error('Nightly did not return a signed transaction.')

      setStatus('Broadcasting to Cookie Chain…')
      const signature = await connection.sendRawTransaction(signedBytes, {
        skipPreflight: false,
        maxRetries: 3,
      })

      setStatus('Waiting for on-chain confirmation…')
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        'confirmed',
      )
      if (confirmation.value.err) throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)

      const nextReceipt: Receipt = {
        signature,
        sender: account.address,
        recipient: target.toBase58(),
        amount: cook.toLocaleString(undefined, { maximumFractionDigits: 9 }),
        timestamp: new Date().toISOString(),
      }
      setReceipt(nextReceipt)
      setStatus('Confirmed. Your verifiable Cookie Chain receipt is ready.')
      await refresh()
    } catch (error) {
      console.error(error)
      setStatus(error instanceof Error ? error.message : 'Transaction failed.')
    } finally {
      setBusy(false)
    }
  }

  const donateToJar = () => {
    setRecipient(COOKIE_JAR)
    setAmount('0.001')
    setStatus('Cookie Jar selected. Review the amount, then approve only if you want to donate.')
  }

  const copyReceipt = async () => {
    if (!receipt) return
    const text = [
      'CookiePay Receipt 🍪',
      `Amount: ${receipt.amount} COOK`,
      `From: ${receipt.sender}`,
      `To: ${receipt.recipient}`,
      `Tx: ${receipt.signature}`,
      `${EXPLORER_URL}/tx/${receipt.signature}`,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    setStatus('Receipt copied.')
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CookiePay home">
          <span className="brandMark">🍪</span>
          <span>CookiePay</span>
          <small>Receipts</small>
        </a>
        <div className="headerActions">
          <span className="networkPill"><i /> Cookie Chain</span>
          {account ? (
            <button className="ghost" onClick={disconnectWallet}>{short(account.address, 4, 4)}</button>
          ) : (
            <button className="primary compact" onClick={connectWallet} disabled={busy}>Connect Nightly</button>
          )}
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <div className="eyebrow">ON-CHAIN PAYMENTS · HUMAN-READABLE PROOF</div>
          <h1>Send COOK.<br /><span>Keep the receipt.</span></h1>
          <p>CookiePay turns a Cookie Chain transfer into a clean, verifiable payment receipt — with live confirmation and wallet activity in one place.</p>
          <div className="heroLinks">
            <a href={BRIDGE_URL} target="_blank" rel="noreferrer">Get COOK ↗</a>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer">Open CookieScan ↗</a>
          </div>
        </div>
        <div className="networkCard">
          <div className="networkCardTitle">NETWORK PULSE</div>
          <div className="metric"><span>RPC</span><strong>{rpcLatency ? `${rpcLatency} ms` : '—'}</strong></div>
          <div className="metric"><span>Current slot</span><strong>{slot?.toLocaleString() ?? '—'}</strong></div>
          <div className="metric"><span>Wallet balance</span><strong>{balance === null ? '—' : `${balance.toFixed(4)} COOK`}</strong></div>
          <button className="textButton" onClick={refresh}>Refresh network ↻</button>
        </div>
      </section>

      <section className="workspace">
        <article className="panel payPanel">
          <div className="panelHeading">
            <div>
              <span className="step">01</span>
              <h2>Create payment</h2>
            </div>
            <span className="tiny">Fees paid in COOK</span>
          </div>

          <form onSubmit={sendCook}>
            <label>
              Recipient
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Cookie Chain wallet address"
                spellCheck={false}
                required
              />
            </label>
            <div className="amountRow">
              <label>
                Amount
                <div className="amountInput"><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required /><span>COOK</span></div>
              </label>
              <button className="jarButton" type="button" onClick={donateToJar}>🍪 Cookie Jar<br /><small>public-goods vault</small></button>
            </div>
            <button className="primary send" type="submit" disabled={busy || !account}>
              {busy ? 'Working…' : account ? 'Send & create receipt →' : 'Connect Nightly to send'}
            </button>
          </form>

          <div className="statusBox" aria-live="polite"><span className={busy ? 'pulse' : ''}>●</span>{status}</div>
        </article>

        <article className="panel receiptPanel">
          <div className="panelHeading">
            <div>
              <span className="step">02</span>
              <h2>Verifiable receipt</h2>
            </div>
            {receipt && <span className="confirmed">CONFIRMED</span>}
          </div>

          {receipt ? (
            <div className="receipt">
              <div className="receiptAmount"><span>PAID</span><strong>{receipt.amount} COOK</strong></div>
              <dl>
                <div><dt>From</dt><dd title={receipt.sender}>{short(receipt.sender, 8, 8)}</dd></div>
                <div><dt>To</dt><dd title={receipt.recipient}>{short(receipt.recipient, 8, 8)}</dd></div>
                <div><dt>Time</dt><dd>{new Date(receipt.timestamp).toLocaleString()}</dd></div>
                <div><dt>Signature</dt><dd title={receipt.signature}>{short(receipt.signature, 8, 8)}</dd></div>
              </dl>
              <div className="receiptActions">
                <a className="primary compact" href={`${EXPLORER_URL}/tx/${receipt.signature}`} target="_blank" rel="noreferrer">Verify ↗</a>
                <button className="ghost" onClick={copyReceipt}>Copy receipt</button>
              </div>
            </div>
          ) : (
            <div className="emptyReceipt">
              <div className="cookieStamp">🍪</div>
              <h3>Your proof appears here</h3>
              <p>After confirmation, CookiePay creates a shareable receipt linked to the transaction on CookieScan.</p>
            </div>
          )}
        </article>
      </section>

      <section className="panel activityPanel">
        <div className="panelHeading">
          <div>
            <span className="step">03</span>
            <h2>Recent wallet activity</h2>
          </div>
          <span className="tiny">Live from Cookie Chain RPC</span>
        </div>
        {!account ? (
          <div className="activityEmpty">Connect Nightly to load the wallet’s latest Cookie Chain transactions.</div>
        ) : activity.length === 0 ? (
          <div className="activityEmpty">No recent activity found for this wallet.</div>
        ) : (
          <div className="activityList">
            {activity.map((item) => (
              <a key={item.signature} href={`${EXPLORER_URL}/tx/${item.signature}`} target="_blank" rel="noreferrer" className="activityItem">
                <span className={item.err ? 'failDot' : 'okDot'} />
                <div><strong>{short(item.signature, 9, 9)}</strong><small>{item.blockTime ? new Date(item.blockTime * 1000).toLocaleString() : `Slot ${item.slot.toLocaleString()}`}</small></div>
                <span>{item.err ? 'Failed' : 'Confirmed'} ↗</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <footer>
        <span>Built for Cookie Chain · SVM-native · Nightly supported</span>
        <span>CookiePay never sees or stores private keys.</span>
      </footer>
    </main>
  )
}

export default App
