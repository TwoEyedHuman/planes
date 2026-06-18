import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { saveCenter } from './location.js'

const STYLE_URL = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json'

// Layers that add terrain-color and road/street detail we don't need —
// the map only needs to convey rough area/direction for plane spotting.
const CLUTTER_LAYERS = [
  'park_fill',
  'landcover_ice_shelf',
  'landcover_glacier',
  'landuse_residential',
  'landcover_wood',
  'landcover_park',
  'building',
  'waterway',
  'highway_path',
  'highway_minor',
  'railway_service',
  'railway_service_dashline',
  'railway',
  'railway_dashline',
  'aeroway_line',
  'highway_name_other',
  'highway_name_major',
  'highway_shield_other',
  'highway_shield_us_other',
  'highway_shield_us_interstate',
  'water_name_line',
  'poi_gen1',
  'poi_gen0_parks',
  'poi_gen0_other',
  'airport_label_gen0',
]

export function initMap(center) {
  const map = new maplibregl.Map({
    container: 'app',
    style: STYLE_URL,
    center: [center.lng, center.lat],
    zoom: 10,
    attributionControl: false,
  })

  map.on('style.load', () => {
    for (const id of CLUTTER_LAYERS) {
      if (map.getLayer(id)) map.removeLayer(id)
    }
    // Cap tile detail for water so only larger lakes/rivers show — small
    // ponds get dropped by the server's own simplification at low zoom.
    map.setLayerZoomRange('water', 0, 7)
  })

  map.on('moveend', () => {
    const { lat, lng } = map.getCenter()
    saveCenter(lat, lng)
  })

  return map
}
