import LoadGame from '@components/Dungeon/LoadGame'
import dungeon, { DungeonState } from '@state/dungeon'
import wallet from '@state/wallet'
import Link from 'next/link'
import styles from '@styles/components/Dungeon.module.scss'
import { ReactElement, useEffect, useRef } from 'react'
import ReactLoading from 'react-loading'

import NotStarted from './NotStarted'
import Entered from './Entered'
import Battling from './Battling'
import WonBattle from './WonBattle'
import LostBattle from './LostBattle'
import LootSelector from '@components/LootSelector'

const mapping = {
  notConnected: () => <ReactLoading type="spin" color="white" />,
  notStarted: NotStarted,
  entered: Entered,
  battling: Battling,
  wonBattle: WonBattle,
  lostBattle: LostBattle,
}

export default function Dungeon({
  tokenId,
}: {
  tokenId?: string
}): ReactElement {
  const dungeonContainer = dungeon.useContainer()

  const { dungeonState } = dungeonContainer

  return (
    <div className={styles.container}>
      <LootSelector
        tokenId={tokenId}
        render={({ tokenId }: { tokenId: string }) => {
          const SelectedComponent = mapping[dungeonState]
          return <SelectedComponent tokenId={tokenId} />
        }}
      />
    </div>
  )
}
