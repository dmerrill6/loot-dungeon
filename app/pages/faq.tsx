import React, { ReactElement, useState } from 'react'
import Layout from '@components/Layout'
import type { NextPage } from 'next'
import styles from '@styles/pages/FAQ.module.scss'
import faq from '@constants/faq'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import getSubdomain from '@utils/getSubdomain'
import getNetworkIdFromSubdomain from '@utils/getNetworkFromSubdomain'

const FAQ: NextPage = () => {
  const [open, setOpen] = useState<number>(0)

  const subdomain = getSubdomain()
  const network = getNetworkIdFromSubdomain(subdomain)

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>FAQ</h1>
        {faq(network).map((item, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.question} onClick={() => setOpen(index)}>
              <h4>
                <a>{item.q}</a>
              </h4>
            </div>
            <div
              className={classnames(
                styles.answer,
                open !== index && styles.hidden
              )}
            >
              {item.a}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export default FAQ
