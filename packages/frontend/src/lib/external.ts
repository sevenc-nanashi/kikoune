export const toExternal = (url: string) => {
  const parsedUrl = new URL(url)
  return (
    location.origin +
    "/external/" +
    parsedUrl.host.replace(/\./g, "-") +
    parsedUrl.pathname
  )
}
