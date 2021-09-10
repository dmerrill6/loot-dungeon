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
import getNetworkIdFromSubdomain from '@utils/getNetworkFromSubdomain'
import getSubdomain from '@utils/getSubdomain'
import networkIdToName from '@utils/networkIdToName'

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
  const [networkId, setNetworkId] = useState<number | null>(null) // Ethers provider
  const [wrongNetwork, setWrongNetwork] = useState<boolean>(false) // Wrong network
  const subdomainNetworkId = useMemo(
    () => getNetworkIdFromSubdomain(getSubdomain()),
    []
  )
  /**
   * Returns memoized onboard.js provider
   */
  const onboard = useMemo(() => {
    // Onboard provider
    return Onboard({
      // Ethereum network
      networkId: subdomainNetworkId,
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
            setNetworkId(null)
            setWrongNetwork(false)
          } else {
            setAddress(account)
          }
        },
        network: async (networkId: number) => {
          if (networkId !== subdomainNetworkId) {
            setWrongNetwork(true)
          } else {
            setWrongNetwork(false)
          }
        },
        // On wallet update
        wallet: async (wallet) => {
          // If wallet provider exists
          if (wallet.provider) {
            // Collect ethers provider
            const provider = new ethers.providers.Web3Provider(wallet.provider)

            // Update provider, address, and raw address
            setWrongNetwork(false)
            setProvider(provider)

            process.browser
              ? localStorage.setItem(WALLET_STORAGE_KEY, wallet.name || '')
              : null

            const currNetwork = await (await provider.getNetwork()).chainId
            setNetworkId(currNetwork)
            const currSubdomainNetwork = getNetworkIdFromSubdomain(
              getSubdomain()
            )

            if (networkIdToName(currNetwork) !== currSubdomainNetwork) {
              setWrongNetwork(true)
            }
          } else {
            // Nullify data
            setWrongNetwork(false)
            setProvider(null)
            setNetworkId(null)
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
      toast.error('Error while connecting wallet.')
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
    networkId,
    address,
    setAddress,
    unlock,
    loadStoredWallet,
    wrongNetwork,
  }
}

// Create unstated-next container
const wallet = createContainer(useWallet)
export default wallet
