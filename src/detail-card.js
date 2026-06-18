import airlineData from './data/icao-airlines.json'

// Full OpenSky aircraft metadata (icao24 -> manufacturer/model) is ~26MB, so
// it's served as a static asset and fetched lazily instead of bundled into
// the JS chunk.
const AIRCRAFT_DATA_URL = '/data/icao-aircraft.json'

let cardEl = null
let aircraftDataPromise = null
let currentIcao24 = null

function ensureCard() {
  if (!cardEl) {
    cardEl = document.createElement('div')
    cardEl.className = 'detail-card'
    document.body.appendChild(cardEl)
  }
  return cardEl
}

function loadAircraftData() {
  if (!aircraftDataPromise) {
    aircraftDataPromise = fetch(AIRCRAFT_DATA_URL)
      .then((res) => res.json())
      .catch(() => ({}))
  }
  return aircraftDataPromise
}

export function prefetchAircraftData() {
  loadAircraftData()
}

function render(el, airline, type) {
  el.innerHTML = `
    <div class="detail-card-row detail-card-airline">${airline}</div>
    <div class="detail-card-row detail-card-type">${type}</div>
  `
}

export function showCard(plane) {
  const el = ensureCard()
  currentIcao24 = plane.icao24
  const callsign = plane.callsign || ''
  const prefix = callsign.slice(0, 3).toUpperCase()
  const airline = airlineData[prefix] || callsign || 'Unknown'

  render(el, airline, 'Looking up…')
  el.classList.add('visible')

  loadAircraftData().then((aircraftData) => {
    if (currentIcao24 !== plane.icao24) return
    const info = aircraftData[plane.icao24]
    const type = info ? `${info.manufacturer} ${info.model}` : 'Unknown type'
    render(el, airline, type)
  })
}

export function hideCard() {
  currentIcao24 = null
  if (cardEl) {
    cardEl.classList.remove('visible')
  }
}
