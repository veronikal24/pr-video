import { randomUUID } from 'crypto'
import { screenshotUrl } from './screenshotUrl.mjs'

export function getCaptureMeta(script) {
  const pr = script?.pr
  if (!pr) return null

  const owner = pr.owner ?? pr.repo?.split('/')?.[0]
  const repoName = pr.repoName ?? pr.repo?.split('/')?.[1]

  if (!owner || !repoName) return null

  return {
    owner,
    repoName,
    headRef: pr.headRef,
    prNumber: pr.number,
    previewUrl: pr.previewUrl ?? null,
  }
}

/**
 * Fast preview screenshot only — never clone/build during export (too slow and brittle).
 */
export async function captureScreenshotsForRender(script) {
  const meta = getCaptureMeta(script)
  const previewUrl = meta?.previewUrl ?? script.appUrl ?? null

  if (!previewUrl) {
    return {
      screenshots: [],
      appUrl: null,
      captureMode: null,
      error: 'No deploy preview URL on this PR',
    }
  }

  try {
    console.log('[captureForRender] Screenshot deploy preview:', previewUrl)
    const jobId = randomUUID()
    const result = await screenshotUrl(previewUrl, jobId)
    if (result.screenshots?.length) {
      return {
        screenshots: result.screenshots,
        appUrl: result.appUrl ?? previewUrl,
        captureMode: 'preview',
        jobId: result.jobId ?? jobId,
        error: null,
      }
    }
  } catch (err) {
    console.warn('[captureForRender] Preview screenshot failed:', err.message)
    return {
      screenshots: [],
      appUrl: previewUrl,
      captureMode: null,
      error: err.message,
    }
  }

  return {
    screenshots: [],
    appUrl: previewUrl,
    captureMode: null,
    error: 'Preview screenshot returned no images',
  }
}

export function scriptHasScreenshotSlides(script) {
  return (script.slides ?? []).some((slide) => {
    const visual = slide.visual
    if (visual?.type !== 'app-screenshot' && visual?.type !== 'image') return false
    return Boolean(visual.filePath || visual.imageUrl)
  })
}

export function createScreenshotSlides(screenshots, appUrl) {
  return screenshots.slice(0, 3).map((shot, i) => ({
    id: `app-screenshot-${i}`,
    tag: i === 0 ? 'Live UI' : 'App view',
    headline: shot.label ?? 'App preview',
    body: appUrl ? appUrl.replace(/^https?:\/\//, '').slice(0, 80) : '',
    durationFrames: 150,
    visual: {
      type: 'app-screenshot',
      imageUrl: shot.url,
      filePath: shot.filePath ?? null,
      alt: shot.label ?? 'App screenshot',
    },
  }))
}

export function injectScreenshotSlides(script, captureResult) {
  const { screenshots, appUrl } = captureResult
  if (!screenshots?.length) return script

  const screenshotSlides = createScreenshotSlides(screenshots, appUrl)
  const slides = [...(script.slides ?? [])]

  const heroIdx = slides.findIndex((s) => s.visual?.type === 'hero')
  const summaryIdx = slides.findIndex((s) => s.visual?.type === 'summary')
  const insertAt = summaryIdx >= 0 ? summaryIdx + 1 : heroIdx >= 0 ? heroIdx + 1 : 0

  const withoutOldScreenshots = slides.filter(
    (s) => s.visual?.type !== 'app-screenshot' && s.visual?.type !== 'image'
  )

  withoutOldScreenshots.splice(insertAt, 0, ...screenshotSlides)

  return {
    ...script,
    slides: withoutOldScreenshots,
    hasScreenshots: true,
    appUrl: appUrl ?? script.appUrl,
    captureMode: captureResult.captureMode,
    captureJobId: captureResult.jobId ?? script.captureJobId,
  }
}

export function filterToUiSlides(slides) {
  return slides.filter((slide) => {
    const type = slide.visual?.type
    return (
      type === 'hero' ||
      type === 'summary' ||
      type === 'app-screenshot' ||
      type === 'image'
    )
  })
}

export function shouldAttemptRenderCapture(script) {
  if (scriptHasScreenshotSlides(script)) return false
  if (script.hasScreenshots) return false
  const previewUrl = script.appUrl ?? script.pr?.previewUrl
  return Boolean(previewUrl)
}
