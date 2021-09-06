import LoadGame from '@components/Dungeon/LoadGame'
import dungeon from '@state/dungeon'
import wallet from '@state/wallet'
import Link from 'next/link'
import styles from '@styles/components/Dungeon.module.scss'
import { ReactElement, useEffect, useRef } from 'react'
import Error from './Error'

export default function LootSelector({
  tokenId,
  render,
  title,
  path,
}: {
  title?: string
  tokenId?: string
  path?: string
  render: ({ tokenId }: { tokenId: string }) => ReactElement
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

  if (!tokenId || parseInt(tokenId, 10) > 8000) {
    return <LoadGame title={title} path={path} />
  }

  if (ownsLoot[tokenId] === false) {
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
