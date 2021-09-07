import React, { ReactElement, useState } from 'react'
import Layout from '@components/Layout'
import type { NextPage } from 'next'
import styles from '@styles/pages/FAQ.module.scss'
import faq from '@constants/faq'
import classnames from 'classnames'

const FAQ: NextPage = () => {
  const [open, setOpen] = useState<number>(0)

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>FAQ</h1>
        {faq.map((item, index) => (
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
