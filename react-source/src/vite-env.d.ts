/// <reference types="vite/client" />

declare global {
  type NightlyAccount = {
    address: string
    publicKey?: Uint8Array
    chains?: readonly string[]
    features?: readonly string[]
  }

  type NightlySolanaProvider = {
    genesisHash?: string
    changeNetwork?: (network: { genesisHash: string; url?: string }) => Promise<unknown>
    features: Record<string, any>
  }

  interface Window {
    nightly?: {
      solana?: NightlySolanaProvider
    }
  }
}

export {}
