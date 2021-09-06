import { ReactElement } from 'react'
import BattleResults from './BattleResults'

export default function WonBattle({
  tokenId,
}: {
  tokenId: string
}): ReactElement {
  return <BattleResults tokenId={tokenId} />
}
