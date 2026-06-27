import { isReactComponentFile } from './prFiles'

function githubHeaders(token) {
  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function fetchRawFile(owner, repo, path, ref, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
    { headers: githubHeaders(token) }
  )

  if (!res.ok) {
    throw new Error(`Could not load ${path} (${res.status})`)
  }

  const data = await res.json()
  if (data.encoding !== 'base64' || !data.content) {
    throw new Error(`Unexpected content format for ${path}`)
  }

  const binary = atob(data.content.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

export async function fetchComponentSources(pr, limit = 4) {
  const token = import.meta.env.VITE_GITHUB_TOKEN
  const components = (pr.files ?? []).filter((f) => isReactComponentFile(f.filename)).slice(0, limit)

  const sources = []
  for (const file of components) {
    try {
      const source = await fetchRawFile(pr.owner, pr.repoName, file.filename, pr.headRef, token)
      sources.push({ ...file, source })
    } catch (err) {
      sources.push({ ...file, source: null, loadError: err.message })
    }
  }

  return sources
}
