import { Player } from '@remotion/player'
import { PRVideo } from '../remotion/PRVideo'
import {
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  getVideoDurationInFrames,
  PR_VIDEO_FPS,
} from '../remotion/constants'

export default function VideoPlayer({ script }) {
  const durationInFrames = getVideoDurationInFrames(script.slides.length)

  return (
    <div className="view-video">
      <div className="video-canvas remotion-player-wrap">
        <Player
          component={PRVideo}
          inputProps={{ script }}
          durationInFrames={durationInFrames}
          compositionWidth={COMPOSITION_WIDTH}
          compositionHeight={COMPOSITION_HEIGHT}
          fps={PR_VIDEO_FPS}
          style={{ width: '100%', height: '100%' }}
          controls
          clickToPlay
        />
      </div>

      <p className="render-hint">
        Export with{' '}
        <code className="inline-code">npm run render -- --props=&apos;{`{"script":...}`}&apos;</code>
        {' '}or open Remotion Studio via <code className="inline-code">npm run remotion</code>
      </p>

      <div className="caption-box">
        <p className="caption-text">{script.caption}</p>
        <div className="hashtag-row">
          {script.hashtags.map((h) => (
            <span key={h} className="hashtag">#{h}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
