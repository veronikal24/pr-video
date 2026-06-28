import { useEffect, useState } from 'react'
import { Player } from '@remotion/player'
import { PRVideo } from '../remotion/PRVideo'
import {
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  getVideoDurationInFrames,
  PR_VIDEO_FPS,
} from '../remotion/constants'
import { exportVideo, checkLocalServer, stopLocalSession } from '../lib/captureLocalApp'

export default function VideoPlayer({ script }) {
  const durationInFrames = getVideoDurationInFrames(script.slides)
  const [exporting, setExporting] = useState(false)
  const [exportUrl, setExportUrl] = useState(null)
  const [exportError, setExportError] = useState(null)

  useEffect(() => {
    return () => {
      stopLocalSession(script.captureJobId)
    }
  }, [script.captureJobId])

  async function handleExport() {
    setExportError(null)
    setExporting(true)

    try {
      const apiUp = await checkLocalServer()
      if (!apiUp) {
        throw new Error('Run npm run dev so Remotion can export the MP4.')
      }

      const result = await exportVideo(script)
      setExportUrl(result.videoUrl)
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

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

      <div className="export-panel">
        <p className="meta-hint" style={{ marginBottom: 12 }}>
          ~{script.estimatedDurationSec ?? Math.round(durationInFrames / PR_VIDEO_FPS)}s ·{' '}
          {script.slides.length} slides
          {script.hasScreenshots && ' · includes app UI screenshots'}
        </p>

        <button className="btn-primary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Rendering MP4…' : 'Export MP4 with Remotion'}
        </button>

        {exportUrl && (
          <p className="status-msg">
            <a href={exportUrl} download="pr-promo.mp4" className="pr-link">
              Download video.mp4
            </a>
          </p>
        )}

        {exportError && <p className="error-msg">{exportError}</p>}

        {!exportUrl && !exporting && (
          <p className="render-hint">
            Video uses app screenshots when available, plus rendered components and code diffs from the PR.
          </p>
        )}
      </div>

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
