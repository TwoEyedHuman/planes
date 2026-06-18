const POLL_INTERVAL_MS = 10000
const GRACE_MS = 5000

const tracked = new Map() // icao24 -> { prev, next, pollTime, droppedAt }

export function updateSnapshot(planes, pollTime = Date.now()) {
  const seen = new Set()

  for (const plane of planes) {
    seen.add(plane.icao24)
    const next = {
      lat: plane.lat,
      lon: plane.lon,
      velocity: plane.velocity ?? 0,
      trueTrack: plane.trueTrack ?? 0,
      callsign: plane.callsign ?? '',
    }
    const existing = tracked.get(plane.icao24)
    tracked.set(plane.icao24, {
      prev: existing ? existing.next : next,
      next,
      pollTime,
      droppedAt: null,
    })
  }

  for (const [icao24, entry] of tracked) {
    if (!seen.has(icao24) && entry.droppedAt == null) {
      entry.droppedAt = pollTime
    }
  }

  for (const [icao24, entry] of tracked) {
    if (entry.droppedAt != null && pollTime - entry.droppedAt > GRACE_MS) {
      tracked.delete(icao24)
    }
  }
}

export function getInterpolatedPositions(now) {
  const positions = []

  for (const [icao24, entry] of tracked) {
    const { prev, next, pollTime } = entry
    const t = Math.min(Math.max((now - pollTime) / POLL_INTERVAL_MS, 0), 1)

    positions.push({
      icao24,
      lat: prev.lat + (next.lat - prev.lat) * t,
      lon: prev.lon + (next.lon - prev.lon) * t,
      trueTrack: next.trueTrack,
      callsign: next.callsign,
    })
  }

  return positions
}
