import { HeroVisual } from './HeroVisual'
import { ImageVisual } from './ImageVisual'
import { LivePreviewVisual } from './LivePreviewVisual'
import { CodeChangeVisual } from './CodeChangeVisual'
import { ComponentPreviewVisual } from './ComponentPreviewVisual'

export function SlideVisual({ slide, repo, size = 'sm' }) {
  const visual = slide.visual ?? { type: 'code-change', filename: 'unknown', highlightLines: [] }

  if (visual.type === 'hero') {
    return <HeroVisual headline={slide.headline} body={slide.body} repo={repo} size={size} />
  }

  if (visual.type === 'component-preview') {
    return (
      <ComponentPreviewVisual
        previewCode={visual.previewCode}
        filename={visual.filename}
        canPreview={visual.canPreview}
        highlightLines={visual.highlightLines}
        status={visual.status}
        size={size}
      />
    )
  }

  if (visual.type === 'live-preview') {
    return <LivePreviewVisual url={visual.url} size={size} />
  }

  if (visual.type === 'image') {
    return (
      <ImageVisual
        imageUrl={visual.imageUrl}
        alt={slide.headline}
        size={size}
      />
    )
  }

  if (visual.type === 'code-change') {
    return (
      <CodeChangeVisual
        filename={visual.filename}
        highlightLines={visual.highlightLines}
        status={visual.status}
        size={size}
      />
    )
  }

  return (
    <CodeChangeVisual
      filename={slide.headline}
      highlightLines={[]}
      status="modified"
      size={size}
    />
  )
}
