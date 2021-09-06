import { BattleRoundResult } from '@state/loot'
import Image from 'next/image'
import { loot, dungeon } from '@state/index'
import React, { ReactElement, useEffect, useState } from 'react'
import Loading from 'react-loading'
import Button from '@components/Button'
import { toast } from 'react-toastify'
import styles from '@styles/components/Dungeon.module.scss'

export default function BattleResults({
  tokenId,
}: {
  tokenId: string
}): ReactElement {
  const {
    getEncounteredMonster,
    encounteredMonsters,
    escapeFromDungeon,
    getBattleResultsUpUntilRound,
  } = loot.useContainer()

  useEffect(() => {
    getEncounteredMonster(tokenId)
  }, [tokenId])

  const { refreshDungeonState } = dungeon.useContainer()

  const monster = encounteredMonsters[tokenId]
  const [round, setRound] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [roundResults, setRoundResults] = useState<{
    [key: string]: BattleRoundResult
  }>({})

  if (!monster) return <Loading type="spin" />

  return (
    <div className="center">
      <h2>The battle started!</h2>
      <Image
        src={`/monsters/${monster.id}.png`}
        alt={`${monster.name} image`}
        width={256}
        height={256}
        layout="fixed"
      />
      <p className={styles.story}>
        You and your enemy strike each other. You pray to the goddess of luck to
        succeed in battle.
      </p>
      {Object.keys(roundResults).map((resultKey: string) => (
        <div key={resultKey} className={styles.section}>
          <h4>Round {parseInt(resultKey, 10) + 1}:</h4>
          <p>
            The {monster.name} attacks
            {roundResults[resultKey].lastPlayerReceivedDamage === 0
              ? ' but misses!'
              : `. You lose ${roundResults[resultKey].lastPlayerReceivedDamage} HP.`}
          </p>
          <p>
            You attack
            {roundResults[resultKey].lastMonsterReceivedDamage === 0
              ? ' but miss!'
              : `. The ${monster.name} loses ${roundResults[resultKey].lastMonsterReceivedDamage} HP.`}
          </p>
          <h5>Remaining HP</h5>
          <p>
            <b>You</b>: {roundResults[resultKey].playerHp} HP
          </p>
          <p>
            <b>{monster.name}</b>: {roundResults[resultKey].monsterHp} HP
          </p>
          {roundResults[resultKey].won &&
          roundResults[resultKey].monsterHp > 0 &&
          roundResults[resultKey].playerHp > 0
            ? `The battle has dragged for too long and the ${monster.name} faints in fatigue.`
            : ''}
        </div>
      ))}
      <Button
        size="big"
        style="secondary"
        loading={loading}
        onClick={async () => {
          setLoading(true)
          try {
            const results = await getBattleResultsUpUntilRound(tokenId, round)
            setRoundResults({
              ...roundResults,
              [round]: results,
            })
            setRound(round + 1)
          } catch (e) {
            toast.error('There was an error loading round results.')
            console.log(e)
          }
          setLoading(false)
        }}
      >
        View Round {round + 1}
      </Button>
    </div>
  )
}
