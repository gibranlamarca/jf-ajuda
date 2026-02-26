export const HELP_TYPES = [
  'Alimentos',
  'Água',
  'Roupas',
  'Remédios',
  'Voluntários',
  'Abrigo',
  'Resgate',
  'Higiene',
  'Ração para animais',
  'Outros',
] as const

export type HelpType = (typeof HELP_TYPES)[number]

export type RequestStatus = 'OPEN' | 'RESOLVED'

export interface HelpRequest {
  id: string
  title: string
  description: string
  helpTypes: HelpType[]
  urgency: number
  neighborhood: string
  lat: number
  lng: number
  addressLabel?: string | null
  contactName?: string | null
  contactPhone?: string | null
  status: RequestStatus
  createdAt: string
  updatedAt: string
  resolvedAt?: string | null
  resolvedReason?: string | null
  resolvedByMethod?: string | null
  reportsCount: number
  confirmationsCount: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Filters {
  status?: string
  types?: string[]
  urgencyMin?: number
  urgencyMax?: number
  neighborhood?: string
  q?: string
  page?: number
  pageSize?: number
}

export const URGENCY_CONFIG: Record<
  number,
  { label: string; color: string; dot: string; badge: string }
> = {
  1: {
    label: 'Muito Baixa',
    color: '#94a3b8',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700',
  },
  2: {
    label: 'Baixa',
    color: '#60a5fa',
    dot: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700',
  },
  3: {
    label: 'Média',
    color: '#fbbf24',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  4: {
    label: 'Alta',
    color: '#f97316',
    dot: 'bg-orange-400',
    badge: 'bg-orange-100 text-orange-700',
  },
  5: {
    label: 'Crítica',
    color: '#ef4444',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
  },
}

export const HELP_TYPE_COLORS: Record<HelpType, string> = {
  Alimentos: 'bg-amber-100 text-amber-800 border-amber-200',
  Água: 'bg-blue-100 text-blue-800 border-blue-200',
  Roupas: 'bg-purple-100 text-purple-800 border-purple-200',
  Remédios: 'bg-red-100 text-red-800 border-red-200',
  Voluntários: 'bg-green-100 text-green-800 border-green-200',
  Abrigo: 'bg-orange-100 text-orange-800 border-orange-200',
  Resgate: 'bg-rose-100 text-rose-800 border-rose-200',
  Higiene: 'bg-teal-100 text-teal-800 border-teal-200',
  'Ração para animais': 'bg-lime-100 text-lime-800 border-lime-200',
  Outros: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'agora mesmo'
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`
  const days = Math.floor(seconds / 86400)
  return days === 1 ? 'há 1 dia' : `há ${days} dias`
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return phone
  const visible = phone.slice(0, 7)
  const rest = phone.slice(7)
  return visible + rest.replace(/\d/g, '*')
}
