import React, { ReactElement } from 'react'
import Loading from 'react-loading'

export default function Battling({
  tokenId,
}: {
  tokenId?: string
}): ReactElement {
  return (
    <div className="center">
      <Loading type="spin" className="inline" />

      <p>
        Waiting for random number generation from Chainlink... This might take a
        couple of minutes.
      </p>
    </div>
  )
}
