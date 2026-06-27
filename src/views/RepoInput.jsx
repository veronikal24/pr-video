import { useState } from 'react'
import { fetchLatestOpenPR } from '../lib/fetchPR'
import { buildScriptFromPR } from '../lib/buildScriptFromPR'

export default function RepoInput({ onFetched }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!url.trim()) return
    setError(null)

    try {
      setStatus('fetching')
      const pr = await fetchLatestOpenPR(url.trim())

      setStatus('building')
      const script = buildScriptFromPR(pr)

      onFetched({ pr, script })
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const loading = status === 'fetching' || status === 'building'

  return (
    <div className="view-center">
      <div className="input-card">
        <h1 className="input-title">Turn your PR into a video</h1>
        <p className="input-sub">Paste a GitHub repo URL. We'll grab the latest open PR and build a Remotion-ready script.</p>

        <div className="input-row">
          <input
            className="repo-input"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
            disabled={loading}
          />
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
          >
            {loading ? '...' : 'Generate'}
          </button>
        </div>

        {status === 'fetching'  && <p className="status-msg">Fetching latest PR from GitHub...</p>}
        {status === 'building' && <p className="status-msg">Building your video script...</p>}
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  )
}
