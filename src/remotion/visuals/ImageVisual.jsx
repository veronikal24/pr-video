import { interpolate, spring } from 'remotion'

const CHROME_HEIGHT = { sm: 36, lg: 52 }
const FPS = 30

function BrowserChrome({ children, size = 'sm', frame = 0, animated = false }) {
  const chromeH = CHROME_HEIGHT[size] ?? CHROME_HEIGHT.sm
  const dotSize = size === 'lg' ? 14 : 10
  const enter = animated
    ? spring({ frame, fps: FPS, config: { damping: 16, stiffness: 90 } })
    : 1

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1a1d24',
        borderRadius: size === 'lg' ? 20 : 16,
        border: '1px solid #2e3138',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        opacity: enter,
        transform: animated ? `scale(${interpolate(enter, [0, 1], [0.94, 1])})` : undefined,
      }}
    >
      <div
        style={{
          height: chromeH,
          flexShrink: 0,
          background: '#111318',
          borderBottom: '1px solid #2e3138',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 8,
        }}
      >
        {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
          <div
            key={color}
            style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: color }}
          />
        ))}
        <div
          style={{
            flex: 1,
            marginLeft: 12,
            height: chromeH * 0.55,
            background: '#0d0f12',
            borderRadius: 8,
            border: '1px solid #2a2d32',
          }}
        />
      </div>
      <div style={{ flex: 1, position: 'relative', background: '#0b0c10', minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Screenshot3DScene({ children, frame = 0, durationFrames = 150, animated = false }) {
  const hover = animated
    ? interpolate(frame, [0, durationFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0

  const rotateY = animated ? interpolate(hover, [0, 1], [-10, 8]) : -6
  const rotateX = animated ? interpolate(hover, [0, 1], [7, 3]) : 6
  const translateY = animated ? interpolate(hover, [0, 1], [18, -8]) : 0
  const translateZ = animated ? interpolate(hover, [0, 1], [0, 24]) : 0
  const shadowStrength = animated ? interpolate(hover, [0, 1], [0.28, 0.46]) : 0.34

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1800px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          width: '88%',
          height: '88%',
          transformStyle: 'preserve-3d',
          transform: `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          filter: `drop-shadow(0 34px 56px rgba(0, 0, 0, ${shadowStrength}))`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-8% -6% -10%',
            borderRadius: 32,
            background:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22), transparent 32%), radial-gradient(circle at 80% 15%, rgba(175,169,236,0.26), transparent 28%), linear-gradient(160deg, rgba(20,24,34,0.45), rgba(7,8,12,0.16))',
            transform: 'translateZ(-42px)',
            opacity: 0.9,
            filter: 'blur(12px)',
          }}
        />
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function ImageVisual({
  imageUrl,
  alt,
  size = 'sm',
  frame = 0,
  durationFrames = 150,
  animated = false,
}) {
  const scale = animated
    ? interpolate(frame, [0, durationFrames], [1, 1.05], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1
  const imgOpacity = animated
    ? spring({ frame: frame - 5, fps: FPS, config: { damping: 20, stiffness: 80 } })
    : 1

  if (!imageUrl) {
    return (
      <Screenshot3DScene frame={frame} durationFrames={durationFrames} animated={animated}>
        <BrowserChrome size={size} frame={frame} animated={animated}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: size === 'lg' ? 24 : 14,
            }}
          >
            No screenshot attached
          </div>
        </BrowserChrome>
      </Screenshot3DScene>
    )
  }

  return (
    <Screenshot3DScene frame={frame} durationFrames={durationFrames} animated={animated}>
      <BrowserChrome size={size} frame={frame} animated={animated}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 18%, rgba(0,0,0,0.08) 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        <img
          src={imageUrl}
          alt={alt ?? 'Feature screenshot'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            opacity: Math.max(0, imgOpacity),
            transform: animated ? `scale(${scale}) translateZ(0)` : 'translateZ(0)',
            transformOrigin: 'top center',
            willChange: 'transform',
          }}
        />
      </BrowserChrome>
    </Screenshot3DScene>
  )
}
