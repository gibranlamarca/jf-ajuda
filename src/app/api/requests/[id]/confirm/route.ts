import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

const THRESHOLD = parseInt(process.env.CONFIRMATION_THRESHOLD ?? '3')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true, status: true, confirmationsCount: true },
  })

  if (!req) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  if (req.status === 'RESOLVED') {
    return NextResponse.json({ error: 'Este pedido já foi resolvido.' }, { status: 409 })
  }

  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  // Check if this IP already confirmed
  const existing = await prisma.confirmation.findUnique({
    where: { requestId_ipHash: { requestId: id, ipHash } },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Você já confirmou que ajuda chegou a este pedido.' },
      { status: 409 },
    )
  }

  // Create confirmation and increment counter
  await prisma.confirmation.create({
    data: { requestId: id, ipHash },
  })

  const updated = await prisma.request.update({
    where: { id },
    data: { confirmationsCount: { increment: 1 } },
    select: { id: true, confirmationsCount: true, status: true },
  })

  // Auto-resolve if threshold reached
  if (updated.confirmationsCount >= THRESHOLD) {
    await prisma.request.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByMethod: 'COMMUNITY',
      },
    })

    return NextResponse.json({
      message: `Confirmação registrada! Após ${THRESHOLD} confirmações da comunidade, o pedido foi marcado como resolvido.`,
      confirmationsCount: updated.confirmationsCount,
      autoResolved: true,
    })
  }

  const remaining = THRESHOLD - updated.confirmationsCount
  return NextResponse.json({
    message: `Confirmação registrada. Faltam ${remaining} confirmação(ões) para resolver automaticamente.`,
    confirmationsCount: updated.confirmationsCount,
    autoResolved: false,
  })
}
