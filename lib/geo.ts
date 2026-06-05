export type Coordinates = {
  lat: number;
  lng: number;
};

export function getDistanceKm(
  from: Coordinates,
  to: Coordinates
): number {
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function hasValidCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  );
}
