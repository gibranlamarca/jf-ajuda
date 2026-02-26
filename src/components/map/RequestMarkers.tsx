'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import type { HelpRequest } from '@/types'
import { URGENCY_CONFIG } from '@/types'

const URGENCY_HEX: Record<number, string> = {
  1: '#94a3b8',
  2: '#60a5fa',
  3: '#fbbf24',
  4: '#f97316',
  5: '#ef4444',
}

// Icons are created lazily (inside functions) to avoid calling L.divIcon()
// at module load time, which can trigger issues before the browser is ready.

function createOpenIcon(urgency: number): L.DivIcon {
  const color = URGENCY_HEX[urgency] ?? '#ef4444'
  const size = urgency >= 5 ? 22 : urgency >= 4 ? 20 : 18
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.45);
      cursor:pointer;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function createResolvedIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;
      height:14px;
      background:#22c55e;
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      opacity:0.8;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

interface RequestMarkersProps {
  requests: HelpRequest[]
  selectedId?: string | null
  onMarkerClick?: (id: string) => void
}

export default function RequestMarkers({
  requests,
  selectedId,
  onMarkerClick,
}: RequestMarkersProps) {
  return (
    <>
      {requests.map((r) => {
        const isResolved = r.status === 'RESOLVED'
        const isSelected = r.id === selectedId
        const icon = isResolved ? createResolvedIcon() : createOpenIcon(r.urgency)

        return (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={icon}
            zIndexOffset={isSelected ? 1000 : isResolved ? 0 : r.urgency * 100}
            eventHandlers={{
              click: () => onMarkerClick?.(r.id),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <div className="flex items-start gap-1 mb-1">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                      isResolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isResolved ? 'Resolvido' : URGENCY_CONFIG[r.urgency]?.label ?? 'Urgente'}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 leading-tight mb-0.5">{r.title}</p>
                <p className="text-gray-500 text-xs mb-2">{r.neighborhood}</p>
                <Link
                  href={`/requests/${r.id}`}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                >
                  Ver detalhes →
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
