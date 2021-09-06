import { ReactElement } from 'react'
import Modal from 'react-modal'

export default function StyledModal({
  children,
  isOpen,
  ...rest
}: {
  children: ReactElement
  isOpen: boolean
}): ReactElement {
  return (
    <Modal isOpen={isOpen} closeTimeoutMS={200} {...rest}>
      {children}
    </Modal>
  )
}
