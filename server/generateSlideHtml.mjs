import {
  RENDER_HEIGHT,
  RENDER_WIDTH,
  slideDurationSec,
} from './renderConstants.mjs'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You generate self-contained HTML documents used as video frames for a PR promo tool.

Rules:
- Output ONLY a complete HTML document. No markdown, no code fences, no explanation.
- Fixed canvas: ${RENDER_WIDTH}x${RENDER_HEIGHT}px. body { margin:0; overflow:hidden; width:${RENDER_WIDTH}px; height:${RENDER_HEIGHT}px; }
- Dark developer aesthetic: background #0b0c10, accent #afa9ec, text #fff, muted rgba(255,255,255,0.7).
- Use only inline <style> and inline scripts if needed. No external CSS/JS/fonts.
- Include CSS @keyframes animations. Total animation cycle length MUST equal the provided durationSec exactly.
- Fade/slide content in during the first ~0.5s; hold readable through the rest.
- For hero/summary: large headline, tag pill, body text, gradient background similar to #0b0c10 → #1a1630.
- Escape user text safely in HTML entities.`

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripCodeFences(text) {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:html)?\s*([\s\S]*?)```$/i)
  return match ? match[1].trim() : trimmed
}

function buildUserPrompt(slide, slideIndex, totalSlides, script) {
  const durationSec = slideDurationSec(slide)
  const visual = slide.visual ?? {}

  return `Generate animated HTML for slide ${slideIndex + 1} of ${totalSlides}.

durationSec: ${durationSec}
tag: ${slide.tag ?? ''}
headline: ${slide.headline ?? ''}
body: ${slide.body ?? ''}
visualType: ${visual.type ?? 'code-change'}
repo: ${script?.pr?.repo ?? ''}
prNumber: ${script?.pr?.number ?? ''}`
}

function screenshotSlideHtml(slide, slideIndex, totalSlides, script) {
  const durationSec = slideDurationSec(slide)
  const visual = slide.visual ?? {}
  const dataUrl = visual.embeddedImage
  const tag = escapeHtml(slide.tag)
  const headline = escapeHtml(slide.headline)
  const body = escapeHtml(slide.body)
  const repo = escapeHtml(script?.pr?.repo ?? '')
  const prNumber = escapeHtml(String(script?.pr?.number ?? ''))

  const imageBlock = dataUrl
    ? `<img data-slide-image="1" src="${dataUrl}" alt="" />`
    : `<div class="missing">Screenshot unavailable</div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; width: ${RENDER_WIDTH}px; height: ${RENDER_HEIGHT}px;
    background: #0b0c10; color: #fff; font-family: system-ui, sans-serif;
    overflow: hidden; animation: fadeIn ${durationSec}s ease forwards;
  }
  @keyframes fadeIn {
    0% { opacity: 0; }
    6% { opacity: 1; }
    100% { opacity: 1; }
  }
  .layout { display: flex; flex-direction: column; height: 100%; }
  .chrome {
    flex: 1; min-height: 0; margin: 40px 48px 0;
    background: #1a1d24; border: 1px solid #2e3138; border-radius: 20px;
    overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 24px 80px rgba(0,0,0,0.45);
  }
  .bar {
    height: 52px; background: #111318; border-bottom: 1px solid #2e3138;
    display: flex; align-items: center; padding: 0 18px; gap: 8px; flex-shrink: 0;
  }
  .dot { width: 14px; height: 14px; border-radius: 50%; }
  .dot-r { background: #ff5f57; }
  .dot-y { background: #febc2e; }
  .dot-g { background: #28c840; }
  .screen { flex: 1; min-height: 0; background: #0b0c10; position: relative; }
  .screen img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: top center;
  }
  .missing {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    color: #666; font-size: 24px;
  }
  .caption {
    flex-shrink: 0; padding: 28px 56px 32px;
    background: linear-gradient(transparent, rgba(0,0,0,0.88));
  }
  .tag { color: #afa9ec; font-size: 20px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
  .headline { font-size: 40px; font-weight: 700; line-height: 1.15; margin-bottom: 8px; }
  .body { font-size: 22px; color: rgba(255,255,255,0.7); line-height: 1.4; }
  .meta { margin-top: 12px; font-size: 16px; color: rgba(255,255,255,0.35); }
</style>
</head>
<body>
  <div class="layout">
    <div class="chrome">
      <div class="bar">
        <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
      </div>
      <div class="screen">${imageBlock}</div>
    </div>
    <div class="caption">
      <div class="tag">${tag}</div>
      <div class="headline">${headline}</div>
      ${body ? `<div class="body">${body}</div>` : ''}
      <div class="meta">${repo}${repo && prNumber ? ' · ' : ''}${prNumber ? `PR #${prNumber}` : ''} · ${slideIndex + 1}/${totalSlides}</div>
    </div>
  </div>
</body>
</html>`
}

function codeSlideHtml(slide, slideIndex, totalSlides, script) {
  const durationSec = slideDurationSec(slide)
  const visual = slide.visual ?? {}
  const tag = escapeHtml(slide.tag)
  const headline = escapeHtml(slide.headline)
  const body = escapeHtml(slide.body)
  const filename = escapeHtml(visual.filename ?? slide.headline)
  const repo = escapeHtml(script?.pr?.repo ?? '')
  const prNumber = escapeHtml(String(script?.pr?.number ?? ''))

  const lines = visual.highlightLines ?? []
  const codeBlock = lines.length
    ? lines
        .map((line) => {
          const cls = line.type === 'add' ? 'add' : line.type === 'remove' ? 'remove' : 'ctx'
          return `<span class="${cls}">${escapeHtml(line.text)}</span>`
        })
        .join('\n')
    : `<span class="ctx">// ${escapeHtml(filename)}</span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; width: ${RENDER_WIDTH}px; height: ${RENDER_HEIGHT}px;
    background: #0b0c10; color: #fff; font-family: system-ui, sans-serif;
    overflow: hidden; animation: fadeIn ${durationSec}s ease forwards;
  }
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(12px); }
    8% { opacity: 1; transform: translateY(0); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .wrap { padding: 48px 56px 40px; height: 100%; display: flex; flex-direction: column; }
  .tag { color: #afa9ec; font-size: 20px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }
  .headline { font-size: 44px; font-weight: 700; line-height: 1.1; margin-bottom: 8px; }
  .body { font-size: 22px; color: rgba(255,255,255,0.7); margin-bottom: 24px; }
  .code-wrap {
    flex: 1; min-height: 0; background: #0d0f12; border: 1px solid #2e3138;
    border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;
  }
  .code-bar {
    padding: 14px 20px; background: #111318; border-bottom: 1px solid #2e3138;
    font-family: ui-monospace, monospace; font-size: 16px; color: #afa9ec;
  }
  pre {
    margin: 0; padding: 24px; font-family: ui-monospace, monospace; font-size: 18px;
    line-height: 1.55; overflow: hidden; flex: 1;
  }
  .add { color: #7ee787; display: block; }
  .remove { color: #ff7b72; display: block; }
  .ctx { color: rgba(255,255,255,0.55); display: block; }
  .meta { margin-top: 16px; font-size: 16px; color: rgba(255,255,255,0.35); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="tag">${tag}</div>
    <div class="headline">${headline}</div>
    ${body ? `<div class="body">${body}</div>` : ''}
    <div class="code-wrap">
      <div class="code-bar">${filename}</div>
      <pre>${codeBlock}</pre>
    </div>
    <div class="meta">${repo}${repo && prNumber ? ' · ' : ''}${prNumber ? `PR #${prNumber}` : ''} · ${slideIndex + 1}/${totalSlides}</div>
  </div>
</body>
</html>`
}

export function fallbackSlideHtml(slide, slideIndex, totalSlides, script) {
  const visual = slide.visual ?? {}

  if (
    visual.type === 'app-screenshot' ||
    visual.type === 'image' ||
    (visual.type === 'component-preview' && visual.useScreenshot && visual.embeddedImage)
  ) {
    return screenshotSlideHtml(slide, slideIndex, totalSlides, script)
  }

  if (visual.type === 'code-change' || visual.type === 'component-preview') {
    return codeSlideHtml(slide, slideIndex, totalSlides, script)
  }

  const durationSec = slideDurationSec(slide)
  const tag = escapeHtml(slide.tag)
  const headline = escapeHtml(slide.headline)
  const body = escapeHtml(slide.body)
  const repo = escapeHtml(script?.pr?.repo ?? '')
  const prNumber = escapeHtml(String(script?.pr?.number ?? ''))

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; width: ${RENDER_WIDTH}px; height: ${RENDER_HEIGHT}px;
    background: linear-gradient(160deg, #0b0c10 0%, #12141c 55%, #1a1630 100%);
    color: #fff; font-family: system-ui, sans-serif; overflow: hidden;
    animation: fadeIn ${durationSec}s ease forwards;
  }
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(12px); }
    8% { opacity: 1; transform: translateY(0); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .wrap { padding: 72px 80px; height: 100%; display: flex; flex-direction: column; justify-content: center; }
  .tag { color: #afa9ec; font-size: 20px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
  .headline { font-size: 64px; font-weight: 700; line-height: 1.08; margin-bottom: 20px; max-width: 1200px; }
  .body { font-size: 28px; color: rgba(255,255,255,0.7); line-height: 1.45; max-width: 1000px; }
  .meta { margin-top: auto; font-size: 16px; color: rgba(255,255,255,0.35); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="tag">${tag}</div>
    <div class="headline">${headline}</div>
    ${body ? `<div class="body">${body}</div>` : ''}
    <div class="meta">${repo}${repo && prNumber ? ' · ' : ''}${prNumber ? `PR #${prNumber}` : ''} · ${slideIndex + 1}/${totalSlides}</div>
  </div>
</body>
</html>`
}

async function callClaude(userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.warn('[generateSlideHtml] Claude API error:', res.status, err.slice(0, 300))
    return null
  }

  const data = await res.json()
  const text = data.content?.find((block) => block.type === 'text')?.text
  return text ? stripCodeFences(text) : null
}

function usesDeterministicTemplate(slide) {
  const visual = slide.visual ?? {}
  if (visual.type === 'app-screenshot' || visual.type === 'image') return true
  if (visual.type === 'code-change') return true
  if (visual.type === 'component-preview') return true
  if (visual.type === 'hero' || visual.type === 'summary') return true
  return false
}

export async function generateSlideHtml(slide, slideIndex, totalSlides, script) {
  const visual = slide.visual ?? {}

  if (
    visual.type === 'app-screenshot' ||
    visual.type === 'image' ||
    (visual.type === 'component-preview' && visual.useScreenshot)
  ) {
    return screenshotSlideHtml(slide, slideIndex, totalSlides, script)
  }

  if (visual.type === 'code-change' || visual.type === 'component-preview') {
    return codeSlideHtml(slide, slideIndex, totalSlides, script)
  }

  if (visual.type === 'hero' || visual.type === 'summary') {
    return fallbackSlideHtml(slide, slideIndex, totalSlides, script)
  }

  if (!usesDeterministicTemplate(slide)) {
    try {
      const userPrompt = buildUserPrompt(slide, slideIndex, totalSlides, script)
      const html = await callClaude(userPrompt)
      if (html && html.includes('<html')) return html
    } catch (err) {
      console.warn('[generateSlideHtml] Claude call failed:', err.message)
    }
  }

  return fallbackSlideHtml(slide, slideIndex, totalSlides, script)
}
