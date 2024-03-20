export type VideoInfo = {
  commentCount: number
  description: string
  lengthInSeconds: number
  mylistCount: number
  postedAt: Date
  thumbnailUrl: string
  title: string
  videoId: string
  viewCount: number
  watchId: number
}
export type PlayerMetadata = {
  currentTime: number
  duration: number
  isVideoMetaDataLoaded: boolean
  maximumBuffered: number
  muted: boolean
  showComment: boolean
  volume: number
}
