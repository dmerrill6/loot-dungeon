import { ChangeEvent, ReactElement, useEffect, useState } from 'react'
import loot from '@state/loot'
import { toast } from 'react-toastify'
import styles from '@styles/components/Claim.module.scss'
import classnames from 'classnames'
import Button from './Button'
import Input from './Input'
import wallet from '@state/wallet'
import { NetworkId } from '@utils/networkIdToName'

export default function Claim(): ReactElement {
  const { claim } = loot.useContainer()
  const { networkId } = wallet.useContainer()
  const [tokenId, setTokenId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  return (
    <div className={classnames(styles.container, styles.claim)}>
      <h2>Claim Loot</h2>
      <form
        className={styles.buttons}
        onSubmit={async (e) => {
          e.preventDefault()
          if (tokenId === '') return

          setLoading(true)
          try {
            await claim(tokenId)
          } catch (e: any) {
            toast.error(e?.message)
          }
          setLoading(false)
        }}
      >
        <Input
          value={tokenId}
          className={styles.token_id_input}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTokenId(e.target.value)
          }
          type="text"
          placeholder="Enter the number of the Loot bag to claim"
        />
        <Button
          type="submit"
          size="big"
          style="primary"
          onClick={undefined}
          disabled={tokenId == ''}
          loading={loading}
        >
          <div>Claim Loot #{tokenId}</div>
        </Button>
      </form>
      {networkId === NetworkId.polygon ? (
        <p>
          When claiming Loot # lower or equal to 8000, you are using the
          official{' '}
          <a
            href="https://opensea.io/collection/polyloot"
            target="_blank"
            rel="noreferrer"
          >
            PolyLoot contract
          </a>{' '}
          (you can also purchase Loot from OpenSea using that link). When using
          numbers above 8000, you are minting from our custom{' '}
          <a
            href="https://polygonscan.com/address/0x74ef5427ad5afc0d037d0f5486652a47681fa326"
            target="_blank"
            rel="noreferrer"
          >
            mLoot contract for Polygon.
          </a>
        </p>
      ) : null}
    </div>
  )
}
