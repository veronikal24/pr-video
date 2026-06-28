import { HeroVisual } from './HeroVisual.jsx'
import { CodeChangeVisual } from './CodeChangeVisual.jsx'
import { ComponentPreviewVisual } from './ComponentPreviewVisual.jsx'
import { ImageVisual } from './ImageVisual.jsx'

export function SlideVisual({
  slide,
  repo,
  size = 'sm',
  frame = 0,
  durationFrames = 120,
  animated = false,
}) {
  const visual = slide.visual ?? { type: 'code-change', filename: 'unknown', highlightLines: [] }

  if (visual.type === 'hero' || visual.type === 'summary') {
    return <HeroVisual headline={slide.headline} body={slide.body} repo={repo} size={size} />
  }

  if (visual.type === 'app-screenshot' || visual.type === 'image') {
    return (
      <ImageVisual
        imageUrl={visual.imageUrl}
        alt={visual.alt ?? slide.headline}
        size={size}
        frame={frame}
        durationFrames={durationFrames}
        animated={animated}
      />
    )
  }

  if (visual.type === 'component-preview') {
    return (
      <ComponentPreviewVisual
        previewCode={visual.previewCode}
        filename={visual.filename}
        canPreview={visual.canPreview}
        highlightLines={visual.highlightLines}
        status={visual.status}
        injectedCss={visual.injectedCss}
        size={size}
        frame={frame}
        durationFrames={durationFrames}
        animated={animated}
      />
    )
  }

  if (visual.type === 'code-change' || visual.type === 'live-preview') {
    return (
      <CodeChangeVisual
        filename={visual.filename ?? slide.headline}
        highlightLines={visual.highlightLines ?? []}
        status={visual.status ?? 'modified'}
        size={size}
        frame={frame}
        durationFrames={durationFrames}
        animated={animated}
      />
    )
  }

  return (
    <CodeChangeVisual
      filename={slide.headline}
      highlightLines={[]}
      status="modified"
      size={size}
      frame={frame}
      durationFrames={durationFrames}
      animated={animated}
    />
  )
}
