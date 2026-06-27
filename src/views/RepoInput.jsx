import { useState } from 'react'
import { fetchLatestOpenPR } from '../lib/fetchPR'
import { fetchComponentSources } from '../lib/fetchComponentSources'
import { buildScriptFromPR } from '../lib/buildScriptFromPR'

export default function RepoInput({ onFetched }) {
  const [repoUrl, setRepoUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!repoUrl.trim()) {
      setError('GitHub repo URL is required')
      return
    }

    setError(null)

    try {
      setStatus('fetching')
      const pr = await fetchLatestOpenPR(repoUrl.trim())

      setStatus('loading-components')
      const componentSources = await fetchComponentSources(pr)

      setStatus('building')
      const script = buildScriptFromPR(pr, { componentSources })

      onFetched({ pr, script })
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const loading = ['fetching', 'loading-components', 'building'].includes(status)

  return (
    <div className="view-center">
      <div className="input-card input-card-wide">
        <h1 className="input-title">Turn your PR into a video</h1>
        <p className="input-sub">
          Paste a GitHub repo. We load changed React components from the PR and render them live in the video.
        </p>

        <label className="field-label">GitHub repo</label>
        <input
          className="repo-input repo-input-full"
          type="url"
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
          disabled={loading}
        />

        <button
          className="btn-primary input-submit-btn"
          onClick={handleSubmit}
          disabled={loading || !repoUrl.trim()}
        >
          {loading ? '...' : 'Generate'}
        </button>

        {status === 'fetching'            && <p className="status-msg">Fetching PR and changed files…</p>}
        {status === 'loading-components'  && <p className="status-msg">Loading component source from GitHub…</p>}
        {status === 'building'            && <p className="status-msg">Preparing component previews…</p>}
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  )
}
