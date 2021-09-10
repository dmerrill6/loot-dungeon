import React, { ReactElement, useEffect } from 'react'
import type { NextPage } from 'next'
import Layout from '@components/Layout'
import dynamic from 'next/dynamic'

import styles from '@styles/pages/Ferryman.module.scss'

const ClaimLoot = dynamic(() => import('@components/ClaimLoot'), {
  ssr: false,
})

const Claim: NextPage = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <div className="center">
          <ClaimLoot />
        </div>
      </div>
    </Layout>
  )
}

export default Claim
