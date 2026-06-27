import { useState } from 'react'

export default function ScriptReview({ prData, onApproved }) {
  const { pr, script: initial } = prData
  const [script, setScript] = useState(initial)

  function updateSlide(id, field, value) {
    setScript(s => ({
      ...s,
      slides: s.slides.map(slide =>
        slide.id === id ? { ...slide, [field]: value } : slide
      )
    }))
  }

  function updateField(field, value) {
    setScript(s => ({ ...s, [field]: value }))
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

      <div className="review-grid">
        <div className="review-left">
          <label className="field-label">Opening hook</label>
          <textarea
            className="field-textarea"
            rows={2}
            value={script.hook}
            onChange={e => updateField('hook', e.target.value)}
          />

          <label className="field-label" style={{ marginTop: 16 }}>Caption</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={script.caption}
            onChange={e => updateField('caption', e.target.value)}
          />

          <label className="field-label" style={{ marginTop: 16 }}>Hashtags</label>
          <input
            className="field-input"
            value={script.hashtags.join(', ')}
            onChange={e => updateField('hashtags', e.target.value.split(',').map(h => h.trim().replace(/^#/, '')))}
          />

          <div className="tone-row">
            <span className="field-label">Tone</span>
            <span className={`tone-pill tone-${script.tone}`}>{script.tone}</span>
          </div>
        </div>

        <div className="review-right">
          <label className="field-label">Slides ({script.slides.length})</label>
          {script.slides.map((slide, i) => (
            <div key={slide.id} className="slide-editor">
              <div className="slide-editor-num">{i + 1}</div>
              <div className="slide-editor-fields">
                <input
                  className="field-input slide-tag-input"
                  placeholder="Tag"
                  value={slide.tag}
                  onChange={e => updateSlide(slide.id, 'tag', e.target.value)}
                />
                <input
                  className="field-input"
                  placeholder="Headline"
                  value={slide.headline}
                  onChange={e => updateSlide(slide.id, 'headline', e.target.value)}
                />
                <textarea
                  className="field-textarea"
                  rows={2}
                  placeholder="Body"
                  value={slide.body}
                  onChange={e => updateSlide(slide.id, 'body', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
