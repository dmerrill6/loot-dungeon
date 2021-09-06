import styles from '@styles/components/Input.module.scss'
import type { ReactElement } from 'react'
import classnames from 'classnames'

export default function Input({
  className = '',
  ...rest
}: {
  className?: string
  [key: string]: any
}): ReactElement {
  return <input className={classnames(styles.input, className)} {...rest} />
}
