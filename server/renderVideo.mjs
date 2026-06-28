import { mkdir } from 'fs/promises'
import { join } from 'path'
import { RENDERS_DIR } from './paths.mjs'
import { prepareScriptForCapture } from './prepareScriptForCapture.mjs'
import { generateSlideHtml } from './generateSlideHtml.mjs'
import { captureAllSlideFrames } from './captureSlideFrames.mjs'
import { recordAppClip } from './recordAppClip.mjs'
import {
  cleanupFrames,
  concatVideoFiles,
  convertToMp4,
  encodeFramesToVideo,
} from './encodeVideo.mjs'

function isUiScreenshotSlide(slide) {
  const type = slide.visual?.type
  return type === 'app-screenshot' || type === 'image'
}

async function renderIntroSlides(slides, framesDir, renderDir, generateHtml) {
  if (!slides.length) return null

  const frameCount = await captureAllSlideFrames(slides, framesDir, generateHtml)
  const introPath = join(renderDir, 'intro.mp4')
  await encodeFramesToVideo(framesDir, introPath, frameCount)
  await cleanupFrames(framesDir)
  return introPath
}

async function renderWithLiveAppClip(prepared, renderDir, generateHtml) {
  const appUrl = prepared.appUrl
  const clipDir = join(renderDir, 'app-clip')
  const framesDir = join(renderDir, 'frames')

  console.log(`[render] Recording live app video from ${appUrl}`)
  const webmPath = await recordAppClip(appUrl, clipDir, 12)
  if (!webmPath) {
    throw new Error('App screen recording failed')
  }

  const appSegmentPath = join(renderDir, 'app-segment.mp4')
  await convertToMp4(webmPath, appSegmentPath)

  const introSlides = prepared.slides.filter((s) => !isUiScreenshotSlide(s))
  const segments = []

  if (introSlides.length) {
    const introPath = await renderIntroSlides(introSlides, framesDir, renderDir, generateHtml)
    if (introPath) segments.push(introPath)
  }

  segments.push(appSegmentPath)

  const outPath = join(renderDir, 'video.mp4')
  if (segments.length === 1) {
    await convertToMp4(appSegmentPath, outPath)
  } else {
    await concatVideoFiles(segments, outPath, renderDir)
  }

  return outPath
}

export async function renderVideo(script, apiPort) {
  const renderId = `render-${Date.now()}`
  const renderDir = join(RENDERS_DIR, renderId)
  const framesDir = join(renderDir, 'frames')
  await mkdir(renderDir, { recursive: true })

  const prepared = await prepareScriptForCapture(script, apiPort)
  const slides = prepared.slides ?? []

  if (!slides.length) {
    throw new Error('script has no slides')
  }

  const generateHtml = (slide, slideIndex, totalSlides) =>
    generateSlideHtml(slide, slideIndex, totalSlides, prepared)

  const canRecordLiveApp = Boolean(prepared.appUrl)

  let outPath

  if (canRecordLiveApp) {
    try {
      console.log('[render] Using live app screen recording for UI section')
      outPath = await renderWithLiveAppClip(prepared, renderDir, generateHtml)
    } catch (err) {
      console.warn('[render] Live app recording failed, falling back to slide frames:', err.message)
      outPath = null
    }
  }

  if (!outPath) {
    if (prepared.hasEmbeddedScreenshots) {
      console.log('[render] Embedded app screenshots into slide HTML')
    } else {
      console.warn('[render] No app UI available — export will show title/code slides only')
    }

    console.log(`[render] Capturing ${slides.length} slide(s) with Playwright…`)
    const frameCount = await captureAllSlideFrames(slides, framesDir, generateHtml)
    outPath = join(renderDir, 'video.mp4')
    console.log(`[render] Encoding ${frameCount} frames with ffmpeg…`)
    await encodeFramesToVideo(framesDir, outPath, frameCount)
    await cleanupFrames(framesDir)
  }

  console.log(`[render] Done: ${outPath}`)

  return {
    renderId,
    videoPath: outPath,
    videoUrl: `/renders/${renderId}/video.mp4`,
  }
}
