'use client'

import Link from 'next/link'
import type { HelpRequest } from '@/types'
import { URGENCY_CONFIG, HELP_TYPE_COLORS, formatTimeAgo } from '@/types'

interface RequestCardProps {
  request: HelpRequest
  selected?: boolean
  onClick?: () => void
  compact?: boolean
}

export default function RequestCard({
  request: r,
  selected = false,
  onClick,
  compact = false,
}: RequestCardProps) {
  const isResolved = r.status === 'RESOLVED'
  const urgency = URGENCY_CONFIG[r.urgency]

  return (
    <div
      className={`
        bg-white rounded-lg border transition-all cursor-pointer
        ${selected
          ? 'border-red-400 shadow-md ring-2 ring-red-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${isResolved ? 'opacity-70' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-pressed={selected}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isResolved ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isResolved ? 'bg-green-500' : 'bg-red-500'}`}
            />
            {isResolved ? 'Resolvido' : 'Precisando de ajuda'}
          </span>

          {/* Urgency */}
          {!isResolved && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgency?.badge}`}>
              Urgência {r.urgency} — {urgency?.label}
            </span>
          )}
        </div>

        <span className="text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
          {formatTimeAgo(r.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-gray-900 leading-tight mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
        {r.title}
      </h3>

      {/* Neighborhood */}
      <p className="text-gray-500 text-xs mb-2 flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {r.neighborhood}
      </p>

      {/* Help type chips */}
      <div className="flex flex-wrap gap-1 mb-2">
        {r.helpTypes.slice(0, compact ? 3 : 5).map((type) => (
          <span
            key={type}
            className={`inline-block px-2 py-0.5 rounded-full text-xs border ${
              HELP_TYPE_COLORS[type as keyof typeof HELP_TYPE_COLORS] ??
              'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {type}
          </span>
        ))}
        {r.helpTypes.length > (compact ? 3 : 5) && (
          <span className="text-xs text-gray-400">+{r.helpTypes.length - (compact ? 3 : 5)}</span>
        )}
      </div>

      {/* Footer */}
      {!compact && (
        <div className="flex items-center justify-between mt-2">
          <Link
            href={`/requests/${r.id}`}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Ver detalhes →
          </Link>
          {r.confirmationsCount > 0 && (
            <span className="text-xs text-gray-400">
              {r.confirmationsCount} confirmação(ões)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
