import { NextPage } from 'next'
import styles from '@styles/pages/Dungeon.module.scss'
import Layout from '@components/Layout'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const Dynamic = dynamic(() => import('@components/Dungeon'), {
  ssr: false,
})

const Dungeon: NextPage = () => {
  const router = useRouter()
  const { pid } = router.query
  const tokenId = Array.isArray(pid) ? pid[0] : pid

  return (
    <Layout>
      <div className={styles.container}>
        <Dynamic tokenId={tokenId} />
      </div>
    </Layout>
  )
}

export default Dungeon
