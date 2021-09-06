import Button from '@components/Button'
import Input from '@components/Input'
import wallet from '@state/wallet'
import styles from '@styles/components/Dungeon.module.scss'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import { ChangeEvent, ReactElement, useState } from 'react'

export default function LoadGame(): ReactElement {
  const { address }: { address: string | null; unlock: Function } =
    wallet.useContainer()

  const [tokenId, setTokenId] = useState<string>('')
  const router = useRouter()

  if (!address) {
    return <p className="center">Please connect your wallet to continue</p>
  }

  return (
    <div className={classnames(styles.load_game, styles.container)}>
      <h2>Welcome to the dungeon</h2>
      <p>
        We are working on autoloading your games. In the meantime please enter
        the dungeon manually.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (tokenId) {
            router.push(`/dungeon/${tokenId}`)
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
    </div>
  )
}
