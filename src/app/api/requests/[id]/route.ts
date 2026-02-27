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

  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
  const activeVolunteersCount = await prisma.volunteer.count({
    where: { requestId: id, createdAt: { gte: fourHoursAgo } },
  })

  return NextResponse.json({
    ...req,
    helpTypes: JSON.parse(req.helpTypes) as string[],
    contactPhone: req.contactPhone ?? null,
    activeVolunteersCount,
  })
}
