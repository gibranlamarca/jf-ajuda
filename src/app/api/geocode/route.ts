import { NextRequest, NextResponse } from 'next/server'
import { searchAddress } from '@/lib/nominatim'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')

  if (!q || q.trim().length < 3) {
    return NextResponse.json([])
  }

  try {
    const results = await searchAddress(q.trim())
    return NextResponse.json(results)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Erro ao buscar endereço.' }, { status: 500 })
  }
}
