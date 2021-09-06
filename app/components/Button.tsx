import styles from '@styles/components/Button.module.scss'
import type { ReactElement } from 'react'
import classnames from 'classnames'
import Loading from 'react-loading'

export default function Button({
  children,
  onClick,
  style = '',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  size = 'small',
  ...rest
}: {
  children: ReactElement | ReactElement[] | string | any
  onClick?: Function
  style?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset' | undefined
  size?: 'small' | 'big'
}): ReactElement {
  const disable = loading || disabled
  return (
    <button
      type={type}
      {...rest}
      className={classnames(
        styles.button,
        styles[style],
        styles[size],
        className,
        disable ? styles.disabled : ''
      )}
      onClick={
        onClick
          ? (e) => {
              e.preventDefault()
              if (!disable) onClick(e)
            }
          : undefined
      }
    >
      <div className={styles.button_content}>
        <div className={styles.loading}>
          {loading ? <Loading type="spin" width={15} height={15} /> : null}
        </div>
        {children}
      </div>
    </button>
  )
}
