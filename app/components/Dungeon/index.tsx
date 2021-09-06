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
import Error from '@components/Error'

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
  const { address } = wallet.useContainer()
  const dungeonContainer = dungeon.useContainer()

  const { dungeonState, refreshDungeonState, ownsLoot } = dungeonContainer

  useEffect(() => {
    refreshDungeonState(tokenId || '')
  }, [address])

  const timer = useRef<NodeJS.Timer | null>(null)

  useEffect(() => {
    // useRef value stored in .current property
    timer.current = setInterval(
      () => (tokenId ? refreshDungeonState(tokenId) : null),
      15000
    )

    // clear on component unmount
    return () => {
      if (timer.current) {
        clearInterval(timer.current)
      }
    }
  }, [])

  if (!address) {
    return <p className="center">Please connect your wallet to continue</p>
  }

  if (!tokenId) {
    return <LoadGame />
  }

  const ComponentToRender = mapping[dungeonState]

  if (ownsLoot[tokenId] === false) {
    return (
      <>
        <Error>
          You don't own Loot #{tokenId}. Are you sure you are connected to the
          correct wallet?
        </Error>
        <Link href="/dungeon">Go back</Link>
      </>
    )
  }

  return (
    <div className={styles.container}>
      <ComponentToRender tokenId={tokenId} />
    </div>
  )
}
