import { useState } from 'react'
import { SlideVisual } from '../remotion/visuals/SlideVisual'
import { VISUAL_TYPES } from '../remotion/visuals/visualTypes'
import { isUIFile } from '../lib/prFiles'

export default function ScriptReview({ prData, onApproved }) {
  const { pr, script: initial } = prData
  const [script, setScript] = useState(initial)
  const componentSources = script.componentSources ?? []
  const uiFiles = (script.changedFiles ?? pr.files ?? []).filter(isUIFile)

  function updateSlide(id, field, value) {
    setScript((s) => ({
      ...s,
      slides: s.slides.map((slide) =>
        slide.id === id ? { ...slide, [field]: value } : slide
      ),
    }))
  }

  function updateSlideVisual(id, visual) {
    setScript((s) => ({
      ...s,
      slides: s.slides.map((slide) =>
        slide.id === id ? { ...slide, visual } : slide
      ),
    }))
  }

  function updateField(field, value) {
    setScript((s) => ({ ...s, [field]: value }))
  }

  function setVisualType(slide, type) {
    if (type === 'hero') {
      updateSlideVisual(slide.id, { type: 'hero' })
      return
    }
    if (type === 'component-preview') {
      updateSlideVisual(slide.id, {
        type: 'component-preview',
        filename: slide.visual?.filename ?? slide.headline,
        previewCode: slide.visual?.previewCode ?? null,
        canPreview: slide.visual?.canPreview ?? false,
        highlightLines: slide.visual?.highlightLines ?? [],
        status: slide.visual?.status ?? 'modified',
        patch: slide.visual?.patch ?? null,
      })
      return
    }
    if (type === 'live-preview') {
      updateSlideVisual(slide.id, {
        type: 'live-preview',
        url: slide.visual?.url ?? '',
      })
      return
    }
    if (type === 'image') {
      updateSlideVisual(slide.id, {
        type: 'image',
        imageUrl: slide.visual?.imageUrl ?? '',
      })
      return
    }
    updateSlideVisual(slide.id, {
      type: 'code-change',
      filename: slide.visual?.filename ?? slide.headline,
      patch: slide.visual?.patch ?? null,
      status: slide.visual?.status ?? 'modified',
      highlightLines: slide.visual?.highlightLines ?? [],
    })
  }

  return (
    <div className="view-review">
      <div className="review-header">
        <div>
          <h2 className="review-title">Review your script</h2>
          <a href={pr.url} target="_blank" rel="noreferrer" className="pr-link">
            PR #{pr.number}: {pr.title}
          </a>
        </div>
        <button
          className="btn-primary"
          onClick={() => onApproved({ ...script, pr, approved_at: new Date().toISOString() })}
        >
          Approve and render video →
        </button>
      </div>

      {script.confidence < 0.4 && (
        <div className="low-confidence-banner">
          Low confidence ({Math.round(script.confidence * 100)}%) — {script.skip_reason}. You can still proceed.
        </div>
      )}

      <div className="pr-meta-panel">
        {componentSources.length > 0 && (
          <div className="pr-meta-row">
            <span className="field-label">
              React components loaded ({componentSources.length})
            </span>
            <div className="changed-files-list">
              {componentSources.map((c) => (
                <span key={c.filename} className="changed-file-pill">
                  {c.filename}
                  {!c.source && ' (diff only)'}
                </span>
              ))}
            </div>
            <p className="meta-hint">
              Components are rendered live with react-live. Complex imports fall back to code diff.
            </p>
          </div>
        )}
        {uiFiles.length > 0 && (
          <div className="pr-meta-row">
            <span className="field-label">All changed UI files ({uiFiles.length})</span>
            <div className="changed-files-list">
              {uiFiles.slice(0, 8).map((f) => (
                <span key={f.filename} className="changed-file-pill">{f.filename}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="review-grid">
        <div className="review-left">
          <label className="field-label">Opening hook</label>
          <textarea
            className="field-textarea"
            rows={2}
            value={script.hook}
            onChange={(e) => updateField('hook', e.target.value)}
          />

          <label className="field-label" style={{ marginTop: 16 }}>Caption</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={script.caption}
            onChange={(e) => updateField('caption', e.target.value)}
          />

          <label className="field-label" style={{ marginTop: 16 }}>Hashtags</label>
          <input
            className="field-input"
            value={script.hashtags.join(', ')}
            onChange={(e) =>
              updateField(
                'hashtags',
                e.target.value.split(',').map((h) => h.trim().replace(/^#/, ''))
              )
            }
          />

          <div className="tone-row">
            <span className="field-label">Tone</span>
            <span className={`tone-pill tone-${script.tone}`}>{script.tone}</span>
          </div>
        </div>

        <div className="review-right">
          <label className="field-label">Slides ({script.slides.length}) — rendered components</label>
          {script.slides.map((slide, i) => (
            <div key={slide.id} className="slide-editor">
              <div className="slide-editor-num">{i + 1}</div>
              <div className="slide-editor-fields">
                <div className="slide-visual-preview">
                  <div className="slide-visual-preview-inner">
                    <SlideVisual slide={slide} repo={pr.repo} />
                  </div>
                </div>

                <div className="visual-controls">
                  <label className="field-label">Visual</label>
                  <select
                    className="field-input"
                    value={slide.visual?.type ?? 'component-preview'}
                    onChange={(e) => setVisualType(slide, e.target.value)}
                  >
                    {VISUAL_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>

                  {slide.visual?.type === 'live-preview' && (
                    <input
                      className="field-input"
                      placeholder="https://your-app.vercel.app"
                      value={slide.visual.url ?? ''}
                      onChange={(e) =>
                        updateSlideVisual(slide.id, {
                          type: 'live-preview',
                          url: e.target.value,
                        })
                      }
                    />
                  )}

                  {slide.visual?.type === 'image' && (
                    <input
                      className="field-input"
                      placeholder="Screenshot URL"
                      value={slide.visual.imageUrl ?? ''}
                      onChange={(e) =>
                        updateSlideVisual(slide.id, {
                          type: 'image',
                          imageUrl: e.target.value,
                        })
                      }
                    />
                  )}
                </div>

                <input
                  className="field-input slide-tag-input"
                  placeholder="Tag"
                  value={slide.tag}
                  onChange={(e) => updateSlide(slide.id, 'tag', e.target.value)}
                />
                <input
                  className="field-input"
                  placeholder="Headline"
                  value={slide.headline}
                  onChange={(e) => updateSlide(slide.id, 'headline', e.target.value)}
                />
                <textarea
                  className="field-textarea"
                  rows={2}
                  placeholder="Body"
                  value={slide.body}
                  onChange={(e) => updateSlide(slide.id, 'body', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
