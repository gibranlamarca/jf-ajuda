'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import RequestMarkers from './RequestMarkers'
import type { HelpRequest } from '@/types'

const JF_CENTER: [number, number] = [-21.7606, -43.3496]
const DEFAULT_ZOOM = 12

/**
 * Handles panning to selected request using the useMap() hook.
 * Must be a child of MapContainer — this is the correct react-leaflet pattern.
 */
function MapPanner({
  selectedId,
  requests,
}: {
  selectedId?: string | null
  requests: HelpRequest[]
}) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    const req = requests.find((r) => r.id === selectedId)
    if (req) {
      map.panTo([req.lat, req.lng], { animate: true, duration: 0.5 })
    }
  }, [selectedId, requests, map])
  return null
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapViewProps {
  requests: HelpRequest[]
  selectedId?: string | null
  onMarkerClick?: (id: string) => void
  onMapClick?: (lat: number, lng: number) => void
  pickMode?: boolean
}

export default function MapView({
  requests,
  selectedId,
  onMarkerClick,
  onMapClick,
  pickMode = false,
}: MapViewProps) {
  /**
   * A mount-unique key forces React to create a fresh DOM element for MapContainer
   * each time this component mounts. This prevents Leaflet's "Map container is
   * already initialized" error that occurs when the container div is reused
   * (e.g. due to Next.js dev-mode HMR or React double-invocation).
   */
  const [mapKey] = useState(() => `map-${Math.random()}`)

  return (
    <MapContainer
      key={mapKey}
      center={JF_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <RequestMarkers
        requests={requests}
        selectedId={selectedId}
        onMarkerClick={onMarkerClick}
      />
      <MapPanner selectedId={selectedId} requests={requests} />
      {pickMode && <MapClickHandler onMapClick={onMapClick} />}
    </MapContainer>
  )
}
