import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import RequestDetail from './RequestDetail'
import type { HelpRequest, Comment } from '@/types'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getRequest(id: string): Promise<HelpRequest | null> {
  try {
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
        // Never expose resolutionTokenHash
      },
    })

    if (!req) return null

    return {
      ...req,
      helpTypes: JSON.parse(req.helpTypes) as HelpRequest['helpTypes'],
      status: req.status as 'OPEN' | 'RESOLVED',
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      resolvedAt: req.resolvedAt?.toISOString() ?? null,
      // Partially mask phone for display
      contactPhone: req.contactPhone ? maskPhone(req.contactPhone) : null,
    }
  } catch {
    return null
  }
}

async function getComments(requestId: string): Promise<Comment[]> {
  try {
    const comments = await prisma.comment.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, content: true, createdAt: true },
    })
    return comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))
  } catch {
    return []
  }
}

function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone
  const visible = phone.slice(0, 7)
  const rest = phone.slice(7)
  return visible + rest.replace(/\d/g, '*')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const req = await getRequest(id)
  if (!req) return { title: 'Pedido não encontrado — JF Ajuda' }
  return {
    title: `${req.title} — JF Ajuda`,
    description: req.description.slice(0, 155),
  }
}

export default async function RequestPage({ params }: PageProps) {
  const { id } = await params
  const [request, initialComments] = await Promise.all([getRequest(id), getComments(id)])

  if (!request) {
    notFound()
  }

  return <RequestDetail request={request} initialComments={initialComments} />
}
