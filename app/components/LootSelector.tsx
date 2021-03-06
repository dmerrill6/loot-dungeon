import LoadGame from '@components/Dungeon/LoadGame'
import dungeon from '@state/dungeon'
import wallet from '@state/wallet'
import Link from 'next/link'
import styles from '@styles/components/Dungeon.module.scss'
import { ReactElement, useEffect, useRef } from 'react'
import Error from './Error'
import loot from '@state/loot'

export default function LootSelector({
  tokenId,
  render,
  title,
  path = 'dungeon',
  forceOwner = true,
}: {
  title?: string
  tokenId?: string
  path?: string
  render: ({ tokenId }: { tokenId: string }) => ReactElement
  forceOwner?: boolean
}): ReactElement {
  const { address } = wallet.useContainer()
  const { mLootEnabled } = loot.useContainer()
  const dungeonContainer = dungeon.useContainer()

  const { dungeonState, refreshDungeonState, ownsLoot } = dungeonContainer

  useEffect(() => {
    refreshDungeonState(tokenId || '')
  }, [address])

  const timer = useRef<NodeJS.Timer | null>(null)

  useEffect(() => {
    // useRef value stored in .current property
    timer.current = setInterval(
      () =>
        tokenId && ownsLoot[tokenId] ? refreshDungeonState(tokenId) : null,
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

  if (!tokenId || (parseInt(tokenId, 10) > 8000 && !mLootEnabled())) {
    return <LoadGame title={title} path={path} />
  }

  if (ownsLoot[tokenId] === false && forceOwner) {
    return (
      <>
        <Error>
          You don't own Loot #{tokenId}. Are you sure you are connected to the
          correct wallet?
        </Error>
        <Link href={`/${path}`}>Go back</Link>
      </>
    )
  }

  return <div className={styles.container}>{render({ tokenId })}</div>
}
