import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker images resolve to broken paths under Vite's
// bundler — divIcon with inline SVG sidesteps that entirely instead of
// fighting asset-URL rewriting for a third-party image.
const pin = (color) =>
  L.divIcon({
    className: '',
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0Z" fill="${color}" stroke="#05070f" stroke-width="1.5"/>
      <circle cx="13" cy="13" r="5" fill="#05070f"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  })

const userPin = pin('#3b82f6')
const supplierPin = pin('#eab424')
const selectedPin = pin('#ef4444')

function Recenter({ center }) {
  const map = useMap()
  useMemo(() => {
    if (center) map.setView(center, map.getZoom())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1]])
  return null
}

function MapView({ userCoords, suppliers, selectedSupplierId, onSelectSupplier, onViewShop }) {
  const center = userCoords
    ? [userCoords.lat, userCoords.lng]
    : suppliers.length
      ? [suppliers[0].location.latitude, suppliers[0].location.longitude]
      : [22.0, 79.0]

  return (
    <div className="mt-4 h-[420px] overflow-hidden rounded-2xl border border-ink/10">
      <MapContainer center={center} zoom={userCoords ? 12 : 5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userPin}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {suppliers
          .filter((s) => s.location.latitude != null && s.location.longitude != null)
          .map((s) => (
            <Marker
              key={s.supplierMaterialId}
              position={[s.location.latitude, s.location.longitude]}
              icon={s.supplier.id === selectedSupplierId ? selectedPin : supplierPin}
              eventHandlers={{ click: () => onSelectSupplier?.(s.supplier.id) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{s.supplier.businessName}</p>
                  {s.distanceKm != null && <p className="text-xs text-gray-500">{s.distanceKm} km away</p>}
                  {s.supplier.rating != null && <p className="text-xs text-gray-500">★ {s.supplier.rating.toFixed(1)}</p>}
                  <button
                    onClick={() => onViewShop?.(s.supplier.id)}
                    className="mt-1.5 rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-black"
                  >
                    View Shop
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}

export default MapView
