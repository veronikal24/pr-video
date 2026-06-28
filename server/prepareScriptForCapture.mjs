import { readFile } from 'fs/promises'
import { join } from 'path'
import { CAPTURES_DIR } from './paths.mjs'
import { resolveScriptForRender } from './resolveScriptForRender.mjs'
import {
  captureScreenshotsForRender,
  filterToUiSlides,
  injectScreenshotSlides,
  scriptHasScreenshotSlides,
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
      const res = await fetch(fetchUrl)
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
    }

    preparedSlides.push({ ...slide, visual: nextVisual })
  }

  return { slides: preparedSlides, primaryDataUrl }
}

export async function prepareScriptForCapture(script, apiPort) {
  let working = resolveScriptForRender(script, apiPort)

  const hasSlides = scriptHasScreenshotSlides(working)
  if (!hasSlides) {
    console.log('[render] No screenshot slides in script — capturing app UI now…')
    const captureResult = await captureScreenshotsForRender(working)
    if (captureResult.screenshots?.length) {
      working = injectScreenshotSlides(working, captureResult)
      working.appUrl = captureResult.appUrl ?? working.appUrl
      console.log('[render] Render-time capture succeeded:', captureResult.captureMode)
    } else {
      console.warn('[render] Render-time capture failed:', captureResult.error)
      working.appUrl = captureResult.appUrl ?? working.appUrl
    }
  }

  let { slides, primaryDataUrl } = await embedImagesInSlides(working.slides ?? [], apiPort)

  if (primaryDataUrl) {
    slides = filterToUiSlides(slides)
    console.log(`[render] UI-only mode: ${slides.length} slide(s), code slides removed`)
  }

  return {
    ...working,
    slides,
    appUrl: working.appUrl ?? null,
    hasEmbeddedScreenshots: Boolean(primaryDataUrl),
    renderCaptureError: primaryDataUrl ? null : working.captureError,
  }
}
