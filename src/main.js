import './style.css'
import { getInitialCenter } from './location.js'
import { initMap } from './map.js'
import { fetchPlanes } from './opensky.js'
import { upsertMarkers, clearSelection } from './markers.js'
import { prefetchAircraftData } from './detail-card.js'
import { updateSnapshot, getInterpolatedPositions } from './interpolator.js'

const POLL_INTERVAL_MS = 10000

getInitialCenter().then((center) => {
  const map = initMap(center)

  const refreshPlanes = () => {
    fetchPlanes(map.getBounds())
      .then((planes) => updateSnapshot(planes))
      .catch((err) => console.error('Failed to fetch planes:', err))
  }

  const animate = () => {
    upsertMarkers(getInterpolatedPositions(Date.now()), map)
    requestAnimationFrame(animate)
  }

  refreshPlanes()
  prefetchAircraftData()
  map.on('moveend', refreshPlanes)
  map.on('click', clearSelection)
  setInterval(refreshPlanes, POLL_INTERVAL_MS)
  requestAnimationFrame(animate)
})
