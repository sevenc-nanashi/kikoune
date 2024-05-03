export const debounce = <T extends unknown[]>(
  ms: number,
  fn: (...args: T) => void
): ((...args: T) => void) => {
  let timeout: NodeJS.Timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn(...args)
    }, ms)
  }
}
