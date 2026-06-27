import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { hostAndCapture } from './hostAndCapture.mjs'
import { CAPTURES_DIR, ensureCapturesDir, stopSession, stopAllSessions } from './paths.mjs'

const PORT = Number(process.env.PR_VIDEO_API_PORT) || 4174

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.use('/captures', express.static(CAPTURES_DIR))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/host-and-capture', async (req, res) => {
  const { owner, repoName, headRef, prNumber } = req.body ?? {}

  if (!owner || !repoName || !headRef || !prNumber) {
    res.status(400).json({ message: 'owner, repoName, headRef, and prNumber are required' })
    return
  }

  try {
    const result = await hostAndCapture({ owner, repoName, headRef, prNumber })
    res.json(result)
  } catch (err) {
    console.error('[host-and-capture]', err)
    res.status(500).json({
      message: err.message || 'Failed to self-host and capture screenshots',
    })
  }
})

app.post('/api/stop/:jobId', async (req, res) => {
  const stopped = await stopSession(req.params.jobId)
  res.json({ stopped })
})

await ensureCapturesDir()

const server = app.listen(PORT, () => {
  console.log(`[pr-video] API server http://127.0.0.1:${PORT}`)
})

server.requestTimeout = 600000
server.headersTimeout = 600000

process.on('SIGINT', async () => {
  await stopAllSessions()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await stopAllSessions()
  process.exit(0)
})
