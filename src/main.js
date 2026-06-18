import './style.css'
import { getInitialCenter } from './location.js'
import { initMap } from './map.js'
import { fetchPlanes } from './opensky.js'
import { upsertMarkers } from './markers.js'

const POLL_INTERVAL_MS = 10000

getInitialCenter().then((center) => {
  const map = initMap(center)

  const refreshPlanes = () => {
    fetchPlanes(map.getBounds())
      .then((planes) => upsertMarkers(planes, map))
      .catch((err) => console.error('Failed to fetch planes:', err))
  }

  refreshPlanes()
  map.on('moveend', refreshPlanes)
  setInterval(refreshPlanes, POLL_INTERVAL_MS)
})
