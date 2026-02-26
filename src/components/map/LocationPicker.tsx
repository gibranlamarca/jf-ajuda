'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const JF_CENTER: [number, number] = [-21.7606, -43.3496]

// Created inside the component to avoid module-level L calls before the browser is ready
function getPinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:28px;">
      <div style="
        width:24px;height:24px;
        background:#dc2626;
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 8px rgba(0,0,0,0.45);
        position:absolute;top:0;left:2px;
      "></div>
      <div style="
        width:6px;height:6px;
        background:white;border-radius:50%;
        position:absolute;top:6px;left:11px;z-index:1;
      "></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface LocationPickerProps {
  value?: { lat: number; lng: number } | null
  onChange: (lat: number, lng: number) => void
  height?: string
}

export default function LocationPicker({ value, onChange, height = 'h-64' }: LocationPickerProps) {
  // Fresh key per mount prevents "Map container is already initialized" on remounts
  const [mapKey] = useState(() => `picker-${Math.random()}`)
  const [pinIcon] = useState(() => getPinIcon())

  return (
    <div>
      <div
        className={`${height} rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-red-400 transition-colors cursor-crosshair`}
      >
        <MapContainer
          key={mapKey}
          center={JF_CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickHandler onPick={onChange} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>
      </div>
      <p className={`text-center text-xs mt-1.5 ${value ? 'text-green-600' : 'text-gray-500'}`}>
        {value
          ? `✓ Localização marcada (${value.lat.toFixed(5)}, ${value.lng.toFixed(5)})`
          : 'Clique no mapa para marcar a localização exata'}
      </p>
    </div>
  )
}
