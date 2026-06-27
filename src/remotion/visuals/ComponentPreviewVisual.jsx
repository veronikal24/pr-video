import { LiveError, LivePreview, LiveProvider } from 'react-live'
import { liveScope } from '../../lib/liveScope.jsx'
import { CodeChangeVisual } from './CodeChangeVisual'

export function ComponentPreviewVisual({
  previewCode,
  filename,
  canPreview,
  highlightLines,
  status,
  size = 'sm',
}) {
  const tabSize = size === 'lg' ? 16 : 11

  if (!canPreview || !previewCode) {
    return (
      <CodeChangeVisual
        filename={filename}
        highlightLines={highlightLines ?? []}
        status={status ?? 'modified'}
        size={size}
      />
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0d0f12',
        borderRadius: size === 'lg' ? 20 : 16,
        border: '1px solid #2e3138',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: size === 'lg' ? '14px 20px' : '10px 14px',
          background: '#111318',
          borderBottom: '1px solid #2e3138',
          fontSize: tabSize,
          color: '#afa9ec',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {filename}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: size === 'lg' ? 32 : 16,
          background: 'linear-gradient(160deg, #12141c 0%, #0b0c10 100%)',
        }}
      >
        <LiveProvider code={previewCode} scope={liveScope} noInline language="tsx">
          <div style={{ width: '100%', maxWidth: size === 'lg' ? 720 : 420 }}>
            <LivePreview />
            <LiveError
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 8,
                background: '#2a1f0a',
                color: '#ef9f27',
                fontSize: size === 'lg' ? 14 : 11,
                fontFamily: 'ui-monospace, monospace',
              }}
            />
          </div>
        </LiveProvider>
      </div>
    </div>
  )
}
