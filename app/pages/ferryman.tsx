import React, { ReactElement, useEffect } from 'react'
import type { NextPage } from 'next'
import Layout from '@components/Layout'
import Image from 'next/image'
import dynamic from 'next/dynamic'

import styles from '@styles/pages/Ferryman.module.scss'

const Price = dynamic(() => import('@components/FerrymanPrice'), {
  ssr: false,
})

const Ferryman: NextPage = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <div className="center">
          <h1 className={styles.title}>Current Ferryman's Fee</h1>
          <h5>(Price it costs to revive)</h5>
          <Image
            src={`/ferryman.png`}
            alt={`Ferryman image`}
            width={256}
            height={256}
            layout="fixed"
          />
          <Price />
        </div>
      </div>
    </Layout>
  )
}

export default Ferryman
