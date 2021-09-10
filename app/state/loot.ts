// Imports
import { ethers } from 'ethers'
import { wallet } from '@state/index' // Eth state container
import { toast } from 'react-toastify' // Toast notifications
import { createContainer } from 'unstated-next' // State management
import { Contract } from '@ethersproject/contracts' // Ethers
import { ERC721, ERC1155_LootDungeon } from '@constants/abi' // ABIs

// Types
import type { BigNumber, BigNumberish } from '@ethersproject/bignumber' // BigNumber
import { useState } from 'react'
import { getBattlePriceInEther, getEscapePriceInEther } from '@constants/fees'
import { MAX_ROUNDS_PER_BATTLE } from '@constants/misc'
import { NetworkId } from '@utils/networkIdToName'

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

const MLootAddress: string = process.env.NEXT_PUBLIC_MLOOT_ADDRESS ?? ''

const DungeonAddress: string =
  process.env.NEXT_PUBLIC_LOOT_DUNGEON_ADDRESS ?? ''

function useLoot() {
  // Collect auth provider and user address
  const { provider, address, setAddress, networkId } = wallet.useContainer()
  const [ferrymanCurrentPrice, setFerrymanCurrentPrice] = useState<
    string | null
  >(null)
  const [encounteredMonsters, setEncounteredMonsters] = useState<{
    [key: string]: ContractMonster
  }>({})

  function collectContracts(): {
    loot: Contract
    mLoot: Contract
    dungeon: Contract
  } {
    return {
      // ERC721 Loot Contract
      loot: new Contract(LootAddress, ERC721, provider?.getSigner()),
      // ERC721 mLoot contract
      mLoot: new Contract(MLootAddress, ERC721, provider?.getSigner()),
      // ERC1155 + Loot Dungeon logic
      dungeon: new Contract(
        DungeonAddress,
        ERC1155_LootDungeon,
        provider?.getSigner()
      ),
    }
  }

  function getLootContract(tokenId: string): Contract {
    const { loot, mLoot } = collectContracts()

    const parsed = parseInt(tokenId, 10)
    const isMLoot = parsed > 8000
    const contract = isMLoot ? mLoot : loot

    return contract
  }

  async function isOwnerOfLoot(tokenId: string): Promise<boolean> {
    const { dungeon } = collectContracts()
    const loot = getLootContract(tokenId)

    if (!address) return false

    const dungeonLootHolder = await dungeon.getLootOwner(tokenId)
    const hasStakedLoot =
      dungeonLootHolder.toUpperCase() === address.toUpperCase()
    const ogOwner = await loot.ownerOf(tokenId)
    const ownsLoot = ogOwner.toUpperCase() === address.toUpperCase()

    return hasStakedLoot || ownsLoot
  }

  async function refreshIsApproved(tokenId: string): Promise<boolean> {
    const loot = getLootContract(tokenId)

    const isApproved: boolean = await loot.isApprovedForAll(
      address,
      DungeonAddress
    )

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
      hp: returnedPlayerStats.hp.toNumber(),
      armor: returnedPlayerStats.armor.toNumber(),
      attack: returnedPlayerStats.attack.toNumber(),
      agility: returnedPlayerStats.agility.toNumber(),
      dexterity: returnedPlayerStats.dexterity.toNumber(),
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

    while (hasNextRound && round <= untilRound) {
      const roundRes = await checkBattleResults(
        tokenId,
        round,
        playerHp,
        monsterHp,
        playerStats
      )

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

  async function approveLootTransactions(tokenId: string): Promise<void> {
    const loot = getLootContract(tokenId)

    try {
      if (!address) {
        throw new Error('Need to connect wallet first')
      }

      if (await refreshIsApproved(tokenId)) {
        toast.success('Approval is not required')
        return
      }

      const tx = await loot['setApprovalForAll(address,bool)'](
        DungeonAddress,
        true
      )
      await tx.wait(1)
      toast.success('Loot Dungeon was approved to manage your Loot')
    } catch (e) {
      console.log(e)
      toast.error('Error while approving Loot Dungeon as a Loot operator')
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
      toast.error('Error while entering the dungeon')
    }
  }

  async function battleMonster(tokenId: string): Promise<void> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    try {
      const tx = await dungeon['battleMonster(uint256)'](tokenId, {
        value: ethers.utils.parseEther(
          getBattlePriceInEther(networkId ?? NetworkId.mainnet)
        ),
      })
      await tx.wait(1)
      toast.success('Your battle has started')
    } catch (e) {
      console.log(e)
      toast.error('Error while attempting to battle')
    }
  }

  async function escapeFromDungeon(tokenId: string): Promise<void> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    try {
      const tx = await dungeon['escapeFromDungeon(uint256)'](tokenId, {
        value: ethers.utils.parseEther(
          getEscapePriceInEther(networkId ?? NetworkId.mainnet)
        ),
      })
      await tx.wait(1)
      toast.success('You escaped from the dungeon successfully')
    } catch (e) {
      console.log(e)
      toast.error('Error while attempting to flee')
    }
  }

  async function claimDrops(tokenId: string): Promise<void> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    try {
      const tx = await dungeon['claimDrops(uint256)'](tokenId)
      await tx.wait(1)
      toast.success(
        'You claimed the drops successfully. Check them out at OpenSea!'
      )
    } catch (e) {
      console.log(e)
      toast.error('Error while claiming rewards')
    }
  }

  async function getFerrymanAgreedPrice(
    tokenId: string
  ): Promise<BigNumberish> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const price = await dungeon['agreedFerrymanPrice(uint256)'](tokenId)

    return price
  }

  async function bribeFerryman(tokenId: string): Promise<void> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    try {
      const tx = await dungeon['bribeFerryman(uint256)'](tokenId, {
        value: await getFerrymanAgreedPrice(tokenId),
      })
      await tx.wait(1)
      toast.success(
        'You bribed the ferryman. You came back to life and the Loot bag is back at your account.'
      )
    } catch (e) {
      console.log(e)
      toast.error('Error while bribing the ferryman')
    }
  }

  async function claim(tokenId: string): Promise<void> {
    const loot = getLootContract(tokenId)

    try {
      const tx = await loot['claim(uint256)'](tokenId)
      await tx.wait(1)
      toast.success(`Loot #${tokenId} was claimed successfully`)
    } catch (e) {
      console.log(e)
      toast.error('Error while claiming Loot')
    }
  }

  async function hasEnoughLink(): Promise<boolean> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    const hasEnough = await dungeon.hasEnoughLink()
    return hasEnough
  }

  async function refreshFerrymanPrice(): Promise<BigNumberish | null> {
    const { dungeon }: { dungeon: Contract } = collectContracts()

    if (dungeon) {
      const ferrymanCurrentPrice = await dungeon.ferrymanCurrentPrice()
      setFerrymanCurrentPrice(ethers.utils.formatEther(ferrymanCurrentPrice))
      return ferrymanCurrentPrice
    }

    return null
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
    enterTheDungeon,
    encounteredMonsters,
    battleMonster,
    escapeFromDungeon,
    hasEnoughLink,
    getBattleResultsUpUntilRound,
    claimDrops,
    bribeFerryman,
    getFerrymanAgreedPrice,
    ferrymanCurrentPrice,
    refreshFerrymanPrice,
    claim,
    mLootEnabled: () => MLootAddress !== '',
  }
}

// Create unstated-next container
const loot = createContainer(useLoot)
export default loot
{
}
