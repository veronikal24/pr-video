import {
  fileDisplayName,
  isComponentFile,
  isUIFile,
  pickHighlightLines,
  summarizePatch,
} from './prFiles'
import { prepareComponentPreview } from './prepareComponentPreview'

const SKIP_TITLE_PATTERNS = /^(fix|chore|docs|test|ci|build)(\(|:|\s)/i

function inferTone(pr) {
  if (/feat|add|new|launch|ship/i.test(pr.title)) return 'celebratory'
  if (/refactor|perf|arch/i.test(pr.title)) return 'technical'
  if (/fix|patch|bug/i.test(pr.title)) return 'minimal'
  return 'informational'
}

function inferConfidence(pr, componentCount) {
  if (SKIP_TITLE_PATTERNS.test(pr.title)) return 0.25
  if (componentCount > 0) return 0.88
  if (/feat|add|new|launch/i.test(pr.title)) return 0.65
  return 0.4
}

function inferSkipReason(confidence, componentCount) {
  if (confidence >= 0.4) return null
  if (componentCount === 0) {
    return 'No React component files changed in this PR'
  }
  return 'Low-signal PR — review before sharing'
}

function buildHashtags(pr) {
  const [owner] = pr.repo.split('/')
  const titleWord = pr.title.split(/\s+/).find((w) => w.length > 4)?.toLowerCase()
  const tags = ['opensource', owner?.toLowerCase(), 'devtools']
  if (titleWord) tags.push(titleWord.replace(/[^a-z0-9]/gi, ''))
  return [...new Set(tags.filter(Boolean))].slice(0, 4)
}

function slideFromComponent(comp, index) {
  const prepared = prepareComponentPreview(comp.source, comp.filename)
  const name = fileDisplayName(comp.filename)

  return {
    id: `component-${index}`,
    tag: comp.status === 'added' ? 'New component' : 'Updated component',
    headline: name,
    body: `${comp.filename} · ${summarizePatch(comp.patch)}`,
    visual: {
      type: 'component-preview',
      filename: comp.filename,
      previewCode: prepared.previewCode,
      canPreview: prepared.canPreview,
      componentName: prepared.componentName,
      previewError: prepared.error,
      highlightLines: pickHighlightLines(comp.patch),
      status: comp.status,
      patch: comp.patch,
    },
  }
}

function slideFromFile(file, index) {
  const name = fileDisplayName(file.filename)

  return {
    id: `change-${index}`,
    tag: file.status === 'added' ? 'New' : file.status === 'removed' ? 'Removed' : 'Changed',
    headline: name,
    body: `${file.filename} · ${summarizePatch(file.patch)}`,
    visual: {
      type: 'code-change',
      filename: file.filename,
      patch: file.patch,
      status: file.status,
      highlightLines: pickHighlightLines(file.patch),
      isComponent: isComponentFile(file.filename),
    },
  }
}

function buildSlides(pr, componentSources) {
  const slides = []
  const loadedComponents = componentSources.filter((c) => c.source)
  const uiFiles = (pr.files ?? []).filter((f) => isUIFile(f.filename))
  const nonComponentUi = uiFiles.filter((f) => !isComponentFile(f.filename)).slice(0, 2)

  slides.push({
    id: 'hero',
    tag: 'Release',
    headline: pr.title,
    body: `PR #${pr.number} by @${pr.author} · ${pr.repo}`,
    visual: { type: 'hero' },
  })

  for (const [i, comp] of loadedComponents.entries()) {
    slides.push(slideFromComponent(comp, i))
  }

  for (const [i, file] of nonComponentUi.entries()) {
    slides.push(slideFromFile(file, i))
  }

  if (slides.length === 1) {
    slides.push({
      id: 'fallback',
      tag: 'Note',
      headline: 'No React components in this PR',
      body: 'This PR has no .tsx/.jsx changes to render.',
      visual: {
        type: 'code-change',
        filename: pr.url,
        patch: null,
        status: 'modified',
        highlightLines: [],
      },
    })
  }

  return slides
}

export function buildScriptFromPR(pr, { componentSources = [] } = {}) {
  const uiFiles = (pr.files ?? []).filter(isUIFile)
  const loadedComponents = componentSources.filter((c) => c.source)
  const confidence = inferConfidence(pr, loadedComponents.length)
  const slides = buildSlides(pr, componentSources)
  const tone = inferTone(pr)

  return {
    hook: pr.title,
    slides,
    componentSources,
    changedFiles: pr.files ?? [],
    uiFileCount: uiFiles.length,
    componentCount: loadedComponents.length,
    caption: `${pr.title} — ${pr.repo} PR #${pr.number} by @${pr.author}`,
    hashtags: buildHashtags(pr),
    tone,
    confidence,
    skip_reason: inferSkipReason(confidence, loadedComponents.length),
  }
}
