import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { saveCenter } from './location.js'

const STYLE_URL = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json'

export function initMap(center) {
  const map = new maplibregl.Map({
    container: 'app',
    style: STYLE_URL,
    center: [center.lng, center.lat],
    zoom: 10,
    attributionControl: false,
  })

  map.on('moveend', () => {
    const { lat, lng } = map.getCenter()
    saveCenter(lat, lng)
  })

  return map
}
