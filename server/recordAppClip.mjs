import { mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { chromium } from 'playwright'
import { RENDER_HEIGHT, RENDER_WIDTH } from './renderConstants.mjs'

export async function recordAppClip(appUrl, outputDir, durationSec = 8) {
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
    await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(Math.min(Math.max(durationSec, 4), 10) * 1000)
  } finally {
    await context.close()
    await browser.close()
  }

  const files = await readdir(outputDir)
  const webm = files.find((f) => f.endsWith('.webm'))
  return webm ? join(outputDir, webm) : null
}
