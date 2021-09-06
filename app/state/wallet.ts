import { ethers } from 'ethers'
import Onboard from 'bnc-onboard'
import { toast } from 'react-toastify'
import { createContainer } from 'unstated-next'
import { useState, useMemo, useCallback } from 'react'
import { Web3Provider } from '@ethersproject/providers'

export const WALLET_STORAGE_KEY = 'selectedWallet'

// Types
import type {
  WalletInitOptions,
  WalletModule,
} from 'bnc-onboard/dist/src/interfaces'

// Onboarding wallet providers
const wallets: (WalletModule | WalletInitOptions)[] = [
  { walletName: 'metamask' },
  {
    walletName: 'walletConnect',
    infuraKey: process.env.NEXT_PUBLIC_INFURA_KEY || '',
  },
]

function useWallet() {
  const [address, setAddress] = useState<string | null>(null) // User address
  const [provider, setProvider] = useState<Web3Provider | null>(null) // Ethers provider

  /**
   * Returns memoized onboard.js provider
   */
  const onboard = useMemo(() => {
    // Onboard provider
    return Onboard({
      // Ethereum network
      networkId: 1,
      // Hide Blocknative branding
      hideBranding: true,
      // Dark mode
      darkMode: true,
      // Setup custom wallets for selection
      walletSelect: {
        heading: 'Connect to Loot Dungeon',
        description: 'Select a wallet to connect.',
        wallets: wallets,
      },
      // Track subscriptions
      subscriptions: {
        // On address update
        address: async (account: string) => {
          if (account === undefined) {
            setProvider(null)
            setAddress(null)
          } else {
            setAddress(account)
          }
        },
        // On wallet update
        wallet: async (wallet) => {
          // If wallet provider exists
          if (wallet.provider) {
            // Collect ethers provider
            const provider = new ethers.providers.Web3Provider(wallet.provider)

            // Update provider, address, and raw address
            setProvider(provider)
            process.browser
              ? localStorage.setItem(WALLET_STORAGE_KEY, wallet.name || '')
              : null
          } else {
            // Nullify data
            setProvider(null)
            process.browser ? localStorage.removeItem(WALLET_STORAGE_KEY) : null
          }
        },
      },
      // Force wallet checks
      walletCheck: [{ checkName: 'connect' }, { checkName: 'accounts' }],
    })
  }, [])

  /**
   * Unlock wallet, store ethers provider and address
   */
  const unlock = useCallback(async () => {
    // Select wallet
    await onboard.walletSelect()

    let checkPassed: boolean = false

    try {
      // Run checks
      checkPassed = await onboard.walletCheck()
    } catch (error) {
      // If checks fail, throw error
      console.error(error)
    }

    if (checkPassed) {
      // If checks pass, show success authentication
      toast.success('Connected to wallet.')
    } else {
      // Else, show failure
      toast.error('Error when connecting wallet.')
    }
  }, [onboard])

  const loadStoredWallet = useCallback(async () => {
    const previouslySelectedWallet = process.browser
      ? localStorage.getItem(WALLET_STORAGE_KEY)
      : null

    if (previouslySelectedWallet && onboard) {
      onboard.walletSelect(previouslySelectedWallet)
    }
  }, [onboard])

  return {
    provider,
    address,
    setAddress,
    unlock,
    loadStoredWallet,
  }
}

// Create unstated-next container
const wallet = createContainer(useWallet)
export default wallet
