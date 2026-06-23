import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir, readdir, rm } from 'fs/promises'
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

  const pdfPath   = join(sessionDir, 'blank.pdf')
  const outputDir = join(sessionDir, 'blank')
  await rm(outputDir, { recursive: true, force: true })
  await writeFile(pdfPath, Buffer.from(await file.arrayBuffer()))

  const result = await runNormalization('blank', pdfPath, outputDir)

  // Attach the column visualization image (blank_COLUMNS.png) for preview
  if (result.status === 'ok') {
    try {
      const allFiles = await readdir(outputDir)
      const cropFiles = allFiles.filter(f => f.endsWith('.png')).sort()
      return NextResponse.json({ ...result, cropFiles })
    } catch { /* output_dir missing */ }
  }

  return NextResponse.json(result)
}
