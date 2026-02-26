'use client'

import type { HelpRequest } from '@/types'
import RequestCard from './RequestCard'

interface RequestListProps {
  requests: HelpRequest[]
  loading: boolean
  selectedId?: string | null
  onSelect: (id: string) => void
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-2 mb-2">
        <div className="h-5 bg-gray-200 rounded-full w-28" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="flex gap-1">
        <div className="h-4 bg-gray-200 rounded-full w-16" />
        <div className="h-4 bg-gray-200 rounded-full w-14" />
      </div>
    </div>
  )
}

export default function RequestList({
  requests,
  loading,
  selectedId,
  onSelect,
}: RequestListProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <svg
          className="w-12 h-12 text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <p className="text-gray-500 text-sm font-medium">Nenhum pedido encontrado</p>
        <p className="text-gray-400 text-xs mt-1">Tente ajustar os filtros ou criar um novo pedido.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <p className="text-xs text-gray-400 px-1 pb-1">
        {requests.length} pedido{requests.length !== 1 ? 's' : ''} encontrado{requests.length !== 1 ? 's' : ''}
      </p>
      {requests.map((r) => (
        <RequestCard
          key={r.id}
          request={r}
          selected={r.id === selectedId}
          onClick={() => onSelect(r.id)}
          compact
        />
      ))}
    </div>
  )
}
