type Point = { lat: number; lng: number };

// District centroids only. Exact user coordinates are intentionally never stored.
const HANOI_DISTRICTS: Record<string, Point> = {
  "Ba Dinh": { lat: 21.035, lng: 105.814 },
  "Bac Tu Liem": { lat: 21.072, lng: 105.75 },
  "Cau Giay": { lat: 21.03, lng: 105.79 },
  "Dong Da": { lat: 21.018, lng: 105.83 },
  "Ha Dong": { lat: 20.96, lng: 105.76 },
  "Hai Ba Trung": { lat: 21.005, lng: 105.85 },
  "Hoan Kiem": { lat: 21.028, lng: 105.854 },
  "Hoang Mai": { lat: 20.974, lng: 105.85 },
  "Long Bien": { lat: 21.04, lng: 105.89 },
  "Nam Tu Liem": { lat: 21.012, lng: 105.755 },
  "Tay Ho": { lat: 21.07, lng: 105.815 },
  "Thanh Xuan": { lat: 20.995, lng: 105.805 },
};

export function districtsWithinRadius(origin: string, radiusKm: number): string[] {
  const point = lookup(origin);
  if (!point) return [origin];
  return Object.entries(HANOI_DISTRICTS)
    .filter(([, candidate]) => haversineKm(point, candidate) <= radiusKm)
    .map(([name]) => name);
}

export function haversineKm(a: Point, b: Point): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function lookup(name: string) {
  const normalized = normalize(name);
  return Object.entries(HANOI_DISTRICTS).find(([district]) => normalize(district) === normalized)?.[1];
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
