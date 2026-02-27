import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'
import crypto from 'crypto'

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'jfajuda-salt').digest('hex')
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true, status: true },
  })

  if (!req) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  if (req.status === 'RESOLVED') {
    return NextResponse.json(
      { error: 'Este pedido já foi resolvido.' },
      { status: 400 },
    )
  }

  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde alguns minutos antes de tentar novamente.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.retryAfter) },
      },
    )
  }

  const ipHash = hashIp(ip)

  try {
    await prisma.volunteer.create({
      data: { requestId: id, ipHash },
    })
  } catch {
    // Unique constraint violation — already registered from this IP
    return NextResponse.json(
      { error: 'Você já registrou que está a caminho.' },
      { status: 409 },
    )
  }

  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
  const activeCount = await prisma.volunteer.count({
    where: { requestId: id, createdAt: { gte: fourHoursAgo } },
  })

  return NextResponse.json({ activeCount }, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!req) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
  const activeCount = await prisma.volunteer.count({
    where: { requestId: id, createdAt: { gte: fourHoursAgo } },
  })

  return NextResponse.json({ activeCount })
}
