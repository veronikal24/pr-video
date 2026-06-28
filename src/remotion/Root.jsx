import { Composition } from 'remotion'
import { PRVideo } from './PRVideo.jsx'
import { defaultScript } from './defaultScript.js'
import {
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  getVideoDurationInFrames,
  PR_VIDEO_FPS,
} from './constants.js'

export function RemotionRoot() {
  const durationInFrames = getVideoDurationInFrames(defaultScript.slides)

  return (
    <Composition
      id="PRVideo"
      component={PRVideo}
      durationInFrames={durationInFrames}
      fps={PR_VIDEO_FPS}
      width={COMPOSITION_WIDTH}
      height={COMPOSITION_HEIGHT}
      defaultProps={{ script: defaultScript }}
      calculateMetadata={({ props }) => ({
        durationInFrames: getVideoDurationInFrames(props.script?.slides ?? []),
      })}
    />
  )
}
