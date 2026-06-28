import {
  applySlideDurations,
  computePrMetrics,
  getEstimatedDurationSec,
} from '../remotion/constants'
import {
  isUIFile,
} from './prFiles'
import { extractPRImages } from './extractPRImages'

const SKIP_TITLE_PATTERNS = /^(fix|chore|docs|test|ci|build)(\(|:|\s)/i
const MAX_SCREENSHOT_SLIDES = 3

function stripMarkdown(text) {
  if (!text || text === '(no description)') return ''
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text, max) {
  if (!text || text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

function buildLinkedInCopy(pr) {
  const bodyText = stripMarkdown(pr.body)
  const intro = 'Excited to share a new update we just shipped.'
  const summary = bodyText
    ? 'The focus here was on making the experience simpler, smoother, and more polished for everyday use.'
    : 'A small product update that makes the experience feel clearer and easier to use.'
  const closer = 'Small improvements add up, and I’m looking forward to feedback.'

  return {
    intro,
    summary: truncate(summary, 260),
    closer,
    caption: `${intro}\n\n${truncate(summary, 260)}\n\n${closer}`,
  }
}

function inferTone(pr) {
  if (/feat|add|new|launch|ship/i.test(pr.title)) return 'celebratory'
  if (/refactor|perf|arch/i.test(pr.title)) return 'technical'
  if (/fix|patch|bug/i.test(pr.title)) return 'minimal'
  return 'informational'
}

function inferConfidence(pr, hasScreenshots, hasSummary) {
  if (SKIP_TITLE_PATTERNS.test(pr.title)) return 0.25
  if (hasScreenshots) return 0.9
  if (hasSummary) return 0.8
  return 0.7
}

function buildHashtags() {
  const tags = ['buildinpublic', 'product', 'design', 'ux']
  return [...new Set(tags.filter(Boolean))].slice(0, 4)
}

function slidesFromScreenshots(screenshots, appUrl) {
  return screenshots.slice(0, MAX_SCREENSHOT_SLIDES).map((shot, i) => ({
    id: `app-screenshot-${i}`,
    tag: i === 0 ? 'Live UI' : 'App view',
    headline: shot.label ?? 'App preview',
    body: appUrl ? truncate(appUrl.replace(/^https?:\/\//, ''), 80) : '',
    visual: {
      type: 'app-screenshot',
      imageUrl: shot.url,
      filePath: shot.filePath ?? null,
      alt: shot.label ?? 'App screenshot',
    },
  }))
}

function buildSlides(
  pr,
  { screenshots = [], appUrl = null }
) {
  const linkedinCopy = buildLinkedInCopy(pr)
  const slides = []
  const bodyText = stripMarkdown(pr.body)
  const hasSummarySlide = bodyText.length > 80

  slides.push({
    id: 'hero',
    tag: 'LinkedIn post',
    headline: linkedinCopy.intro,
    body: linkedinCopy.summary,
    visual: { type: 'hero' },
  })

  if (hasSummarySlide) {
    slides.push({
      id: 'summary',
      tag: 'Why it matters',
      headline: 'A quick note for your network',
      body: truncate(bodyText, 280),
      visual: { type: 'summary' },
    })
  }

  if (screenshots.length > 0) {
    slides.push(...slidesFromScreenshots(screenshots, appUrl))
  }

  return { slides, hasSummarySlide, screenshotCount: screenshots.length }
}

export function buildScriptFromPR(
  pr,
  {
    componentSources = [],
    styleSources = [],
    screenshots = [],
    appUrl = null,
    captureMode = null,
    captureJobId = null,
    captureError = null,
  } = {}
) {
  // Fall back to images embedded in the PR body when no live screenshots were captured
  if (screenshots.length === 0 && pr.body && pr.body !== '(no description)') {
    const prBodyImages = extractPRImages(pr.body)
    if (prBodyImages.length > 0) {
      screenshots = prBodyImages.map((url, i) => ({
        url,
        label: i === 0 ? 'PR screenshot' : `Screenshot ${i + 1}`,
      }))
      captureMode = captureMode ?? 'pr-body'
    }
  }

  const hasScreenshots = screenshots.length > 0
  const prMetrics = computePrMetrics(pr)
  const { slides: rawSlides, hasSummarySlide, screenshotCount } = buildSlides(pr, {
    screenshots,
    appUrl,
  })

  const slides = applySlideDurations(rawSlides, prMetrics, {
    screenshotCount,
    hasBodySummary: hasSummarySlide || Boolean(stripMarkdown(pr.body)),
  })

  const tone = inferTone(pr)
  const linkedinCopy = buildLinkedInCopy(pr)

  return {
    hook: linkedinCopy.intro,
    slides,
    pr: {
      repo: pr.repo,
      number: pr.number,
      title: pr.title,
      author: pr.author,
      url: pr.url,
      owner: pr.owner,
      repoName: pr.repoName,
      headRef: pr.headRef,
      previewUrl: pr.previewUrl ?? null,
    },
    prMetrics,
    estimatedDurationSec: getEstimatedDurationSec(slides),
    componentSources,
    styleSources,
    changedFiles: pr.files ?? [],
    uiFileCount: (pr.files ?? []).filter(isUIFile).length,
    componentCount: 0,
    styleCount: 0,
    captureMode,
    captureJobId,
    captureError,
    hasScreenshots,
    appUrl: appUrl ?? pr.previewUrl ?? null,
    caption: linkedinCopy.caption,
    hashtags: buildHashtags(),
    tone,
    confidence: inferConfidence(pr, hasScreenshots, hasSummarySlide),
    skip_reason: null,
  }
}
