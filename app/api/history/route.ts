import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { upsertUser, insertReport, getUserReports } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reports = getUserReports(session.user.email)
  return NextResponse.json(reports)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reportTitle, snapshotData } = await req.json()

  upsertUser(session.user.email, session.user.name, session.user.image)
  const id = insertReport(session.user.email, reportTitle, snapshotData)

  return NextResponse.json({ id })
}
