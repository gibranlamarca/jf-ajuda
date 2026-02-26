'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function getPinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;
      background:#dc2626;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  })
}

interface MiniMapPreviewProps {
  lat: number
  lng: number
  title: string
  height?: string
}

export default function MiniMapPreview({ lat, lng, title, height = 'h-48' }: MiniMapPreviewProps) {
  // Fresh key per mount prevents "Map container is already initialized"
  const [mapKey] = useState(() => `mini-${Math.random()}`)
  const [pinIcon] = useState(() => getPinIcon())

  return (
    <div className={`${height} rounded-lg overflow-hidden border border-gray-200`}>
      <MapContainer
        key={mapKey}
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Marker position={[lat, lng]} icon={pinIcon}>
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
