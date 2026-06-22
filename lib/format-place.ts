/** Display label like Google Maps: place name + address. */
export function formatPlaceLocation(
  name?: string | null,
  formattedAddress?: string | null
): string {
  const placeName = name?.trim() ?? "";
  const address = formattedAddress?.trim() ?? "";

  if (placeName && address) {
    if (address.toLowerCase().includes(placeName.toLowerCase())) {
      return address;
    }
    return `${placeName}, ${address}`;
  }

  return placeName || address;
}

export function splitPlaceLocation(location: string): {
  placeName: string;
  address: string | null;
} {
  const value = location.trim();
  if (!value) {
    return { placeName: "", address: null };
  }

  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { placeName: value, address: null };
  }

  return {
    placeName: parts[0],
    address: parts.slice(1).join(", ")
  };
}
