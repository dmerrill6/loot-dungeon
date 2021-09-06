import { NextPage } from 'next'
import styles from '@styles/pages/Dungeon.module.scss'
import Layout from '@components/Layout'
import StatsComponent from '@components/Stats'

const Stats: NextPage = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <StatsComponent />
      </div>
    </Layout>
  )
}

export default Stats
