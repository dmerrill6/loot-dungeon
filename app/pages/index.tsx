import React, { useMemo } from 'react'
import type { NextPage } from 'next'
import Image from 'next/image'
import Layout from '@components/Layout'
import styles from '@styles/pages/Home.module.scss'
import Link from 'next/link'
import Button from '@components/Button'
import { useRouter } from 'next/router'
import getNetworkIdFromSubdomain from '@utils/getNetworkFromSubdomain'
import getSubdomain from '@utils/getSubdomain'
import { NetworkId } from '@utils/networkIdToName'

const Home: NextPage = () => {
  const router = useRouter()

  const subdomainNetworkId = useMemo(
    () => getNetworkIdFromSubdomain(getSubdomain()),
    []
  )

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.title}>
          {subdomainNetworkId === NetworkId.mainnet ? (
            <h1>Loot Dungeon</h1>
          ) : null}
          {subdomainNetworkId === NetworkId.polygon ? (
            <h1>[Poly]Loot Dungeon</h1>
          ) : null}
        </div>
        <p className={styles.subtitle}>
          Bring your Loot. Battle monsters. Earn NFT rewards.
        </p>
        <Image
          src="/loot-dungeon.png"
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
          card. Items are ERC1155 NFTs containing machine-generated pixel art.
        </p>
        <Button
          className={styles.cta}
          style="primary"
          onClick={() => router.push('/dungeon')}
        >
          Enter the Dungeon
        </Button>
        {subdomainNetworkId === NetworkId.mainnet ? (
          <div className={styles.alternative}>
            <h4>Don't have any Loot to stake?</h4>
            <Button
              style="secondary"
              onClick={() => router.push('https://polygon.lootdungeon.app')}
            >
              Try the PolyLoot Dungeon
            </Button>
          </div>
        ) : null}
        {subdomainNetworkId === NetworkId.polygon ? (
          <div className={styles.alternative}>
            <h4>Ready to try the mainnet version?</h4>
            <Button
              style="secondary"
              onClick={() => router.push('https://lootdungeon.app')}
            >
              Go to Loot Dungeon at Mainnet
            </Button>
          </div>
        ) : null}
        <div className={styles.main_link}>
          <Link href="/faq">FAQ</Link>
        </div>
        <div className={styles.main_link}>
          <Link href="/monsters">Monsters</Link>
        </div>
        <div className={styles.main_link}>
          <Link href="/stats">My stats</Link>
        </div>
        <div className={styles.main_link}>
          <a
            target="_blank"
            rel="noreferrer"
            href={
              subdomainNetworkId === NetworkId.polygon
                ? 'https://polygonscan.com/address/0x54a87d8aef21e3e8aa3192f928f125496e20d159'
                : `https://etherscan.io/address/0xdc9d70e37662ce16615224efaa9bb2315b80e36b`
            }
          >
            Smart contract
          </a>
        </div>
        <div className={styles.main_link}>
          <a
            target="_blank"
            rel="noreferrer"
            href={
              subdomainNetworkId === NetworkId.polygon
                ? `https://opensea.io/collection/polyloot-dungeon`
                : `https://opensea.io/collection/loot-dungeon`
            }
          >
            OpenSea
          </a>
        </div>
        <div className={styles.main_link}>
          <Link href={`/ferryman`}>Ferryman's fee</Link>
        </div>
      </div>
      <div className={styles.social}>
        <a
          href="https://discord.gg/z6azBRgZ3J"
          rel="noreferrer"
          target="_blank"
        >
          Discord
        </a>
        <a
          href="https://twitter.com/LootDungeonApp"
          rel="noreferrer"
          target="_blank"
        >
          Twitter
        </a>
      </div>
    </Layout>
  )
}

export default Home
