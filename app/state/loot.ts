// Imports
import { ethers } from 'ethers'
import { wallet } from '@state/index' // Eth state container
import { toast } from 'react-toastify' // Toast notifications
import { createContainer } from 'unstated-next' // State management
import { Contract } from '@ethersproject/contracts' // Ethers
import { ERC721, ERC1155_LootDungeon } from '@constants/abi' // ABIs

// Types
import type { BigNumber } from '@ethersproject/bignumber' // BigNumber
import { useState } from 'react'
import { BATTLE_PRICE, ESCAPE_PRICE } from '@constants/fees'
import { MAX_ROUNDS_PER_BATTLE } from '@constants/misc'

export interface BattleRoundResult {
  hasNextRound: boolean
  won: boolean
  playerHp: number
  monsterHp: number
  lastPlayerReceivedDamage: number
  lastMonsterReceivedDamage: number
}

export interface Stats {
  hp: number
  armor: number
  attack: number
  agility: number
  dexterity: number
}

export interface ContractMonster {
  name: string
  id: number
  hp: number
  armor: number
  attack: number
  agility: number
  dexterity: number
  guaranteedDrop: number
  luckyDrop: number
}

// Constants
const LootAddress: string =
  process.env.NEXT_PUBLIC_LOOT_ADDRESS ??
  '0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7'
const DungeonAddress: string =
  process.env.NEXT_PUBLIC_LOOT_DUNGEON_ADDRESS ?? ''

function useLoot() {
  // Collect auth provider and user address
  const { provider, address, setAddress } = wallet.useContainer()
  const [isApproved, setIsApproved] = useState<boolean>(false)
  const [encounteredMonsters, setEncounteredMonsters] = useState<{
    [key: string]: ContractMonster
  }>({})

  function collectContracts(): { loot: Contract; dungeon: Contract } {
    return {
      // ERC721 Loot Contract
      loot: new Contract(LootAddress, ERC721, provider?.getSigner()),
      // ERC1155 + Loot Dungeon logic
      dungeon: new Contract(
        DungeonAddress,
        ERC1155_LootDungeon,
        provider?.getSigner()
      ),
    }
  }

  async function isOwnerOfLoot(tokenId: string): Promise<boolean> {
    const { loot, dungeon } = collectContracts()

    if (!address) return false

    const dungeonLootHolder = await dungeon.getLootOwner(tokenId)
    const hasStakedLoot =
      dungeonLootHolder.toUpperCase() === address.toUpperCase()
    const ogOwner = await loot.ownerOf(tokenId)
    const ownsLoot = ogOwner.toUpperCase() === address.toUpperCase()

    return hasStakedLoot || ownsLoot
  }

  async function refreshIsApproved(): Promise<boolean> {
    const { loot }: { loot: Contract } = collectContracts()

    const isApproved: boolean = await loot.isApprovedForAll(
      address,
      DungeonAddress
    )

    setIsApproved(isApproved)

    return isApproved
  }

  async function hasEnteredTheDungeon(tokenId: string): Promise<boolean> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const hasEntered: boolean = await dungeon.hasEnteredTheDungeon(tokenId)

    return hasEntered
  }

  async function hasStartedBattle(tokenId: string): Promise<boolean> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const hasStartedBattle: boolean = await dungeon.hasStartedBattle(tokenId)

    return hasStartedBattle
  }

  async function hasFinishedBattle(tokenId: string): Promise<boolean> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const hasFinishedBattle: boolean = await dungeon.hasFinishedBattle(tokenId)

    return hasFinishedBattle
  }

  async function getEncounteredMonster(
    tokenId: string
  ): Promise<ContractMonster> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const returnedMonster = await dungeon.getEncounteredMonster(tokenId)

    const monster = {
      ...returnedMonster,
      hp: returnedMonster.hp.toNumber(),
      armor: returnedMonster.armor.toNumber(),
      attack: returnedMonster.attack.toNumber(),
      agility: returnedMonster.agility.toNumber(),
      dexterity: returnedMonster.dexterity.toNumber(),
    }

    setEncounteredMonsters({
      ...encounteredMonsters,
      [tokenId]: monster,
    })

    return monster
  }

  async function getPlayerStats(tokenId: string): Promise<Stats> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const returnedPlayerStats = await dungeon.getStats(tokenId)

    const playerStats = {
      ...returnedPlayerStats,
      hp: returnedPlayerStats.hp.toNumber(),
    }

    return playerStats
  }

  async function getBattleResultsUpUntilRound(
    tokenId: string,
    untilRound: number
  ): Promise<BattleRoundResult> {
    const playerStats = await getPlayerStats(tokenId)
    const monster = await getEncounteredMonster(tokenId)

    let playerHp = playerStats.hp
    let monsterHp = monster.hp
    let round = 0
    let hasNextRound = true
    let won = false
    let lastPlayerReceivedDamage = 0
    let lastMonsterReceivedDamage = 0

    console.log(playerStats, monster, round)

    while (hasNextRound && round <= untilRound) {
      const roundRes = await checkBattleResults(
        tokenId,
        round,
        playerHp,
        monsterHp,
        playerStats
      )
      console.log(`Round ${round}: ${JSON.stringify(roundRes)}`)

      lastPlayerReceivedDamage = playerHp - roundRes.playerHp
      lastMonsterReceivedDamage = monsterHp - roundRes.monsterHp

      playerHp = roundRes.playerHp
      monsterHp = roundRes.monsterHp
      hasNextRound = roundRes.hasNextRound
      won = roundRes.won
      round++
    }

    const result = {
      playerHp,
      monsterHp,
      hasNextRound,
      won,
      lastPlayerReceivedDamage,
      lastMonsterReceivedDamage,
    }

    console.log('round', round, result)

    return result
  }

  async function getFinalBattleResults(
    tokenId: string
  ): Promise<BattleRoundResult> {
    return getBattleResultsUpUntilRound(tokenId, MAX_ROUNDS_PER_BATTLE)
  }

  async function checkBattleResults(
    tokenId: string,
    round: number,
    lastRoundPlayerHp: number,
    lastRoundMonsterHp: number,
    stats: Stats
  ): Promise<BattleRoundResult> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const battleRoundResult = await dungeon.checkBattleResults(
      tokenId,
      round,
      lastRoundPlayerHp,
      lastRoundMonsterHp,
      stats
    )

    const result = {
      hasNextRound: battleRoundResult.hasNextRound,
      won: battleRoundResult.won,
      playerHp: battleRoundResult.playerHp.toNumber(),
      monsterHp: battleRoundResult.monsterHp.toNumber(),
      lastPlayerReceivedDamage:
        lastRoundPlayerHp - battleRoundResult.playerHp.toNumber(),
      lastMonsterReceivedDamage:
        lastRoundMonsterHp - battleRoundResult.monsterHp.toNumber(),
    }

    return result
  }

  async function approveLootTransactions(): Promise<void> {
    const { loot }: { loot: Contract } = collectContracts()

    try {
      if (!address) {
        throw new Error('Need to connect wallet first')
      }

      if (await refreshIsApproved()) {
        toast.success('Approval is not required')
        return
      }

      const tx = await loot['setApprovalForAll(address,bool)'](
        DungeonAddress,
        true
      )
      await tx.wait(1)
      await refreshIsApproved()
      toast.success('Loot Dungeon was approved to manage your Loot')
    } catch (e) {
      console.log(e)
      toast.error('Error when approving Loot Dungeon as a Loot operator')
    }
  }

  async function enterTheDungeon(tokenId: string): Promise<void> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    try {
      const tx = await dungeon['enterTheDungeon(uint256)'](tokenId)
      await tx.wait(1)
      toast.success('You have entered the dungeon')
    } catch (e) {
      console.log(e)
      toast.error('Error when entering the dungeon')
    }
  }

  async function battleMonster(tokenId: string): Promise<void> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    try {
      const tx = await dungeon['battleMonster(uint256)'](tokenId, {
        value: ethers.utils.parseEther(BATTLE_PRICE),
      })
      await tx.wait(1)
      toast.success('Your battle has started')
    } catch (e) {
      console.log(e)
      toast.error('Error when attempting to battle')
    }
  }

  async function escapeFromDungeon(tokenId: string): Promise<void> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    try {
      const tx = await dungeon['escapeFromDungeon(uint256)'](tokenId, {
        value: ethers.utils.parseEther(ESCAPE_PRICE),
      })
      await tx.wait(1)
      toast.success('You escaped from the dungeon successfully')
    } catch (e) {
      console.log(e)
      toast.error('Error when attempting to flee')
    }
  }

  async function hasEnoughLink(): Promise<boolean> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const hasEnough = await dungeon.hasEnoughLink()
    return hasEnough
  }

  return {
    approveLootTransactions,
    refreshIsApproved,
    hasEnteredTheDungeon,
    hasStartedBattle,
    hasFinishedBattle,
    checkBattleResults,
    getEncounteredMonster,
    getPlayerStats,
    getFinalBattleResults,
    isOwnerOfLoot,
    isApproved,
    enterTheDungeon,
    encounteredMonsters,
    battleMonster,
    escapeFromDungeon,
    hasEnoughLink,
    getBattleResultsUpUntilRound,
  }
}

// Create unstated-next container
const loot = createContainer(useLoot)
export default loot
