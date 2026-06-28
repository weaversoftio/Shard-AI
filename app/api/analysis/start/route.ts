import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn } from 'child_process'
import { join } from 'path'
import { tmpdir } from 'os'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  const gender    = req.nextUrl.searchParams.get('gender') ?? 'other'
  if (!sessionId) return new Response('Missing sessionId', { status: 400 })

  const sessionDir = join(tmpdir(), 'shard-ai', sessionId)
  const normDir    = join(sessionDir, 'lined', 'normalized')
  const scriptPath = join(process.cwd(), 'scripts', 'feature_extraction.py')

  if (!existsSync(normDir)) {
    return new Response('Normalized crops not found', { status: 400 })
  }

  const encoder = new TextEncoder()

  let proc: ReturnType<typeof spawn> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const pythonBin = process.env.PYTHON_BIN ?? 'python3'
      proc = spawn(pythonBin, [scriptPath, '--session-dir', sessionDir, '--gender', gender], {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      })

      let buffer = ''

      proc.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.trim()) {
            controller.enqueue(encoder.encode(`data: ${line}\n\n`))
          }
        }
      })

      proc.stderr?.on('data', (chunk: Buffer) => {
        console.error('[feature_extraction]', chunk.toString())
      })

      proc.on('close', (code: number | null) => {
        if (buffer.trim()) {
          controller.enqueue(encoder.encode(`data: ${buffer.trim()}\n\n`))
        }
        if (code !== 0 && code !== null) {
          const errEvent = JSON.stringify({ stage: 'error', message: `Process exited with code ${code}` })
          controller.enqueue(encoder.encode(`data: ${errEvent}\n\n`))
        }
        controller.close()
      })

      proc.on('error', (err: Error) => {
        const errEvent = JSON.stringify({ stage: 'error', message: err.message })
        controller.enqueue(encoder.encode(`data: ${errEvent}\n\n`))
        controller.close()
      })
    },

    cancel() {
      proc?.kill()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
