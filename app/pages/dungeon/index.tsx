import { NextPage } from 'next'
import styles from '@styles/pages/Dungeon.module.scss'
import Layout from '@components/Layout'
import DungeonComponent from '@components/Dungeon'

const Dungeon: NextPage = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <DungeonComponent />
      </div>
    </Layout>
  )
}

export default Dungeon
