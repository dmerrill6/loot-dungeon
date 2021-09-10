export enum NetworkId {
  mainnet = 1,
  ropsten = 3,
  rinkeby = 4,
  kovan = 42,
  polygon = 137,
}

export default function networkIdToName(networkId: number | null): NetworkId {
  switch (networkId) {
    case 1:
      return NetworkId.mainnet
    case 3:
      return NetworkId.ropsten
    case 4:
      return NetworkId.rinkeby
    case 42:
      return NetworkId.kovan
    case 137:
      return NetworkId.polygon
    default:
      return NetworkId.mainnet
  }
}
