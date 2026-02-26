import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveRequestSchema } from '@/lib/validations'
import { verifyToken } from '@/lib/token'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true, status: true, resolutionTokenHash: true, confirmationsCount: true },
  })

  if (!req) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  if (req.status === 'RESOLVED') {
    return NextResponse.json({ error: 'Este pedido já foi resolvido.' }, { status: 409 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const parsed = resolveRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Código inválido.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { token } = parsed.data

  // Check resolution token
  const tokenValid =
    req.resolutionTokenHash && verifyToken(token, req.resolutionTokenHash)

  if (!tokenValid) {
    return NextResponse.json(
      { error: 'Código de resolução inválido. Verifique e tente novamente.' },
      { status: 403 },
    )
  }

  const updated = await prisma.request.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedByMethod: 'TOKEN',
    },
    select: {
      id: true,
      title: true,
      status: true,
      resolvedAt: true,
      resolvedByMethod: true,
    },
  })

  return NextResponse.json({ message: 'Pedido marcado como resolvido!', request: updated })
}
