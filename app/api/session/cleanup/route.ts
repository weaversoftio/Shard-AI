import { NextRequest, NextResponse } from 'next/server'
import { rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const sessionDir = join(tmpdir(), 'shard-ai', sessionId)
  try {
    await rm(sessionDir, { recursive: true, force: true })
  } catch {
    // Directory may not exist yet — not an error
  }

  return NextResponse.json({ ok: true })
}
