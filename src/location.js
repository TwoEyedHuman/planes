const STORAGE_KEY = 'planes:center'

const RADNOR_PA = { lat: 40.0409, lng: -75.3599 }

function readStoredCenter() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return parsed
    }
  } catch {
    // ignore malformed value
  }
  return null
}

export function saveCenter(lat, lng) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng }))
}

export function getInitialCenter() {
  return new Promise((resolve) => {
    const stored = readStoredCenter()
    if (stored) {
      resolve(stored)
      return
    }

    if (!navigator.geolocation) {
      resolve(RADNOR_PA)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(RADNOR_PA),
      { timeout: 5000 }
    )
  })
}
