import maplibregl from 'maplibre-gl'
import { showCard, hideCard } from './detail-card.js'

const PLANE_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path fill="white" d="M12 1 L14 8 L21 13 L21 15 L14 13 L14 19 L17 21 L17 22.5 L12 21.5 L7 22.5 L7 21 L10 19 L10 13 L3 15 L3 13 L10 8 Z" />
  </svg>
`

const activeMarkers = new Map()
let selectedIcao24 = null

function setSelected(icao24, selected) {
  const marker = activeMarkers.get(icao24)
  marker?.getElement().querySelector('.plane-icon').classList.toggle('selected', selected)
}

export function clearSelection() {
  if (selectedIcao24) {
    setSelected(selectedIcao24, false)
    selectedIcao24 = null
  }
  hideCard()
}

function selectPlane(plane) {
  if (selectedIcao24 && selectedIcao24 !== plane.icao24) {
    setSelected(selectedIcao24, false)
  }
  selectedIcao24 = plane.icao24
  setSelected(plane.icao24, true)
  showCard(plane)
}

function createPlaneElement(plane) {
  // maplibregl.Marker overwrites this element's own style.transform for
  // positioning, so rotation must live on a child wrapper instead.
  const el = document.createElement('div')
  const inner = document.createElement('div')
  inner.className = 'plane-icon'
  inner.style.width = '24px'
  inner.style.height = '24px'
  inner.style.transformOrigin = 'center'
  inner.style.transform = `rotate(${plane.trueTrack}deg)`
  inner.innerHTML = PLANE_ICON_SVG
  el.appendChild(inner)

  el.addEventListener('click', (e) => {
    e.stopPropagation()
    selectPlane(plane)
  })

  return el
}

export function upsertMarkers(planes, map) {
  const seen = new Set()

  for (const plane of planes) {
    seen.add(plane.icao24)
    const existing = activeMarkers.get(plane.icao24)

    if (existing) {
      existing.setLngLat([plane.lon, plane.lat])
      existing.getElement().querySelector('.plane-icon').style.transform = `rotate(${plane.trueTrack}deg)`
    } else {
      const marker = new maplibregl.Marker({
        element: createPlaneElement(plane),
      })
        .setLngLat([plane.lon, plane.lat])
        .addTo(map)
      activeMarkers.set(plane.icao24, marker)
    }
  }

  for (const [icao24, marker] of activeMarkers) {
    if (!seen.has(icao24)) {
      if (icao24 === selectedIcao24) clearSelection()
      marker.remove()
      activeMarkers.delete(icao24)
    }
  }
}
