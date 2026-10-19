export interface Office {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// Static, deterministic office list (city-centre coordinates).
export const OFFICES: readonly Office[] = [
  {
    id: 'lisbon',
    name: 'Lisbon',
    address: 'Praca do Comercio 1, 1100-148 Lisbon, Portugal',
    lat: 38.7223,
    lng: -9.1393,
  },
  {
    id: 'kyiv',
    name: 'Kyiv',
    address: 'Khreshchatyk St 22, 01001 Kyiv, Ukraine',
    lat: 50.4501,
    lng: 30.5234,
  },
  {
    id: 'berlin',
    name: 'Berlin',
    address: 'Unter den Linden 77, 10117 Berlin, Germany',
    lat: 52.52,
    lng: 13.405,
  },
];
