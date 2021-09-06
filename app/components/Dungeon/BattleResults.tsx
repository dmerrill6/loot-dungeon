import { BattleRoundResult } from '@state/loot'
import Image from 'next/image'
import { loot, dungeon } from '@state/index'
import React, { ReactElement, useEffect, useState } from 'react'
import Loading from 'react-loading'
import Button from '@components/Button'
import { toast } from 'react-toastify'
import styles from '@styles/components/Dungeon.module.scss'
import { FERRYMAN_PRICE } from '@constants/fees'
import { useRouter } from 'next/router'

const battleTimeout = (battleResults: BattleRoundResult) =>
  battleResults.won && battleResults.monsterHp > 0 && battleResults.playerHp > 0

export default function BattleResults({
  tokenId,
}: {
  tokenId: string
}): ReactElement {
  const {
    getEncounteredMonster,
    encounteredMonsters,
    claimDrops,
    getBattleResultsUpUntilRound,
    bribeFerryman,
  } = loot.useContainer()
  const router = useRouter()

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

  const currRoundResults: BattleRoundResult = roundResults[round - 1]

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
          {battleTimeout(roundResults[resultKey]) ? (
            `The battle has dragged for too long and the ${monster.name} faints in fatigue.`
          ) : (
            <>
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
            </>
          )}
        </div>
      ))}
      {!currRoundResults || currRoundResults.hasNextRound ? (
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
      ) : currRoundResults?.won === true ? (
        <div>
          <h4>Congratulations! You defeated the {monster.name}!</h4>
          <Button
            size="big"
            style="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                await claimDrops(tokenId)
                await refreshDungeonState(tokenId)
                router.push('/')
              } catch (error) {}
              setLoading(false)
            }}
          >
            Claim rewards
          </Button>
        </div>
      ) : currRoundResults?.won === false ? (
        <div>
          <h4>Oh no! You died in battle.</h4>
          <p className={styles.story}>
            Feeling extreme pain, you start to feel surrounded in darkness.
            Drowning in the darkest shade of black, you suddenly awaken, soaring
            from the sea. A ferryman is waiting for you. You climb onto his
            boat.
          </p>
          <Image
            src={`/ferryman.png`}
            alt={'Ferryman'}
            width={256}
            height={256}
            layout="fixed"
          />
          <p className={styles.story}>
            The ferryman, not saying a word, starts rowing into an endless
            ocean. "Am I dead?" you ask. The ferryman does not answer, and keeps
            rowing. "Please, take me back to the shore, I have many things to do
            before I'm gone!", you start begging. Still no answer. "I can do
            anything for you! I can pay the price. Whatever it is!". For the
            first time, the ferryman turns his head and looks at you, still not
            saying a word.
          </p>
          <Button
            size="big"
            style="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                await bribeFerryman(tokenId)
                await refreshDungeonState(tokenId)
                router.push('/')
              } catch (error) {}
              setLoading(false)
            }}
          >
            Bribe the ferryman ({FERRYMAN_PRICE} ETH)
          </Button>
        </div>
      ) : null}
    </div>
  )
}
