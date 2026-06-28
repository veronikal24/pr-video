import { readFile } from 'fs/promises'
import { join } from 'path'
import { CAPTURES_DIR } from './paths.mjs'
import { resolveScriptForRender } from './resolveScriptForRender.mjs'
import {
  captureScreenshotsForRender,
  filterToUiSlides,
  injectScreenshotSlides,
  shouldAttemptRenderCapture,
} from './captureForRender.mjs'

function resolveImagePath(visual) {
  if (visual?.filePath) return visual.filePath
  const url = visual?.imageUrl
  if (url?.startsWith('/captures/')) {
    return join(CAPTURES_DIR, url.slice('/captures/'.length))
  }
  return null
}

async function loadImageAsDataUrl(visual, apiPort) {
  const diskPath = resolveImagePath(visual)
  if (diskPath) {
    try {
      const buf = await readFile(diskPath)
      return `data:image/png;base64,${buf.toString('base64')}`
    } catch (err) {
      console.warn('[prepareScriptForCapture] Could not read image:', diskPath, err.message)
    }
  }

  let fetchUrl = visual?.imageUrl
  if (fetchUrl && !/^https?:\/\//i.test(fetchUrl) && !fetchUrl.startsWith('file://')) {
    fetchUrl = `http://127.0.0.1:${apiPort}${fetchUrl}`
  }

  if (fetchUrl?.startsWith('http')) {
    try {
      const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const mime = res.headers.get('content-type') ?? 'image/png'
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch (err) {
      console.warn('[prepareScriptForCapture] Could not fetch image:', fetchUrl, err.message)
    }
  }

  return null
}

async function embedImagesInSlides(slides, apiPort) {
  let primaryDataUrl = null

  for (const slide of slides) {
    const visual = slide.visual
    if (visual?.type === 'app-screenshot' || visual?.type === 'image') {
      const dataUrl = await loadImageAsDataUrl(visual, apiPort)
      if (dataUrl) {
        primaryDataUrl = dataUrl
        break
      }
    }
  }

  const preparedSlides = []
  for (const slide of slides) {
    const visual = slide.visual ?? {}
    let nextVisual = visual

    if (visual.type === 'app-screenshot' || visual.type === 'image') {
      const dataUrl = (await loadImageAsDataUrl(visual, apiPort)) ?? primaryDataUrl
      if (dataUrl) {
        nextVisual = { ...visual, embeddedImage: dataUrl }
      }
    } else if (visual.type === 'component-preview' && primaryDataUrl) {
      nextVisual = { ...visual, embeddedImage: primaryDataUrl, useScreenshot: true }
    }

    preparedSlides.push({ ...slide, visual: nextVisual })
  }

  return { slides: preparedSlides, primaryDataUrl }
}

export async function prepareScriptForCapture(script, apiPort) {
  const originalSlides = script.slides ?? []
  let working = resolveScriptForRender(script, apiPort)

  if (shouldAttemptRenderCapture(working)) {
    console.log('[render] Trying fast preview screenshot…')
    const captureResult = await captureScreenshotsForRender(working)
    if (captureResult.screenshots?.length) {
      working = injectScreenshotSlides(working, captureResult)
      working.appUrl = captureResult.appUrl ?? working.appUrl
      console.log('[render] Preview screenshot captured')
    } else {
      console.warn('[render] Preview screenshot failed:', captureResult.error)
    }
  }

  let { slides, primaryDataUrl } = await embedImagesInSlides(working.slides ?? [], apiPort)

  if (primaryDataUrl) {
    const uiSlides = filterToUiSlides(slides)
    if (uiSlides.length > 0) {
      slides = uiSlides
      console.log(`[render] UI mode: ${slides.length} slide(s)`)
    }
  }

  if (!slides.length) {
    slides = originalSlides
  }

  return {
    ...working,
    slides,
    appUrl: primaryDataUrl ? (working.appUrl ?? null) : null,
    verifiedAppUrl: primaryDataUrl ? (working.appUrl ?? null) : null,
    hasEmbeddedScreenshots: Boolean(primaryDataUrl),
    renderCaptureError: primaryDataUrl ? null : working.captureError,
  }
}
