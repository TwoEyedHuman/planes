import aircraftData from './data/icao-aircraft.json'
import airlineData from './data/icao-airlines.json'

let cardEl = null

function ensureCard() {
  if (!cardEl) {
    cardEl = document.createElement('div')
    cardEl.className = 'detail-card'
    document.body.appendChild(cardEl)
  }
  return cardEl
}

export function showCard(plane) {
  const el = ensureCard()
  const callsign = plane.callsign || ''
  const prefix = callsign.slice(0, 3).toUpperCase()
  const airline = airlineData[prefix] || callsign || 'Unknown'
  const info = aircraftData[plane.icao24]
  const type = info ? `${info.manufacturer} ${info.model}` : 'Unknown type'

  el.innerHTML = `
    <div class="detail-card-row detail-card-airline">${airline}</div>
    <div class="detail-card-row detail-card-type">${type}</div>
  `
  el.classList.add('visible')
}

export function hideCard() {
  if (cardEl) {
    cardEl.classList.remove('visible')
  }
}
