import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createCommentSchema } from '@/lib/validations'
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

  const comments = await prisma.comment.findMany({
    where: { requestId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, content: true, createdAt: true },
  })

  const data = comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))

  return NextResponse.json({ data, total: data.length })
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
      { error: 'Não é possível comentar em um pedido já resolvido.' },
      { status: 403 },
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  // Honeypot check
  if (typeof body === 'object' && body !== null && '_hp' in body && (body as { _hp: string })._hp) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { content } = parsed.data
  const ipHash = hashIp(ip)

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { requestId: id, content, ipHash },
      select: { id: true, content: true, createdAt: true },
    }),
    prisma.request.update({
      where: { id },
      data: { commentsCount: { increment: 1 } },
    }),
  ])

  return NextResponse.json(
    { ...comment, createdAt: comment.createdAt.toISOString() },
    { status: 201 },
  )
}
