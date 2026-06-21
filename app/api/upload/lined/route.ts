import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { runNormalization } from '@/lib/normalize'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file      = formData.get('file') as File | null
  const sessionId = formData.get('sessionId') as string | null

  if (!file || !sessionId) {
    return NextResponse.json({ error: 'Missing file or sessionId' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ status: 'error', error_type: 'INVALID_TYPE' })
  }

  const sessionDir = join(tmpdir(), 'shard-ai', sessionId)
  await mkdir(sessionDir, { recursive: true })

  const pdfPath   = join(sessionDir, 'lined.pdf')
  const outputDir = join(sessionDir, 'lined')
  await writeFile(pdfPath, Buffer.from(await file.arrayBuffer()))

  const result = await runNormalization('lined', pdfPath, outputDir)

  // Attach sorted crop filenames for both the normalized and segmentation previews
  if (result.status === 'ok' || result.status === 'warning') {
    try {
      const normDir = join(outputDir, 'normalized')
      const allFiles = await readdir(normDir)
      const cropFiles = allFiles
        .filter(f => f.endsWith('.png'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      // segmentation/ always has the same filenames as normalized/
      return NextResponse.json({ ...result, cropFiles })
    } catch { /* norm_dir missing — return result without preview */ }
  }

  return NextResponse.json(result)
}
