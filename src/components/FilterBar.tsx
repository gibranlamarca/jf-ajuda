'use client'

import { useState } from 'react'
import type { Filters } from '@/types'
import { HELP_TYPES, HELP_TYPE_COLORS } from '@/types'

interface FilterBarProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [typesOpen, setTypesOpen] = useState(false)

  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch, page: 1 })

  const toggleType = (type: string) => {
    const current = filters.types ?? []
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    update({ types: next.length > 0 ? next : undefined })
  }

  const clearAll = () =>
    onChange({ status: 'OPEN' })

  const hasActiveFilters =
    (filters.types?.length ?? 0) > 0 ||
    filters.neighborhood ||
    filters.q ||
    filters.urgencyMin ||
    filters.urgencyMax

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Status tabs */}
      <div className="flex border-b border-gray-200">
        {(['', 'OPEN', 'RESOLVED'] as const).map((s) => {
          const label = s === '' ? 'Todos' : s === 'OPEN' ? 'Precisando' : 'Resolvidos'
          const isActive = (filters.status ?? '') === s
          return (
            <button
              key={s}
              onClick={() => update({ status: s || undefined })}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? s === 'OPEN'
                    ? 'text-red-700 border-b-2 border-red-600 bg-white'
                    : s === 'RESOLVED'
                    ? 'text-green-700 border-b-2 border-green-600 bg-white'
                    : 'text-gray-800 border-b-2 border-gray-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Search + Filters */}
      <div className="p-3 space-y-2">
        {/* Text search */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filters.q ?? ''}
            onChange={(e) => update({ q: e.target.value || undefined })}
            placeholder="Buscar por título ou descrição..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {/* Neighborhood */}
        <input
          type="text"
          value={filters.neighborhood ?? ''}
          onChange={(e) => update({ neighborhood: e.target.value || undefined })}
          placeholder="Filtrar por bairro..."
          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        {/* Urgency */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex-shrink-0">Urgência:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((u) => {
              const isMin = filters.urgencyMin === u
              const isMax = filters.urgencyMax === u
              const inRange =
                u >= (filters.urgencyMin ?? 1) && u <= (filters.urgencyMax ?? 5)
              const isActive = filters.urgencyMin !== undefined || filters.urgencyMax !== undefined

              const handleClick = () => {
                if (!filters.urgencyMin) {
                  update({ urgencyMin: u, urgencyMax: u })
                } else if (u < (filters.urgencyMin ?? 1)) {
                  update({ urgencyMin: u })
                } else if (u > (filters.urgencyMax ?? 5)) {
                  update({ urgencyMax: u })
                } else if (isMin && isMax) {
                  update({ urgencyMin: undefined, urgencyMax: undefined })
                } else {
                  update({ urgencyMin: u, urgencyMax: u })
                }
              }

              const colors = [
                '',
                'bg-slate-200 text-slate-700',
                'bg-blue-200 text-blue-700',
                'bg-yellow-200 text-yellow-700',
                'bg-orange-200 text-orange-700',
                'bg-red-200 text-red-700',
              ]

              return (
                <button
                  key={u}
                  onClick={handleClick}
                  title={`Urgência ${u}`}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    isActive && inRange
                      ? colors[u] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {u}
                </button>
              )
            })}
            {(filters.urgencyMin || filters.urgencyMax) && (
              <button
                onClick={() => update({ urgencyMin: undefined, urgencyMax: undefined })}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Types toggle */}
        <div>
          <button
            onClick={() => setTypesOpen(!typesOpen)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
          >
            <svg
              className={`w-3 h-3 transition-transform ${typesOpen ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Tipos de ajuda
            {(filters.types?.length ?? 0) > 0 && (
              <span className="bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 text-xs font-medium">
                {filters.types!.length}
              </span>
            )}
          </button>

          {typesOpen && (
            <div className="flex flex-wrap gap-1 mt-2">
              {HELP_TYPES.map((type) => {
                const isSelected = filters.types?.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-all ${
                      isSelected
                        ? HELP_TYPE_COLORS[type] + ' ring-1 ring-current'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
