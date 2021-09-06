import React from 'react'

export default function useStickyState<T>(
  defaultValue: T,
  localStorageKey: string
): [T, Function] {
  const [value, setValue] = React.useState(() => {
    const stickyValue = process.browser
      ? localStorage.getItem(localStorageKey)
      : null
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue
  })
  React.useEffect(() => {
    window.localStorage.setItem(localStorageKey, JSON.stringify(value))
  }, [localStorageKey, value])
  return [value, setValue]
}
