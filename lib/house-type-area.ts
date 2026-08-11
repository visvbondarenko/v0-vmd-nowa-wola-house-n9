// Single source of truth for unit/house-type size.
//
// A house type's area is always *calculated* from the sum of its room areas —
// never entered by hand and never persisted. Each floor's area is the sum of
// its rooms, the type's total is the sum of its floors, and a unit's size is
// its house type's total. These pure helpers are applied at read time (API
// serialization + admin UI) so every type reflects its rooms without any DB
// write or migration.

// Round to 2 decimals to keep summed room areas free of float noise
// (e.g. 47.86 + 36.51 = 84.37, not 84.36999999999999).
export function roundArea(n: number): number {
  return Math.round(n * 100) / 100
}

type RoomLike = { area: number | null }
type FloorLike = { rooms: RoomLike[] }

// Sum of a floor's room areas. null when no room carries an area.
export function floorArea(rooms: RoomLike[]): number | null {
  const areas = rooms.map((r) => r.area).filter((a): a is number => a != null)
  return areas.length ? roundArea(areas.reduce((s, a) => s + a, 0)) : null
}

// Sum of a type's floor areas (= sum of all its rooms). null when it has no
// rooms with an area yet.
export function typeArea(floorPlans: FloorLike[]): number | null {
  let total = 0
  let any = false
  for (const f of floorPlans) {
    const fa = floorArea(f.rooms)
    if (fa != null) {
      any = true
      total += fa
    }
  }
  return any ? roundArea(total) : null
}

// A unit's size: its house type's total, falling back to the stored `area`
// column only for units that have no type yet. The stored column is no longer
// maintained by the admin (see the plan editor / units manager), so anything
// that must not go stale — the dane.gov.pl CSV above all — has to go through
// here rather than reading `unit.area` directly.
export function unitArea(unit: {
  area: number | null
  houseType?: { floorPlans: FloorLike[] } | null
}): number | null {
  const derived = unit.houseType ? typeArea(unit.houseType.floorPlans) : null
  return derived ?? unit.area
}

// Returns a copy of a house type with floor `area` and `totalArea` filled in
// from its rooms. Generic over the concrete shape so it works on both the
// public and admin serialized types.
export function withDerivedAreas<
  F extends FloorLike & { area: number | null },
  T extends { totalArea: number | null; floorPlans: F[] }
>(type: T): T {
  const floorPlans = type.floorPlans.map((f) => ({ ...f, area: floorArea(f.rooms) }))
  return { ...type, floorPlans, totalArea: typeArea(type.floorPlans) }
}
