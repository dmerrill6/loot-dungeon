import Image from 'next/image'
import { ReactElement, useState } from 'react'
import Link from 'next/link'
import dayjs from '@utils/dayjs'
import styles from '@styles/components/Dungeon.module.scss'
import Button from '@components/Button'
import Modal from 'react-modal'
import { loot, dungeon } from '@state/index'
import Error from '@components/Error'

const NotStartedModal = ({
  isApproved,
  approve,
  enterTheDungeon,
  tokenId,
  closeModal,
  refreshDungeonState,
}: {
  isApproved: boolean
  approve: Function
  enterTheDungeon: Function
  tokenId: string
  closeModal: Function
  refreshDungeonState: Function
}): ReactElement => {
  const [loading, setLoading] = useState<boolean>(false)
  const [agreed, setAgreed] = useState<boolean>(false)

  if (!isApproved) {
    return (
      <div className="center">
        <h3>Loot Dungeon needs to be approved as an operator of your Loot.</h3>
        <Error type="notice">
          This only gives permission to the smart contract to receive the Loot
          ERC721 when entering the dungeon.
        </Error>
        <Button
          size="big"
          loading={loading}
          style="primary"
          onClick={async () => {
            setLoading(true)
            try {
              await approve()
            } catch (e) {
              console.log(e)
            }
            setLoading(false)
          }}
        >
          Approve Loot Dungeon
        </Button>
      </div>
    )
  }

  return (
    <div className="center">
      <h3>You are about to enter the dungeon</h3>
      <Error type="warning">
        Warning: When entering the dungeon, your Loot will be transfered to the
        Loot Dungeon smart contract. Make sure you read the{' '}
        <a href="/faq" target="_blank" style={{ color: 'black' }}>
          FAQ
        </a>{' '}
        and understand the risks and the fees. You will not be forced to fight
        any monster and will have the option to escape by paying the escape fee.
        Escaping will also net you an NFT.
      </Error>
      <Error type="warning">
        Warning: You will have 24 hours to either battle or escape. Otherwise
        your Loot might be liquidated.
      </Error>
      <div>
        <label>
          <input
            name="agreed"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I've read the FAQ and disclaimer and understand the risks involved.
        </label>
      </div>
      <br />

      <Button
        size="big"
        loading={loading}
        style="primary"
        disabled={!agreed}
        onClick={async () => {
          setLoading(true)
          try {
            await enterTheDungeon(tokenId)
            await refreshDungeonState(tokenId)
            closeModal()
          } catch (e) {
            console.log(e)
          }
          setLoading(false)
        }}
      >
        Enter the dungeon
      </Button>
    </div>
  )
}

export default function NotStarted({
  tokenId,
}: {
  tokenId: string
}): ReactElement {
  const [isOpen, setOpen] = useState<boolean>(false)
  const lootContainer = loot.useContainer()
  const {
    approveLootTransactions: approve,
    isApproved,
    enterTheDungeon,
  } = lootContainer

  const { refreshDungeonState } = dungeon.useContainer()

  return (
    <div className="center">
      <Image
        src="/meta.png"
        alt="Loot Dungeon image"
        className={styles.story_image}
        width={500}
        height={280}
      />
      <p className={styles.story}>
        You are walking down a coastline on a {dayjs().format('dddd')}{' '}
        afternoon. Beside the rocks in the water, you see a cave and a small
        beam of light coming from it.
      </p>
      <div className="center">
        <Button size="big" style="primary" onClick={() => setOpen(true)}>
          Enter the cave
        </Button>
      </div>
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setOpen(false)}
        contentLabel="Enter the cave modal"
      >
        <NotStartedModal
          isApproved={isApproved}
          approve={approve}
          enterTheDungeon={enterTheDungeon}
          tokenId={tokenId}
          closeModal={() => setOpen(false)}
          refreshDungeonState={refreshDungeonState}
        />
      </Modal>
    </div>
  )
}
