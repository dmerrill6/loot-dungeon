import { loot as lootHook, wallet } from '@state/index'
import { useState } from 'react'
import { toast } from 'react-toastify' // Toast notifications
import { createContainer } from 'unstated-next'

export enum DungeonState {
  notConnected = 'notConnected',
  notStarted = 'notStarted',
  entered = 'entered',
  battling = 'battling',
  wonBattle = 'wonBattle',
  lostBattle = 'lostBattle',
}

function useDungeon() {
  const loot = lootHook.useContainer()
  const { address } = wallet.useContainer()

  const [dungeonState, setDungeonState] = useState<DungeonState>(
    DungeonState.notConnected
  )

  const [ownsLoot, setOwnsLoot] = useState<{ [key: string]: boolean }>({})

  async function refreshDungeonState(tokenId?: string): Promise<DungeonState> {
    if (!address) return DungeonState.notConnected
    if (!tokenId) return DungeonState.notConnected

    try {
      const isOwnerOfLoot = await loot.isOwnerOfLoot(tokenId)
      setOwnsLoot({
        ...ownsLoot,
        [tokenId]: isOwnerOfLoot,
      })

      const hasEntered = await loot.hasEnteredTheDungeon(tokenId)

      if (!hasEntered) {
        const newState = DungeonState.notStarted
        setDungeonState(newState)
        return newState
      }

      const startedBattle = await loot.hasStartedBattle(tokenId)
      if (!startedBattle) {
        const newState = DungeonState.entered
        setDungeonState(newState)
        return newState
      }

      const finishedBattle = await loot.hasFinishedBattle(tokenId)
      if (!finishedBattle) {
        const newState = DungeonState.battling
        setDungeonState(newState)
        return newState
      }

      const battleResults = await loot.getFinalBattleResults(tokenId)
      if (battleResults.won) {
        const newState = DungeonState.wonBattle
        setDungeonState(newState)
        return newState
      } else {
        const newState = DungeonState.lostBattle
        setDungeonState(newState)
        return newState
      }
    } catch (err: any) {
      toast.error(`Could not refresh state`)
      console.log(err)
    }

    return DungeonState.notConnected
  }

  return {
    dungeonState,
    refreshDungeonState,
    ownsLoot,
  }
}

const dungeon = createContainer(useDungeon)
export default dungeon
