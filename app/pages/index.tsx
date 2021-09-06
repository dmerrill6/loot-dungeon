import React from 'react'
import type { NextPage } from 'next'
import Image from 'next/image'
import Layout from '@components/Layout'
import styles from '@styles/pages/Home.module.scss'
import Link from 'next/link'
import Button from '@components/Button'
import { useRouter } from 'next/router'

const Home: NextPage = () => {
  const router = useRouter()

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.title}>
          <h1>Loot Dungeon</h1>
        </div>
        <p className={styles.subtitle}>
          Bring your Loot. Battle monsters. Earn NFT rewards.
        </p>
        <Image
          src="/meta.png"
          alt="Loot Dungeon image"
          width={500}
          height={280}
        />
        <p className={styles.description}>
          Loot Dungeon is a game built on top of{' '}
          <a href="https://lootproject.com" target="_blank" rel="noreferrer">
            Loot
          </a>
          . Through smart contracts you can stake your Loot and battle a
          monster. Battle results are determined by a dice roll (using{' '}
          <a
            href="https://docs.chain.link/docs/chainlink-vrf/"
            target="_blank"
            rel="noreferrer"
          >
            Chainlink VRFs
          </a>
          ) and your Loot stats. By winning battles you can claim unique and
          rare items. Each monster drops a guaranteed item and might drop a rare
          card.
        </p>
        <Button
          className={styles.cta}
          style="primary"
          onClick={() => router.push('/dungeon')}
        >
          Enter the Dungeon
        </Button>
        <div className={styles.main_link}>
          <Link href="/faq">FAQ</Link>
        </div>
        <div className={styles.main_link}>
          <Link href="/monsters">Monsters</Link>
        </div>
        <div className={styles.main_link}>
          <Link href="/stats">Loot stats</Link>
        </div>
        <div className={styles.main_link}>
          <Link href="/not-implemented">Smart contract</Link>
        </div>
      </div>
    </Layout>
  )
}

export default Home
