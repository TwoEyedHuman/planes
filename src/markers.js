import maplibregl from 'maplibre-gl'

const PLANE_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path fill="white" d="M12 1 L14 8 L21 13 L21 15 L14 13 L14 19 L17 21 L17 22.5 L12 21.5 L7 22.5 L7 21 L10 19 L10 13 L3 15 L3 13 L10 8 Z" />
  </svg>
`

const activeMarkers = new Map()

function createPlaneElement(trueTrack) {
  const el = document.createElement('div')
  el.style.width = '24px'
  el.style.height = '24px'
  el.style.transformOrigin = 'center'
  el.style.transform = `rotate(${trueTrack}deg)`
  el.innerHTML = PLANE_ICON_SVG
  return el
}

export function upsertMarkers(planes, map) {
  const seen = new Set()

  for (const plane of planes) {
    seen.add(plane.icao24)
    const existing = activeMarkers.get(plane.icao24)

    if (existing) {
      existing.setLngLat([plane.lon, plane.lat])
      existing.getElement().style.transform = `rotate(${plane.trueTrack}deg)`
    } else {
      const marker = new maplibregl.Marker({
        element: createPlaneElement(plane.trueTrack),
      })
        .setLngLat([plane.lon, plane.lat])
        .addTo(map)
      activeMarkers.set(plane.icao24, marker)
    }
  }

  for (const [icao24, marker] of activeMarkers) {
    if (!seen.has(icao24)) {
      marker.remove()
      activeMarkers.delete(icao24)
    }
  }
}
