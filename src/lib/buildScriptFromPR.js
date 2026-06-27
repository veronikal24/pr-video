const SKIP_PATTERNS = /^(fix|chore|docs|test|ci|build)(\(|:|\s)/i

function splitBody(body) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

function pickSlideSources(pr) {
  const lines = splitBody(pr.body)
  const bullets = lines
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, '').trim())

  if (bullets.length >= 2) return bullets.slice(0, 5)

  const paragraphs = lines.filter((line) => line.length > 24 && !/^[-*•]/.test(line))
  if (paragraphs.length >= 1) return paragraphs.slice(0, 4)

  return [pr.title]
}

function headlineFrom(text) {
  const words = text.split(/\s+/)
  if (words.length <= 8) return text
  return words.slice(0, 8).join(' ')
}

function bodyFrom(text, headline) {
  if (text.length <= headline.length + 3) return ''
  const rest = text.slice(headline.length).trim().replace(/^[-–—:]\s*/, '')
  return rest.length > 120 ? `${rest.slice(0, 117)}...` : rest
}

function inferTone(pr) {
  if (/feat|add|new|launch|ship/i.test(pr.title)) return 'celebratory'
  if (/refactor|perf|arch/i.test(pr.title)) return 'technical'
  if (/fix|patch|bug/i.test(pr.title)) return 'minimal'
  return 'informational'
}

function inferConfidence(pr) {
  if (SKIP_PATTERNS.test(pr.title)) return 0.25
  if (/feat|add|new|launch/i.test(pr.title)) return 0.75
  if (/fix|chore|docs/i.test(pr.title)) return 0.3
  return 0.55
}

function inferSkipReason(confidence, pr) {
  if (confidence >= 0.4) return null
  if (/^fix/i.test(pr.title)) return 'Looks like a bugfix — may not be worth promoting'
  if (/^chore/i.test(pr.title)) return 'Chore PR — low marketing value'
  if (/^docs/i.test(pr.title)) return 'Documentation change — limited video appeal'
  return 'Low-signal PR title — review before sharing'
}

function buildSlides(pr) {
  const sources = pickSlideSources(pr)
  const tags = ['Update', 'Detail', 'Impact', 'Context', 'Next']

  return sources.map((text, i) => {
    const headline = headlineFrom(text)
    return {
      id: `s${i + 1}`,
      tag: tags[i] ?? 'Detail',
      headline,
      body: bodyFrom(text, headline) || text.slice(0, 100),
    }
  })
}

function buildHashtags(pr) {
  const [owner] = pr.repo.split('/')
  const titleWord = pr.title.split(/\s+/).find((w) => w.length > 4)?.toLowerCase()
  const tags = ['opensource', owner?.toLowerCase(), 'devtools']
  if (titleWord) tags.push(titleWord.replace(/[^a-z0-9]/gi, ''))
  return [...new Set(tags.filter(Boolean))].slice(0, 4)
}

export function buildScriptFromPR(pr) {
  const confidence = inferConfidence(pr)
  const slides = buildSlides(pr)
  const tone = inferTone(pr)

  return {
    hook: pr.title,
    slides,
    caption: `${pr.title} — fresh from ${pr.repo} by @${pr.author}`,
    hashtags: buildHashtags(pr),
    tone,
    confidence,
    skip_reason: inferSkipReason(confidence, pr),
  }
}
