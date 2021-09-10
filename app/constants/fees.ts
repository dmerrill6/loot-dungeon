import { NetworkId } from '@utils/networkIdToName'

export const getEscapePrice = (netId: NetworkId): string => {
  if (netId === NetworkId.polygon) {
    return `${getEscapePriceInEther(netId)} MATIC`
  }

  return `${getEscapePriceInEther(netId)} ETH`
}

export const getBattlePrice = (netId: NetworkId): string => {
  if (netId === NetworkId.polygon) {
    return `${getBattlePriceInEther(netId)} MATIC`
  }

  return `${getBattlePriceInEther(netId)} ETH`
}

export const getEscapePriceInEther = (netId: NetworkId): string => {
  if (netId === NetworkId.polygon) {
    return '2'
  }

  return '0.04'
}

export const getBattlePriceInEther = (netId: NetworkId): string => {
  if (netId === NetworkId.polygon) {
    return '1'
  }

  return '0.02'
}
