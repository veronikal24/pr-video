export async function fetchLatestOpenPR(repoUrl) {
  const token = import.meta.env.VITE_GITHUB_TOKEN
  const pathname = new URL(repoUrl).pathname.replace(/^\//, '').replace(/\/$/, '')
  const [owner, repo] = pathname.split('/')

  if (!owner || !repo) throw new Error('Invalid GitHub URL — expected https://github.com/owner/repo')

  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc&per_page=1`,
    { headers }
  )

  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)

  const pulls = await res.json()
  const open = pulls[0]

  if (!open) throw new Error('No open PRs found in this repo')

  return {
    number:     open.number,
    title:      open.title,
    body:       open.body || '(no description)',
    author:     open.user.login,
    updated_at: open.updated_at,
    url:        open.html_url,
    repo:       `${owner}/${repo}`,
  }
}
