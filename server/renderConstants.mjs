const FPS = 30
const WIDTH = 1920
const HEIGHT = 1080
const DEFAULT_DURATION_FRAMES = 4 * FPS

export const RENDER_FPS = FPS
export const RENDER_WIDTH = WIDTH
export const RENDER_HEIGHT = HEIGHT
export const RENDER_DEFAULT_DURATION_FRAMES = DEFAULT_DURATION_FRAMES

export function slideDurationFrames(slide) {
  return slide.durationFrames ?? DEFAULT_DURATION_FRAMES
}

export function slideDurationSec(slide) {
  return slideDurationFrames(slide) / FPS
}
