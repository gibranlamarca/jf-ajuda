'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import FilterBar from '@/components/FilterBar'
import RequestList from '@/components/RequestList'
import CreateRequestModal from '@/components/CreateRequestModal'
import type { HelpRequest, Filters } from '@/types'

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 flex flex-col items-center justify-center gap-3">
      <svg className="animate-spin h-8 w-8 text-red-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-gray-400 text-sm">Carregando mapa...</span>
    </div>
  ),
})

export default function HomePage() {
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({ status: 'OPEN' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.types?.length) params.set('types', filters.types.join(','))
      if (filters.urgencyMin) params.set('urgencyMin', String(filters.urgencyMin))
      if (filters.urgencyMax) params.set('urgencyMax', String(filters.urgencyMax))
      if (filters.neighborhood) params.set('neighborhood', filters.neighborhood)
      if (filters.q) params.set('q', filters.q)
      params.set('pageSize', '200') // fetch all for map

      const res = await fetch(`/api/requests?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRequests(data.data ?? [])
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleCreateSuccess = (requestId: string) => {
    fetchRequests()
    setSelectedId(requestId)
  }

  const openCount = requests.filter((r) => r.status === 'OPEN').length

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-red-700 text-white px-4 py-2.5 flex items-center justify-between shadow-md flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight leading-none">JF Ajuda</h1>
            <p className="text-red-200 text-xs">
              Mapa de emergência · Juiz de Fora, MG
              {openCount > 0 && (
                <span className="ml-2 bg-red-900 text-red-100 px-1.5 py-0.5 rounded-full text-xs font-medium">
                  {openCount} aberto{openCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-white text-red-700 font-bold px-4 py-2 rounded-xl hover:bg-red-50 transition-all shadow-sm text-sm active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Pedir ajuda
        </button>
      </header>

      {/* ── Main layout ────────────────────────────────── */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden min-h-0">
        {/* Map — top on mobile, right on desktop */}
        <main className="h-[45vh] md:h-auto md:flex-1 order-first md:order-last relative">
          <MapView
            requests={requests}
            selectedId={selectedId}
            onMarkerClick={setSelectedId}
          />

          {/* Map legend */}
          <div className="absolute bottom-3 right-3 bg-white rounded-xl shadow-lg p-2.5 text-xs z-10 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
              <span className="text-gray-600">Urgência crítica</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-white shadow-sm" />
              <span className="text-gray-600">Urgência média</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm opacity-80" />
              <span className="text-gray-600">Resolvido</span>
            </div>
          </div>
        </main>

        {/* Sidebar — bottom on mobile, left on desktop */}
        <aside className="flex flex-col overflow-hidden md:w-96 flex-1 md:flex-none order-last md:order-first border-t md:border-t-0 md:border-r border-gray-200 bg-white min-h-0">
          <FilterBar filters={filters} onChange={setFilters} />

          {fetchError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-gray-600 text-sm font-medium">Erro ao carregar pedidos</p>
                <p className="text-gray-400 text-xs mt-1">Verifique sua conexão e tente novamente.</p>
              </div>
              <button
                onClick={fetchRequests}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <RequestList
              requests={requests}
              loading={loading}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </aside>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateRequestModal
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}
