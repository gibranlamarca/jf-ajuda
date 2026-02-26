import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const req = await prisma.request.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      helpTypes: true,
      urgency: true,
      neighborhood: true,
      lat: true,
      lng: true,
      addressLabel: true,
      contactName: true,
      contactPhone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      resolvedReason: true,
      resolvedByMethod: true,
      reportsCount: true,
      confirmationsCount: true,
      commentsCount: true,
      // Never include resolutionTokenHash
    },
  })

  if (!req) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({
    ...req,
    helpTypes: JSON.parse(req.helpTypes) as string[],
    contactPhone: req.contactPhone ? maskPhone(req.contactPhone) : null,
  })
}

function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone
  const visible = phone.slice(0, 7)
  const rest = phone.slice(7)
  return visible + rest.replace(/\d/g, '*')
}
