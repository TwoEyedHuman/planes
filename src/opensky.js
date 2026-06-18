const OPENSKY_STATES_URL = '/api/opensky/states/all'

export async function fetchPlanes(bounds) {
  const params = new URLSearchParams({
    lamin: bounds.getSouth(),
    lomin: bounds.getWest(),
    lamax: bounds.getNorth(),
    lomax: bounds.getEast(),
  })

  const res = await fetch(`${OPENSKY_STATES_URL}?${params}`)
  if (!res.ok) {
    throw new Error(`OpenSky request failed: ${res.status}`)
  }

  const data = await res.json()
  const states = data.states || []

  return states
    .filter((s) => s[6] != null && s[5] != null)
    .map((s) => ({
      icao24: s[0],
      callsign: s[1] ? s[1].trim() : '',
      lon: s[5],
      lat: s[6],
      onGround: s[8],
      trueTrack: s[10] ?? 0,
    }))
}
