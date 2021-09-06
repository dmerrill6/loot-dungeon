import React, { ReactElement } from 'react'
import Loading from 'react-loading'

export default function Battling({
  tokenId,
}: {
  tokenId?: string
}): ReactElement {
  return (
    <div className="center">
      <Loading type="spin" />
      <p>Waiting for random number generation (Chainlink)...</p>
    </div>
  )
}
