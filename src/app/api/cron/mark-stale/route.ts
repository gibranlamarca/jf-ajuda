import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const STALE_AFTER_DAYS = parseInt(process.env.STALE_AFTER_DAYS || '7')
const VOLUNTEER_EXPIRES_HOURS = 4

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const staleThreshold = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000)
  const volunteerThreshold = new Date(Date.now() - VOLUNTEER_EXPIRES_HOURS * 60 * 60 * 1000)

  const [staleResult, volunteersResult] = await Promise.all([
    prisma.request.updateMany({
      where: { status: 'OPEN', updatedAt: { lt: staleThreshold } },
      data: { status: 'STALE' },
    }),
    prisma.volunteer.deleteMany({
      where: { createdAt: { lt: volunteerThreshold } },
    }),
  ])

  return NextResponse.json({
    markedStale: staleResult.count,
    volunteersDeleted: volunteersResult.count,
  })
}
