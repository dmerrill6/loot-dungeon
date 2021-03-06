import Button from '@components/Button'
import Input from '@components/Input'
import wallet from '@state/wallet'
import styles from '@styles/components/Dungeon.module.scss'
import { NetworkId } from '@utils/networkIdToName'
import Link from 'next/link'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import React, { ChangeEvent, ReactElement, useState } from 'react'

export default function LoadGame({
  title = 'Welcome to the dungeon',
  path = 'dungeon',
}): ReactElement {
  const { address, networkId } = wallet.useContainer()

  const [tokenId, setTokenId] = useState<string>('')
  const router = useRouter()

  if (!address) {
    return <p className="center">Please connect your wallet to continue</p>
  }

  return (
    <div className={classnames(styles.load_game, styles.container)}>
      <h2>{title}</h2>
      <p>
        We are working on autoloading your games. In the meantime please enter
        the dungeon manually.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (tokenId) {
            router.push(`/${path}/${tokenId}`)
          }
        }}
        className={styles.buttons}
      >
        <Input
          value={tokenId}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTokenId(e.target.value)
          }
          type="text"
          className={styles.token_id_input}
          placeholder="Enter your Loot bag #"
        />
        <Button
          type="submit"
          style="primary"
          onClick={undefined}
          disabled={tokenId == ''}
        >
          <div>Continue with Loot #{tokenId}</div>
        </Button>
      </form>
      {networkId === NetworkId.polygon ? (
        <div className="center">
          <h5>Don't have Loot? Claim one here</h5>
          <Link href="/claim">Claim PolyMLoot</Link>
        </div>
      ) : null}
    </div>
  )
}
