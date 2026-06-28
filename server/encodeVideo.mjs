import { rm, writeFile } from 'fs/promises'
import { join } from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { RENDER_FPS } from './renderConstants.mjs'

ffmpeg.setFfmpegPath(ffmpegStatic)

export function encodeFramesToVideo(framesDir, outputPath, frameCount) {
  const inputPattern = join(framesDir, 'frame-%06d.png')

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPattern)
      .inputFPS(RENDER_FPS)
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-frames:v',
        String(frameCount),
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  })
}

export function convertToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-an', '-r', String(RENDER_FPS)])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  })
}

export async function concatVideoFiles(segmentPaths, outputPath, workDir) {
  const listPath = join(workDir, 'concat-list.txt')
  const listContent = segmentPaths
    .map((p) => `file '${p.replace(/\\/g, '/')}'`)
    .join('\n')
  await writeFile(listPath, listContent)

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c:v libx264', '-pix_fmt yuv420p'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  })
}

export async function cleanupFrames(framesDir) {
  await rm(framesDir, { recursive: true, force: true }).catch(() => {})
}
