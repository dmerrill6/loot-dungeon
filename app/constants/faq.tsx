import { BATTLE_PRICE, ESCAPE_PRICE } from '@constants/fees'
import React from 'react'

export default [
  {
    q: 'What is Loot Dungeon?',
    a: (
      <>
        <p>
          Loot Dungeon is a game built for{' '}
          <a href="https://lootproject.com" target="_blank" rel="noreferrer">
            Loot
          </a>{' '}
          holders. It allows you to stake your Loot and enter a dungeon. You
          will encounter a monster and can choose to fight or flee. By defeating
          monsters you can claim their drops, which are ERC1155 NFTs. Death is
          highly penalized, making strong monster loot scarce. High-risk,
          high-reward.
        </p>
        <p>
          All the action is executed in a smart contract on the Ethereum
          network, so there is no trust involved on a third-party.
        </p>
      </>
    ),
  },
  {
    q: 'What are the risks of participating?',
    a: (
      <>
        <p>
          When entering a dungeon, you transfer your Loot bag to the Dungeon
          smart contract. From that point, you have 24 hours to either fight or
          escape from the encountered monster. If you die in the battle, you
          lose your Loot unless you pay the Ferryman's fee (starts at 0.05 ETH
          and increases linearly. Be sure to check the current value before
          entering the dungeon!).
        </p>
        <p>
          Also by participating you are trusting the correctness of the
          implementation of the game logic in the smart contract.
        </p>
      </>
    ),
  },
  {
    q: 'Is the smart contract audited/tested?',
    a: (
      <p>
        The smart contract is not audited, so use it at your own risk. It is
        fully tested though. The link to the tests will be uploaded soon.
      </p>
    ),
  },
  {
    q: 'How is the encountered monster determined?',
    a: (
      <>
        <p>
          The encountered monster is assigned pseudo-randomly (hash function of
          the blockhash and the Loot token id). It is taken from the pool of
          remaining monsters.
        </p>
        <p>
          Initially, there are 2000 rats, 1000 skeletons, 700 minotaurs, 350
          succubus, 100 demons and 50 dragons, so the most likely scenario is
          that you will encounter a rat. When monsters are defeated they are
          removed forever from the pool. When the player escapes, the monster is
          returned to the pool.
        </p>
      </>
    ),
  },
  {
    q: 'How are battles decided?',
    a: (
      <>
        <p>
          Battles are inspired on Dungeon and Dragons dice rolling systems.
          Every monster has different stats (Hit points (HP), Armor (ARM),
          Attack (ATK), Agility (AGI), Dexterity (DEX)). The rarer the monster,
          the higher the stats. Your character also has stats, which are derived
          from the rarity of your Loot bag. At the start of the battle, a dice
          is rolled, which determines the seed for all future randomness. We use
          Chainlink for this random seed generation.
        </p>
        <p>
          After we have seeded the randomness, we iterate over a maximum of 8
          rounds (subject to change). Each round consists of the following:
          <ul>
            <li>The player rolls a 20-faced dice.</li>
            <li>The monster rolls a 20-faced dice.</li>
            <li>
              If the player roll + the player DEX is lower than the monster AGI,
              the player misses.
            </li>
            <li>
              If the monster roll + the monster DEX is lower than the player
              AGI, the monster misses.
            </li>
          </ul>
          When a player or a monster succeeds in hitting, they roll a dice that
          goes from 1 to their ATK. The damage is calculated as the roll value
          minus the ARM of the defender.
        </p>
        <p>
          Example:
          <ul>
            <li>
              The monster rolls a 4. The player AGI is 10 and the monster DEX is
              5. Since (4+5) is less than 10, the monster misses.
            </li>
            <li>
              The player rolls a 5. The monster AGI is 10 and the player DEX is
              5. Since (5+5) is greater than or equal to 10, the player hits.
            </li>
            <li>
              The player has 12 ATK, and rolls a 12-faced dice. The player rolls
              a 5.
            </li>
            <li>
              The monster ARM is 1, so the total damage to the monster is (5-1)
              = 4.
            </li>
          </ul>
        </p>
        <p>
          This is repeated until one of the following conditions are met:
          <ul>
            <li>The player HP or the monster HP reaches 0 (or less).</li>
            <li>We reach the round 8.</li>
          </ul>
        </p>
        <p>
          If the player's HP goes below or equal to 0, the player dies and
          loses. If the monster HP goes below or equal to 0 and the player
          survives, the player wins. If the round 8 is reached and there are no
          causalities, the monster is fatigued and the player wins.
        </p>
      </>
    ),
  },
  {
    q: 'How are stats calculated?',
    a: (
      <>
        <p>
          Our initial approach calculated stats by iterating over the Loot items
          and assigning different values per item and modifier. However, this
          ended up being too expensive in gas which made it difficult to compute
          battle results. We switched this to use the same probability function
          that the original Loot contract so that rarer loots get better stats.
          We couldn't get as much granularity as we wanted but it was a fair
          tradeoff.
        </p>
        <p>
          <ul></ul>
          <li>WEAPON: Determines the ATK stat</li>
          <li>CHEST: Determines the ARM stat</li>
          <li>HEAD: Determines the HP stat</li>
          <li>WAIST: Determines the HP stat</li>
          <li>FOOT: Determines the AGI stat</li>
          <li>HAND: Determines the DEX stat</li>
          <li>NECK: Determines a random stat to boost</li>
          <li>RING: Determines how much the stat is boosted</li>
        </p>
      </>
    ),
  },
  {
    q: 'Do all stats have the same scaling?',
    a: (
      <p>
        Yes, except for the ARM. If a HEAD armor has the same rarity than a
        CHEST armor, the amount of HP given by the HEAD will be twice as much as
        the ARM given by the CHEST. Also, unlike other stats, there are two
        pieces of armor that add up to HP (HEAD and WAIST).
      </p>
    ),
  },
  {
    q: 'What are the fees for participating?',
    a: (
      <p>
        Apart from gas costs, these are the fees for participating: Battling an
        enemy costs {BATTLE_PRICE} ETH (this amount is used to cover the
        Chainlink expenses for getting random numbers). Escaping costs{' '}
        {ESCAPE_PRICE} ETH. The death penalty is losing your Loot or paying the
        Ferryman's fee, which starts at 0.05 ETH and increases by 0.005 ETH
        everytime someone enters the dungeon.
      </p>
    ),
  },
  {
    q: 'How many times can I fight?',
    a: (
      <p>
        You can fight as many as you want, as long as you don't die. However if
        you die and revive you can fight again.
      </p>
    ),
  },
  {
    q: 'Are there any additional rewards for participating?',
    a: (
      <p>
        Yes. You can claim a free NFT the first time you escape, and another one
        the first time you die. Each of these NFTs are claimable once per
        account.
      </p>
    ),
  },
  {
    q: 'Can the variables in the smart contract be changed?',
    a: (
      <p>
        The owner of the contract can adjust the following variables: Monster
        stats, player base stats, fees, and maximum rounds per battle. However,
        these amounts will only be changed if there's a balancing mistake and as
        soon as the authors are confident on the values, they will call the
        `lockFromAdditionalChanges` function which locks the contract from any
        additional adjustment.
      </p>
    ),
  },
  {
    q: 'My transaction was confirmed but the website state did not change.',
    a: (
      <p>
        Please wait a few seconds for any changes and if still nothing happens,
        you can reload safely. The state is backed up at the smart contract
        level so never be afraid of reloading the site.
      </p>
    ),
  },
  {
    q: 'My question is not answered here',
    a: (
      <p>
        Go to our{' '}
        <a
          href="https://discord.gg/z6azBRgZ3J"
          target="_blank"
          rel="noreferrer"
        >
          Discord
        </a>{' '}
        and ask as much as you want.
      </p>
    ),
  },
]
