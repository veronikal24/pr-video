import { execFile as execFileCb, spawn } from 'child_process'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'
import getPort from 'get-port'
import { chromium } from 'playwright'
import { mkdir, rm } from 'fs/promises'
import { mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { CAPTURES_DIR } from './paths.mjs'
import { sessions } from './sessions.mjs'
import {
  detectPackageManager,
  devCommand,
  ensurePackageManager,
  installCommand,
  resolveInstallRoot,
} from './packageManager.mjs'

const execFile = promisify(execFileCb)

const APP_ROOT_CANDIDATES = [
  '',
  'apps/web',
  'apps/client',
  'apps/app',
  'packages/web',
  'packages/app',
  'client',
  'frontend',
  'web',
]

async function run(cmd, args, options = {}) {
  await execFile(cmd, args, {
    ...options,
    shell: true,
    timeout: options.timeout ?? 300000,
  })
}

async function cloneRepo(workDir, owner, repo, headRef, prNumber) {
  const repoUrl = `https://github.com/${owner}/${repo}.git`

  try {
    await run('git', ['clone', '--depth', '1', '--branch', headRef, repoUrl, workDir])
    return
  } catch {
    await run('git', ['clone', '--depth', '1', repoUrl, workDir])
    await run('git', ['fetch', 'origin', `pull/${prNumber}/head:pr-video-branch`], { cwd: workDir })
    await run('git', ['checkout', 'pr-video-branch'], { cwd: workDir })
  }
}

async function findAppRoot(workDir) {
  for (const candidate of APP_ROOT_CANDIDATES) {
    const dir = join(workDir, candidate)
    try {
      const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
      if (pkg.scripts?.dev || pkg.scripts?.start) {
        return { dir, pkg, relative: candidate }
      }
    } catch {
      // not an app root
    }
  }
  throw new Error('Could not find a package.json with a dev or start script')
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (res.ok || res.status < 500) return
    } catch {
      // still starting
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error(`Dev server did not start within ${timeoutMs / 1000}s`)
}

async function captureScreenshot(url, outputPath) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: outputPath, type: 'png' })
  } finally {
    await browser.close()
  }
}

export async function hostAndCapture({ owner, repoName, headRef, prNumber }) {
  const workDir = await mkdtemp(join(tmpdir(), 'pr-video-'))
  const jobId = `${owner}-${repoName}-pr${prNumber}-${Date.now()}`
  const captureDir = join(CAPTURES_DIR, jobId)
  await mkdir(captureDir, { recursive: true })

  let devProcess = null

  const cleanup = async () => {
    if (devProcess && !devProcess.killed) {
      devProcess.kill('SIGTERM')
      await new Promise((r) => setTimeout(r, 500))
      if (!devProcess.killed) devProcess.kill('SIGKILL')
    }
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }

  try {
    await cloneRepo(workDir, owner, repoName, headRef, prNumber)

    const pm = await detectPackageManager(workDir)
    await ensurePackageManager(pm)

    const { dir: appRoot, pkg } = await findAppRoot(workDir)
    const installRoot = await resolveInstallRoot(workDir, appRoot)
    const { command: installCmd, args: installArgs } = installCommand(pm)

    await run(installCmd, installArgs, { cwd: installRoot, timeout: 600000 })

    const port = await getPort({ port: getPort.makeRange(4321, 4999) })
    const { command, args, env: extraEnv } = devCommand(pm, pkg, port)

    devProcess = spawn(command, args, {
      cwd: appRoot,
      shell: true,
      env: { ...process.env, ...extraEnv, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const appUrl = `http://127.0.0.1:${port}`
    await waitForServer(appUrl)

    const screenshotPath = join(captureDir, 'home.png')
    await captureScreenshot(appUrl, screenshotPath)

    sessions.set(jobId, { appUrl, devProcess, workDir, cleanup })

    return {
      jobId,
      appUrl,
      packageManager: pm,
      screenshots: [
        {
          url: `/captures/${jobId}/home.png`,
          label: 'App home',
          source: `${owner}/${repoName}@${headRef}`,
        },
      ],
    }
  } catch (err) {
    await cleanup()
    throw err
  }
}
