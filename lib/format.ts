export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)}m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  }

  return `${Math.round(distanceKm)}km`;
}

export function formatNotificationTitle(
  distanceKm: number,
  requestTitle: string,
  budget: number
): string {
  const pay =
    budget > 0 ? ` £${budget}` : "";
  return `New request ${formatDistanceKm(distanceKm)} away - ${requestTitle}${pay}`;
}
