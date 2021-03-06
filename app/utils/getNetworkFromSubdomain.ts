import { NetworkId } from './networkIdToName'

export default function getNetworkIdFromSubdomain(
  subdomain: string
): NetworkId {
  if (subdomain === 'polygon') return NetworkId.polygon
  if (subdomain === 'localhost') return NetworkId.polygon
  return NetworkId.mainnet
}
