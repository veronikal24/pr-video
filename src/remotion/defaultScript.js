import { applySlideDurations, computePrMetrics } from './constants.js'

const prMetrics = computePrMetrics({ files: [{ additions: 24, deletions: 8 }] })

const rawSlides = [
  {
    id: 'hero',
    tag: 'LinkedIn post',
    headline: 'Excited to share a new update we just shipped',
    body: 'A small product improvement that makes the experience feel simpler, smoother, and more polished.',
    visual: { type: 'hero' },
  },
  {
    id: 'app-screenshot-0',
    tag: 'Product view',
    headline: 'A quick look at the update',
    body: 'preview.example.com',
    visual: {
      type: 'app-screenshot',
      imageUrl: null,
      alt: 'App preview',
    },
  },
  {
    id: 'summary',
    tag: 'Why it matters',
    headline: 'A quick note for your network',
    body: 'Small improvements add up, and these are the kinds of changes that make a product feel better every day.',
    visual: { type: 'summary' },
  },
]

const slides = applySlideDurations(rawSlides, prMetrics, { screenshotCount: 1 })

export const defaultScript = {
  hook: 'Excited to share a new update we just shipped',
  componentSources: [],
  componentCount: 0,
  changedFiles: [],
  uiFileCount: 1,
  hasScreenshots: true,
  estimatedDurationSec: Math.round(
    slides.reduce((n, s) => n + s.durationFrames, 0) / 30
  ),
  slides,
  caption:
    'Excited to share a new update we just shipped.\n\nA small product improvement that makes the experience feel simpler, smoother, and more polished.\n\nSmall improvements add up, and I’m looking forward to feedback.',
  hashtags: ['buildinpublic', 'product', 'design', 'ux'],
  tone: 'celebratory',
  confidence: 0.9,
  skip_reason: null,
  pr: { repo: 'owner/repo', number: 42 },
}
