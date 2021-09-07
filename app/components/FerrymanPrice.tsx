import { ReactElement, useEffect } from 'react'
import loot from '@state/loot'
import Loading from 'react-loading'

export default function FerrymanPrice(): ReactElement {
  const { refreshFerrymanPrice, ferrymanCurrentPrice } = loot.useContainer()

  useEffect(() => {
    refreshFerrymanPrice()
  }, [refreshFerrymanPrice])

  return (
    <div>
      {ferrymanCurrentPrice ? (
        <h5>{ferrymanCurrentPrice} ETH</h5>
      ) : (
        <div className="center">
          <Loading type="spin" className="inline" />
        </div>
      )}
    </div>
  )
}
