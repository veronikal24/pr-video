import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
} from 'remotion'
import { SLIDE_DURATION_FRAMES } from './constants'

function SlideContent({ slide, repo, prNumber, frame }) {
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fadeOut = interpolate(
    frame,
    [SLIDE_DURATION_FRAMES - 15, SLIDE_DURATION_FRAMES],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const opacity = Math.min(fadeIn, fadeOut)
  const translateY = interpolate(frame, [0, 20], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0b0c10 0%, #12141c 55%, #1a1630 100%)',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 96,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '8px 20px',
            borderRadius: 999,
            background: 'rgba(127, 119, 221, 0.2)',
            color: '#afa9ec',
            border: '1px solid rgba(127, 119, 221, 0.45)',
            marginBottom: 40,
          }}
        >
          {slide.tag}
        </div>
        <h2
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#fff',
            marginBottom: 28,
            maxWidth: '85%',
          }}
        >
          {slide.headline}
        </h2>
        <p
          style={{
            fontSize: 32,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.68)',
            maxWidth: '78%',
          }}
        >
          {slide.body}
        </p>
      </AbsoluteFill>
      {repo && (
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 20,
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: '0.04em',
          }}
        >
          {repo} · PR #{prNumber}
        </div>
      )}
    </AbsoluteFill>
  )
}

export function PRVideo({ script }) {
  const slides = script?.slides ?? []
  const repo = script?.pr?.repo
  const prNumber = script?.pr?.number

  return (
    <AbsoluteFill style={{ background: '#0b0c10' }}>
      {slides.map((slide, i) => (
        <Sequence
          key={slide.id}
          from={i * SLIDE_DURATION_FRAMES}
          durationInFrames={SLIDE_DURATION_FRAMES}
        >
          <SlideWithFrame slide={slide} repo={repo} prNumber={prNumber} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

function SlideWithFrame({ slide, repo, prNumber }) {
  const frame = useCurrentFrame()
  return <SlideContent slide={slide} repo={repo} prNumber={prNumber} frame={frame} />
}
