import Image from 'next/image'
import { toast } from 'react-toastify' // Toast notifications
import React, { ReactElement, useEffect, useState } from 'react'
import styles from '@styles/components/Dungeon.module.scss'
import Button from '@components/Button'
import { loot, dungeon } from '@state/index'
import Loading from 'react-loading'
import { BATTLE_PRICE, ESCAPE_PRICE } from '@constants/fees'

export default function Entered({
  tokenId,
}: {
  tokenId: string
}): ReactElement {
  const {
    getEncounteredMonster,
    encounteredMonsters,
    battleMonster,
    escapeFromDungeon,
    hasEnoughLink,
  } = loot.useContainer()
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    getEncounteredMonster(tokenId)
  }, [tokenId])

  const { refreshDungeonState } = dungeon.useContainer()

  const monster = encounteredMonsters[tokenId]

  if (!monster) {
    return <Loading type="spin" />
  }

  return (
    <div className="center">
      <h2>You entered the dungeon</h2>
      <p className={styles.story}>
        You venture into the cave, following the light source. As you go deeper,
        you notice that the corridors start getting wider and wider. You finally
        reach a big chamber with torches hanging on the walls. "This is where
        the light came from", you realize. Suddenly, you see shadows quickly
        approaching from your right. You see a living being.
      </p>
      <Image
        className={styles.monster_img}
        src={`/monsters/${monster.id}.png`}
        alt={`${monster.name} image`}
        width={256}
        height={256}
        layout="fixed"
      />
      <p className={styles.story}>
        You stumble onto a <b>{monster.name}</b>.
      </p>
      <div className="center">
        <Button
          size="big"
          style="primary"
          className={styles.left_button}
          loading={loading['battle']}
          onClick={async () => {
            setLoading({ battle: true })
            const hasEnough = await hasEnoughLink()
            if (!hasEnough) {
              toast.warning(
                'The contract does not possess enough LINK to obtain a random number. Please notify the Loot Dungeon team so that it can be filled back.'
              )
              setLoading({})
              return
            }
            try {
              await battleMonster(tokenId)
              await refreshDungeonState(tokenId)
            } catch (e) {
              console.log(e)
            }
            setLoading({})
          }}
        >
          Fight monster ({BATTLE_PRICE} ETH)
        </Button>
        <Button
          size="big"
          style="secondary"
          loading={loading['flee']}
          onClick={async () => {
            setLoading({ flee: true })
            try {
              await escapeFromDungeon(tokenId)
              await refreshDungeonState(tokenId)
            } catch (e) {
              console.log(e)
            }
            setLoading({})
          }}
        >
          Escape to safety ({ESCAPE_PRICE} ETH)
        </Button>
      </div>
    </div>
  )
}
