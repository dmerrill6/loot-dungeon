import { NextPage } from 'next'
import styles from '@styles/pages/Dungeon.module.scss'
import Layout from '@components/Layout'
import DungeonComponent from '@components/Dungeon'
import { useRouter } from 'next/router'

const Dungeon: NextPage = () => {
  const router = useRouter()
  const { pid } = router.query
  const tokenId = Array.isArray(pid) ? pid[0] : pid

  return (
    <Layout>
      <div className={styles.container}>
        <DungeonComponent tokenId={tokenId} />
      </div>
    </Layout>
  )
}

export default Dungeon
