import { access, readFile } from 'fs/promises'
import { join } from 'path'
import { execFile as execFileCb } from 'child_process'
import { promisify } from 'util'

const execFile = promisify(execFileCb)

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function hasWorkspaceProtocol(pkg) {
  const blob = JSON.stringify({
    dependencies: pkg.dependencies,
    devDependencies: pkg.devDependencies,
    optionalDependencies: pkg.optionalDependencies,
  })
  return blob.includes('workspace:')
}

export async function detectPackageManager(workDir) {
  if (await exists(join(workDir, 'pnpm-lock.yaml'))) return 'pnpm'
  if (await exists(join(workDir, 'pnpm-workspace.yaml'))) return 'pnpm'
  if (await exists(join(workDir, 'bun.lockb'))) return 'bun'
  if (await exists(join(workDir, 'yarn.lock'))) return 'yarn'

  try {
    const pkg = JSON.parse(await readFile(join(workDir, 'package.json'), 'utf8'))
    const pm = pkg.packageManager ?? ''
    if (pm.startsWith('pnpm@')) return 'pnpm'
    if (pm.startsWith('yarn@')) return 'yarn'
    if (pm.startsWith('bun@')) return 'bun'
    if (pkg.workspaces) return 'pnpm'
    if (hasWorkspaceProtocol(pkg)) return 'pnpm'
  } catch {
    // no root package.json
  }

  return 'npm'
}

export async function resolveInstallRoot(workDir, appRoot) {
  if (appRoot === workDir) return workDir

  if (await exists(join(workDir, 'pnpm-workspace.yaml'))) return workDir

  try {
    const rootPkg = JSON.parse(await readFile(join(workDir, 'package.json'), 'utf8'))
    if (rootPkg.workspaces) return workDir
    if (hasWorkspaceProtocol(rootPkg)) return workDir
  } catch {
    // single-package repo
  }

  return appRoot
}

async function run(cmd, args, options = {}) {
  await execFile(cmd, args, {
    ...options,
    shell: true,
    timeout: options.timeout ?? 300000,
  })
}

export async function ensurePackageManager(pm) {
  try {
    await run(pm, ['--version'], { timeout: 15000 })
    return
  } catch {
    // try corepack for pnpm/yarn
  }

  if (pm === 'pnpm' || pm === 'yarn') {
    try {
      await run('corepack', ['enable'], { timeout: 30000 })
      const prepare =
        pm === 'pnpm'
          ? ['corepack', 'prepare', 'pnpm@9', '--activate']
          : ['corepack', 'prepare', 'yarn@stable', '--activate']
      await run(prepare[0], prepare.slice(1), { timeout: 120000 })
      await run(pm, ['--version'], { timeout: 15000 })
      return
    } catch {
      // fall through
    }
  }

  if (pm === 'pnpm') {
    await run('npm', ['install', '-g', 'pnpm'], { timeout: 180000 })
    return
  }

  throw new Error(
    `${pm} is required for this repo (workspace/monorepo). Install ${pm} or use the optional hosted URL fallback.`
  )
}

export function installCommand(pm) {
  switch (pm) {
    case 'pnpm':
      return { command: 'pnpm', args: ['install'] }
    case 'yarn':
      return { command: 'yarn', args: ['install'] }
    case 'bun':
      return { command: 'bun', args: ['install'] }
    default:
      return { command: 'npm', args: ['install'] }
  }
}

export function devCommand(pm, pkg, port) {
  const devScript = pkg.scripts?.dev ?? ''
  const viteLike = /vite|next|astro|webpack/.test(devScript)
  const portArgs = viteLike
    ? ['--', '--host', '127.0.0.1', '--port', String(port)]
  : []

  switch (pm) {
    case 'pnpm':
      return {
        command: 'pnpm',
        args: pkg.scripts?.dev ? ['run', 'dev', ...portArgs] : ['run', 'start'],
        env: viteLike ? {} : { PORT: String(port), BROWSER: 'none' },
      }
    case 'yarn':
      return {
        command: 'yarn',
        args: pkg.scripts?.dev
          ? viteLike
            ? ['dev', '--host', '127.0.0.1', '--port', String(port)]
            : ['dev']
          : ['start'],
        env: viteLike ? {} : { PORT: String(port), BROWSER: 'none' },
      }
    case 'bun':
      return {
        command: 'bun',
        args: pkg.scripts?.dev ? ['run', 'dev', ...portArgs] : ['run', 'start'],
        env: viteLike ? {} : { PORT: String(port), BROWSER: 'none' },
      }
    default:
      return {
        command: 'npm',
        args: pkg.scripts?.dev ? ['run', 'dev', ...portArgs] : ['run', 'start'],
        env: viteLike ? {} : { PORT: String(port), BROWSER: 'none' },
      }
  }
}
