import wallet from '@state/wallet' // ETH state provider
import loot from '@state/loot' // Loot state provider
import dungeon from '@state/dungeon'

// Types
import type { ReactElement } from 'react'

// Global state provider
export default function GlobalProvider({
  children,
}: {
  children: ReactElement[]
}): ReactElement {
  return (
    <wallet.Provider>
      <loot.Provider>
        <dungeon.Provider>{children}</dungeon.Provider>
      </loot.Provider>
    </wallet.Provider>
  )
}

// Export individual providers
export { wallet, loot, dungeon }
