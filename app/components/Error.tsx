import { ReactElement } from 'react'
import styles from '@styles/components/Error.module.scss'
import classNames from 'classnames'

export default function Error({
  children,
  type = 'error',
}: {
  children: ReactElement | string | string[] | any
  type?: 'error' | 'warning' | 'notice'
}): ReactElement {
  return (
    <div className={classNames(styles.container, styles[type])}>{children}</div>
  )
}
