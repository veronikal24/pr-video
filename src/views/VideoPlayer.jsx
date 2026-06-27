import { useState, useEffect, useRef } from 'react'

const SLIDE_DURATION = 4000
const TRANSITION_DURATION = 500

export default function VideoPlayer({ script }) {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  const slides = script.slides
  const total = slides.length

  function goTo(idx) {
    setCurrent(idx)
    setProgress(0)
    startRef.current = performance.now()
  }

  function next() { goTo((current + 1) % total) }
  function prev() { goTo((current - 1 + total) % total) }

  useEffect(() => {
    if (!playing) {
      clearTimeout(timerRef.current)
      cancelAnimationFrame(rafRef.current)
      return
    }

    startRef.current = performance.now()

    function tick() {
      const elapsed = performance.now() - startRef.current
      const pct = Math.min(elapsed / SLIDE_DURATION, 1)
      setProgress(pct)
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        timerRef.current = setTimeout(() => {
          setCurrent(c => {
            const nextIdx = (c + 1) % total
            startRef.current = performance.now()
            rafRef.current = requestAnimationFrame(tick)
            return nextIdx
          })
          setProgress(0)
        }, TRANSITION_DURATION)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(timerRef.current)
    }
  }, [playing, current, total])

  return (
    <div className="view-video">
      <div className="video-canvas">
        {slides.map((s, i) => (
          <div key={s.id} className={`slide-frame ${i === current ? 'slide-active' : 'slide-hidden'}`}>
            <div className="slide-tag-pill">{s.tag}</div>
            <h2 className="slide-headline">{s.headline}</h2>
            <p className="slide-body">{s.body}</p>
            <div className="slide-footer">{script.pr?.repo} · PR #{script.pr?.number}</div>
          </div>
        ))}

        <div className="video-progress-bar">
          <div className="video-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="video-controls">
        <button className="ctrl-btn" onClick={prev}>← Prev</button>
        <button className="ctrl-btn ctrl-play" onClick={() => setPlaying(p => !p)}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button className="ctrl-btn" onClick={next}>Next →</button>
      </div>

      <div className="slide-dots">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`dot ${i === current ? 'dot-active' : ''}`}
            onClick={() => { goTo(i); setPlaying(false) }}
          />
        ))}
      </div>

      <div className="caption-box">
        <p className="caption-text">{script.caption}</p>
        <div className="hashtag-row">
          {script.hashtags.map(h => <span key={h} className="hashtag">#{h}</span>)}
        </div>
      </div>
    </div>
  )
}
