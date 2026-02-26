export interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address?: {
    road?: string
    neighbourhood?: string
    suburb?: string
    city_district?: string
    district?: string
    city?: string
    town?: string
    state?: string
    postcode?: string
  }
}

// Simple in-memory LRU cache
const cache = new Map<string, NominatimResult[]>()
const MAX_CACHE_SIZE = 100

function cacheSet(key: string, value: NominatimResult[]) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, value)
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'jf-ajuda/1.0 (contato@jfajuda.com.br)'

async function nominatimFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    // next: { revalidate: 60 }, // optional ISR caching
  })
  if (!res.ok) throw new Error(`Nominatim error: ${res.status} ${res.statusText}`)
  return res.json()
}

/** Search for an address, scoped to Juiz de Fora, MG, Brazil */
export async function searchAddress(query: string): Promise<NominatimResult[]> {
  const normalizedQuery = query.trim().toLowerCase()
  const cacheKey = `search:${normalizedQuery}`

  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  const url = new URL(`${NOMINATIM_BASE}/search`)
  url.searchParams.set('q', `${query}, Juiz de Fora, MG, Brasil`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')

  const results = await nominatimFetch<NominatimResult[]>(url.toString())
  cacheSet(cacheKey, results)
  return results
}

/** Reverse geocode lat/lng to an address */
export async function reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
  const cacheKey = `reverse:${lat.toFixed(4)},${lng.toFixed(4)}`

  if (cache.has(cacheKey)) return cache.get(cacheKey)?.[0] ?? null

  const url = new URL(`${NOMINATIM_BASE}/reverse`)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')

  try {
    const result = await nominatimFetch<NominatimResult>(url.toString())
    cacheSet(cacheKey, [result])
    return result
  } catch {
    return null
  }
}

/** Extract the most specific neighborhood name from a Nominatim address */
export function extractNeighborhood(result: NominatimResult): string {
  const a = result.address
  if (!a) return ''
  return a.neighbourhood || a.suburb || a.city_district || a.district || ''
}
