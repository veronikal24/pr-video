export const PR_VIDEO_FPS = 30
export const SLIDE_DURATION_FRAMES = 4 * PR_VIDEO_FPS
export const COMPOSITION_WIDTH = 1920
export const COMPOSITION_HEIGHT = 1080

export function getVideoDurationInFrames(slideCount) {
  return Math.max(slideCount, 1) * SLIDE_DURATION_FRAMES
}
