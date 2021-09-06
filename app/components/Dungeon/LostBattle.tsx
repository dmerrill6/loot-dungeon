import { ReactElement } from 'react'
import BattleResults from './BattleResults'

export default function LostBattle({
  tokenId,
}: {
  tokenId: string
}): ReactElement {
  return <BattleResults tokenId={tokenId} />
}
