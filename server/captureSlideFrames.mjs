import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { chromium } from 'playwright'
import { RENDER_FPS, RENDER_HEIGHT, RENDER_WIDTH, slideDurationFrames } from './renderConstants.mjs'

export async function captureAllSlideFrames(slides, framesDir, generateHtml) {
  await mkdir(framesDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  let globalFrame = 0
  const frameIntervalMs = Math.round(1000 / RENDER_FPS)

  try {
    const page = await browser.newPage({
      viewport: { width: RENDER_WIDTH, height: RENDER_HEIGHT },
    })

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      const html = await generateHtml(slide, i, slides.length)
      const htmlPath = join(framesDir, `slide-${i}.html`)
      await writeFile(htmlPath, html, 'utf8')

      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load', timeout: 60000 })

      await page
        .waitForFunction(
          () => {
            const img = document.querySelector('img[data-slide-image]')
            if (!img) return true
            return img.complete && img.naturalWidth > 0
          },
          { timeout: 15000 }
        )
        .catch(() => {})

      const durationFrames = slideDurationFrames(slide)

      for (let f = 0; f < durationFrames; f++) {
        const framePath = join(
          framesDir,
          `frame-${String(globalFrame).padStart(6, '0')}.png`
        )
        await page.screenshot({ path: framePath, type: 'png' })
        globalFrame++
        if (f < durationFrames - 1) {
          await page.waitForTimeout(frameIntervalMs)
        }
      }
    }
  } finally {
    await browser.close()
  }

  return globalFrame
}
