import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// GET /api/session/image?sessionId=<id>&type=lined|blank&view=normalized|segmentation&file=<name.png>
// type=lined, view=normalized    → lined/normalized/<file>
// type=lined, view=segmentation  → lined/segmentation/<file>
// type=blank  (no view needed)   → blank/<file>
export async function GET(req: NextRequest) {
  const params    = req.nextUrl.searchParams
  const sessionId = params.get('sessionId')
  const type      = params.get('type')   // 'lined' | 'blank'
  const view      = params.get('view')   // 'normalized' | 'segmentation' | null
  const file      = params.get('file')

  if (!sessionId || !type || !file) {
    return new NextResponse('Bad request', { status: 400 })
  }

  // Prevent path traversal
  if (/[/\\]/.test(file) || file.includes('..')) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  let subdir: string
  if (type === 'blank') {
    subdir = 'blank'
  } else {
    subdir = view === 'segmentation' ? 'lined/segmentation' : 'lined/normalized'
  }

  const imagePath = join(tmpdir(), 'shard-ai', sessionId, subdir, file)

  try {
    const data = await readFile(imagePath)
    return new NextResponse(data, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
