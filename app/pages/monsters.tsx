import React, { ReactElement } from 'react'
import type { NextPage } from 'next'
import Image from 'next/image'
import Layout from '@components/Layout'
import styles from '@styles/pages/Monsters.module.scss'
import monsters, { Monster } from 'constants/monsters'

function MonsterComponent({ monster }: { monster: Monster }): ReactElement {
  return (
    <div className={styles.monster}>
      <h3>{monster.name}</h3>
      <div className={styles.monster_description}>
        <Image
          className={styles.monster_img}
          src={`/monsters/${monster.id}.png`}
          alt={`${monster.name} image`}
          width={128}
          height={128}
          layout="fixed"
        />
        <div className={styles.desc_and_stats}>
          <p>{monster.description}</p>
          <p>
            Stats: HP: {monster.stats[0]} | ARM: {monster.stats[1]} | ATK:{' '}
            {monster.stats[2]} | AGI: {monster.stats[3]} | DEX:{' '}
            {monster.stats[4]}
          </p>
        </div>
      </div>
    </div>
  )
}

const Monsters: NextPage = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Monsters</h1>
        {Object.values(monsters).map((monster) => (
          <MonsterComponent key={monster.id} monster={monster} />
        ))}
      </div>
    </Layout>
  )
}

export default Monsters
