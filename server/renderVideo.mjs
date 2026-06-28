import { execFile as execFileCb } from 'child_process'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'
import { ROOT, RENDERS_DIR } from './paths.mjs'
import { resolveScriptForRender } from './resolveScriptForRender.mjs'

const execFile = promisify(execFileCb)

export async function renderVideo(script, apiPort) {
  const renderId = `render-${Date.now()}`
  const renderDir = join(RENDERS_DIR, renderId)
  await mkdir(renderDir, { recursive: true })

  const resolvedScript = resolveScriptForRender(script, apiPort)
  const propsPath = join(renderDir, 'props.json')
  await writeFile(propsPath, JSON.stringify({ script: resolvedScript }))

  const outPath = join(renderDir, 'video.mp4')

  console.log(
    `[render] Remotion: ${resolvedScript.slides?.length ?? 0} slides`,
    resolvedScript.hasScreenshots ? '(with screenshots + code)' : ''
  )

  await execFile(
    'npx',
    [
      'remotion',
      'render',
      'src/remotion/index.jsx',
      'PRVideo',
      outPath,
      `--props=${propsPath}`,
    ],
    {
      cwd: ROOT,
      shell: true,
      timeout: 600000,
      env: { ...process.env, NODE_ENV: 'production' },
    }
  )

  console.log(`[render] Done: ${outPath}`)

  return {
    renderId,
    videoPath: outPath,
    videoUrl: `/renders/${renderId}/video.mp4`,
  }
}
