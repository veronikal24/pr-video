import { capturePagePreview, resolveAppUrl } from './capturePagePreview'
import { captureFromLocalRepo, checkLocalServer } from './captureLocalApp'
import { captureAppScreenshots } from './captureAppScreenshot'

export async function captureUIScreenshots(pr) {
  const previewUrl = resolveAppUrl(null, pr)
  const apiUp = await checkLocalServer()

  try {
    if (previewUrl) {
      if (apiUp) {
        try {
          const result = await capturePagePreview(previewUrl)
          if (result.screenshots?.length) {
            return {
              screenshots: result.screenshots,
              captureMode: 'preview',
              appUrl: result.appUrl ?? previewUrl,
              jobId: result.jobId ?? null,
              error: null,
            }
          }
        } catch (err) {
          console.warn('[captureUIScreenshots] Local preview screenshot failed:', err.message)
        }
      }

      try {
        const { appUrl, screenshots } = await captureAppScreenshots(previewUrl)
        if (screenshots?.length) {
          return {
            screenshots,
            captureMode: 'preview-remote',
            appUrl,
            jobId: null,
            error: null,
          }
        }
      } catch (err) {
        console.warn('[captureUIScreenshots] Remote preview screenshot failed:', err.message)
      }
    }

    if (!apiUp) {
      if (previewUrl) {
        try {
          const { appUrl, screenshots } = await captureAppScreenshots(previewUrl)
          if (screenshots?.length) {
            return {
              screenshots,
              captureMode: 'preview-remote',
              appUrl,
              jobId: null,
              error: null,
            }
          }
        } catch {
          // fall through to error below
        }
      }
      return {
        screenshots: [],
        captureMode: null,
        appUrl: previewUrl,
        jobId: null,
        error: 'Run npm run dev so the server can capture app UI (or add a deploy preview URL to the PR)',
      }
    }

    const result = await captureFromLocalRepo(pr)
    return {
      screenshots: result.screenshots ?? [],
      captureMode: result.captureMode ?? 'local-build',
      appUrl: result.appUrl ?? null,
      jobId: result.jobId ?? null,
      error: null,
    }
  } catch (err) {
    return {
      screenshots: [],
      captureMode: previewUrl ? 'preview' : 'local-build',
      appUrl: previewUrl,
      jobId: null,
      error: err.message,
    }
  }
}
