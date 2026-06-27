export async function checkLocalServer() {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

export async function captureFromLocalRepo(pr) {
  const res = await fetch('/api/host-and-capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner: pr.owner,
      repoName: pr.repoName,
      headRef: pr.headRef,
      prNumber: pr.number,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Self-host failed (${res.status})`)
  }

  return res.json()
}

export async function stopLocalSession(jobId) {
  if (!jobId) return
  try {
    await fetch(`/api/stop/${jobId}`, { method: 'POST' })
  } catch {
    // server may already be down
  }
}
