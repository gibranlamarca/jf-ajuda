import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { reportSchema } from '@/lib/validations'
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
    select: { id: true },
  })

  if (!req) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // body is optional
  }

  const parsed = reportSchema.safeParse(body)
  const reason = parsed.success ? parsed.data.reason : undefined

  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  // Check if this IP already reported this request
  const existing = await prisma.report.findUnique({
    where: { requestId_ipHash: { requestId: id, ipHash } },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Você já reportou este pedido.' },
      { status: 409 },
    )
  }

  await prisma.report.create({
    data: { requestId: id, ipHash, reason: reason || null },
  })

  await prisma.request.update({
    where: { id },
    data: { reportsCount: { increment: 1 } },
  })

  return NextResponse.json({ message: 'Denúncia registrada. Obrigado pelo aviso.' })
}
