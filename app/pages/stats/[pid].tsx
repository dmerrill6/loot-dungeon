import { NextPage } from 'next'
import styles from '@styles/pages/Dungeon.module.scss'
import Layout from '@components/Layout'
import StatsComponent from '@components/Stats'
import { useRouter } from 'next/router'

const Stats: NextPage = () => {
  const router = useRouter()
  const { pid } = router.query
  const tokenId = Array.isArray(pid) ? pid[0] : pid
  return (
    <Layout>
      <div className={styles.container}>
        <StatsComponent tokenId={tokenId} />
      </div>
    </Layout>
  )
}

export default Stats
