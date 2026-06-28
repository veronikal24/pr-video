import { mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { chromium } from 'playwright'
import { RENDER_HEIGHT, RENDER_WIDTH } from './renderConstants.mjs'

export async function recordAppClip(appUrl, outputDir, durationSec = 10) {
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: RENDER_WIDTH, height: RENDER_HEIGHT },
    recordVideo: {
      dir: outputDir,
      size: { width: RENDER_WIDTH, height: RENDER_HEIGHT },
    },
  })

  try {
    const page = await context.newPage()
    await page.goto(appUrl, { waitUntil: 'load', timeout: 120000 })
    await page.waitForTimeout(Math.max(durationSec, 5) * 1000)
  } finally {
    await context.close()
    await browser.close()
  }

  const files = await readdir(outputDir)
  const webm = files.find((f) => f.endsWith('.webm'))
  return webm ? join(outputDir, webm) : null
}
