export function resolveScriptForRender(script, apiPort = 4174) {
  if (!script?.slides?.length) return script

  return {
    ...script,
    slides: script.slides.map((slide) => {
      const visual = slide.visual
      if (!visual || (visual.type !== 'app-screenshot' && visual.type !== 'image')) {
        return slide
      }

      let imageUrl = visual.imageUrl

      if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
        return { ...slide, visual: { ...visual, imageUrl } }
      }

      const capturesPath = resolveCapturesHttpUrl(visual, apiPort)
      if (capturesPath) {
        imageUrl = capturesPath
      }

      return {
        ...slide,
        visual: { ...visual, imageUrl },
      }
    }),
  }
}

function resolveCapturesHttpUrl(visual, apiPort) {
  if (visual.imageUrl?.startsWith('/captures/')) {
    return `http://127.0.0.1:${apiPort}${visual.imageUrl}`
  }

  if (visual.filePath) {
    const normalized = visual.filePath.replace(/\\/g, '/')
    const match = normalized.match(/[/\\]captures[/\\](.+)$/)
    if (match) {
      return `http://127.0.0.1:${apiPort}/captures/${match[1]}`
    }
  }

  return null
}
