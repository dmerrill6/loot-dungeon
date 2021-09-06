import Link from 'next/link'
import { default as NextHead } from 'next/head'
import styles from '@styles/components/Layout.module.scss'
import { ReactElement, useEffect } from 'react'
import wallet from '@state/wallet'
import Button from '@components/Button'
import loot from '@state/loot'

export default function Layout({
  children,
}: {
  children: ReactElement | ReactElement[]
}): ReactElement {
  return (
    <div>
      <Head />
      <Header />
      <div>{children}</div>

      <p className={styles.disclaimer}>
        <b>Disclaimer</b>: Use at your own risk. The smart contracts involved
        have not been audited and as such, users might experience partial or
        permanent loss of funds (or other types of information), delays or
        errors. No guarantees are being made as to the correctness of these
        smart contracts and the authors are not liable for any damages made by
        them or by the user interfaces here provided.
      </p>
    </div>
  )
}

const title = 'Loot Dungeon: Fight monsters and get NFT rewards'
const description = `Loot Dungeon is a game built on top of Loot Project where you can enter dungeons and fight monsters. 
Each monster drops unique and rare items that can be sold on the secondary market. Are you up to the challenge?`
const domain = 'https://lootdungeon.gg'

function Head(): ReactElement {
  return (
    <NextHead>
      <title>Loot Dungeon: Fight monsters and get NFT rewards</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${domain}/`} />
      <meta
        property="og:title"
        content="Loot Dungeon: Fight monsters and get NFT rewards"
      />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${domain}/meta.png`} />

      {/* Meta: Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`${domain}`} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${domain}/meta.png`} />

      {/* Favicon */}
      <link rel="shortcut icon" href="/favicon.ico" />

      {/* Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="true"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Marko+One&family=Space+Mono&family=Open+Sans:wght@400;600&display=swap"
        rel="stylesheet"
      />
    </NextHead>
  )
}

/**
 * Page Header
 * @returns {ReactElement} header
 */
function Header(): ReactElement {
  // Network state
  const { address, unlock, loadStoredWallet } = wallet.useContainer()
  const { refreshIsApproved } = loot.useContainer()

  useEffect(() => {
    loadStoredWallet()
    if (address) {
      refreshIsApproved()
    }
  }, [address])

  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">
          <a>
            <h3>Loot Dungeon</h3>
          </a>
        </Link>
      </div>

      <div className={styles.auth_button}>
        <Button onClick={() => unlock()}>
          <div className={styles.content}>
            {address ? <div className={styles.green_dot} /> : null}
            {address
              ? // Truncate address if authenticated
                address.substr(0, 5) + '...' + address.slice(address.length - 3)
              : 'Connect Wallet'}
          </div>
        </Button>
      </div>
    </div>
  )
}
