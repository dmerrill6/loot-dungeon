// gets subdomain from window
export default function getSubdomain(): string {
  if (!process.browser) return ''
  const { hostname } = window.location
  const subdomain = hostname.split('.')[0]
  return subdomain
}
