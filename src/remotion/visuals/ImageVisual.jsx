import { Img, interpolate, spring } from 'remotion'

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
    )
  }

  return (
    <BrowserChrome size={size} frame={frame} animated={animated}>
      <Img
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
          transform: animated ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
        }}
      />
    </BrowserChrome>
  )
}
