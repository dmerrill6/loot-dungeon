import LoadGame from '@components/Dungeon/LoadGame'
import { loot } from '@state/index'
import wallet from '@state/wallet'
import Link from 'next/link'
import styles from '@styles/components/Dungeon.module.scss'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import ReactLoading from 'react-loading'
import LootSelector from '@components/LootSelector'
import { Stats } from '@state/loot'
import Loading from 'react-loading'

export default function Dungeon({
  tokenId,
}: {
  tokenId?: string
}): ReactElement {
  const { getPlayerStats } = loot.useContainer()
  const [stats, setStats] = useState<Stats | undefined>()

  useEffect(() => {
    if (tokenId) {
      getPlayerStats(tokenId)
        .then((stats) => {
          console.log('got stats', stats)
          setStats(stats)
        })
        .catch((error) => console.log(error))
    }
  }, [tokenId])

  return (
    <div className={styles.container}>
      <LootSelector
        title="Loot Stats"
        path="stats"
        tokenId={tokenId}
        render={({ tokenId }: { tokenId: string }) => {
          if (!stats) {
            return <Loading type="spin" />
          }
          return (
            <div className="center">
              <h1>Loot #{tokenId} stats</h1>
              <p>HP: {stats?.hp}</p>
              <p>ARM: {stats?.armor}</p>
              <p>ATK: {stats?.attack}</p>
              <p>AGI: {stats?.agility}</p>
              <p>DEX: {stats?.dexterity}</p>
            </div>
          )
        }}
      />
    </div>
  )
}
