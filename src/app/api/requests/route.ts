import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createRequestSchema } from '@/lib/validations'
import { generateToken, hashToken } from '@/lib/token'
import { checkRateLimit } from '@/lib/rateLimit'
import type { Prisma } from '@prisma/client'

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  const status = sp.get('status') || undefined
  const typesParam = sp.get('types')
  const types = typesParam ? typesParam.split(',').filter(Boolean) : undefined
  const urgencyMin = sp.get('urgencyMin') ? parseInt(sp.get('urgencyMin')!) : undefined
  const urgencyMax = sp.get('urgencyMax') ? parseInt(sp.get('urgencyMax')!) : undefined
  const neighborhood = sp.get('neighborhood') || undefined
  const q = sp.get('q') || undefined
  const page = Math.max(1, parseInt(sp.get('page') || '1'))
  const pageSize = Math.min(200, Math.max(1, parseInt(sp.get('pageSize') || '20')))

  // Build WHERE conditions using AND array for composability
  const conditions: Prisma.RequestWhereInput[] = []

  if (status && ['OPEN', 'RESOLVED'].includes(status)) {
    conditions.push({ status })
  }
  if (urgencyMin !== undefined && !isNaN(urgencyMin)) {
    conditions.push({ urgency: { gte: urgencyMin } })
  }
  if (urgencyMax !== undefined && !isNaN(urgencyMax)) {
    conditions.push({ urgency: { lte: urgencyMax } })
  }
  if (neighborhood) {
    conditions.push({ neighborhood: { contains: neighborhood } })
  }
  if (q) {
    conditions.push({
      OR: [{ title: { contains: q } }, { description: { contains: q } }],
    })
  }
  // Types: search for each type name as JSON substring
  if (types && types.length > 0) {
    conditions.push({
      OR: types.map((t) => ({ helpTypes: { contains: `"${t}"` } })),
    })
  }

  const where: Prisma.RequestWhereInput = conditions.length > 0 ? { AND: conditions } : {}

  const [total, rows] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
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
        resolvedByMethod: true,
        reportsCount: true,
        confirmationsCount: true,
        commentsCount: true,
        // Never include resolutionTokenHash
      },
    }),
  ])

  const data = rows.map((r) => ({
    ...r,
    helpTypes: JSON.parse(r.helpTypes) as string[],
    contactPhone: r.contactPhone ?? null,
  }))

  return NextResponse.json(
    { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    { status: 200 },
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  // Rate limiting
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

  const parsed = createRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { _hp: _honeypot, ...data } = parsed.data

  const token = generateToken()
  const tokenHash = hashToken(token)

  const created = await prisma.request.create({
    data: {
      title: data.title,
      description: data.description,
      helpTypes: JSON.stringify(data.helpTypes),
      urgency: data.urgency,
      neighborhood: data.neighborhood,
      lat: data.lat,
      lng: data.lng,
      addressLabel: data.addressLabel || null,
      contactName: data.contactName || null,
      contactPhone: data.contactPhone || null,
      resolutionTokenHash: tokenHash,
    },
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
      reportsCount: true,
      confirmationsCount: true,
    },
  })

  return NextResponse.json(
    {
      ...created,
      helpTypes: data.helpTypes,
      token, // ⚠️ Only returned once — creator must save this
    },
    { status: 201 },
  )
}

