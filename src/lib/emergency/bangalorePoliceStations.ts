/**
 * Bengaluru Urban police stations (demo coordinates for map — not an official registry).
 * Grouped like Saarthi command UI; Bangalore city only (no Mysuru).
 */

export type BangaloreRegionId = 'central' | 'east' | 'south' | 'north' | 'north_east' | 'west'

export const BANGALORE_REGION_LABELS: Record<BangaloreRegionId, string> = {
  central: 'Bangalore Central',
  east: 'Bangalore East',
  south: 'Bangalore South',
  north: 'Bangalore North',
  north_east: 'Bangalore North-East',
  west: 'Bangalore West',
}

export type BangalorePoliceStation = {
  id: string
  name: string
  lat: number
  lng: number
  region: BangaloreRegionId
}

/** Major Bengaluru police stations — approximate map pins for demo. */
export const BANGALORE_POLICE_STATIONS: readonly BangalorePoliceStation[] = [
  // Central
  { id: 'vidhana-soudha', name: 'Vidhana Soudha Police Station', lat: 12.9798, lng: 77.5907, region: 'central' },
  { id: 'cubbon-park', name: 'Cubbon Park Police Station', lat: 12.9763, lng: 77.5929, region: 'central' },
  { id: 'ub-city', name: 'UB City / Vittal Mallya Road PS', lat: 12.9716, lng: 77.5966, region: 'central' },
  { id: 'mg-road', name: 'MG Road Police Station', lat: 12.9752, lng: 77.6014, region: 'central' },
  { id: 'shivajinagar', name: 'Shivajinagar Police Station', lat: 12.985, lng: 77.603, region: 'central' },
  { id: 'ulsoor', name: 'Ulsoor Police Station', lat: 12.984, lng: 77.626, region: 'central' },
  { id: 'ashoknagar', name: 'Ashoknagar Police Station', lat: 12.97, lng: 77.563, region: 'central' },
  { id: 'sampangiram', name: 'Sampangiramanagar Police Station', lat: 12.963, lng: 77.577, region: 'central' },

  // East
  { id: 'brigade-road', name: 'Brigade Road Police Station', lat: 12.9651, lng: 77.6106, region: 'east' },
  { id: 'whitefield', name: 'Whitefield Police Station', lat: 12.9698, lng: 77.7499, region: 'east' },
  { id: 'indiranagar', name: 'Indiranagar Police Station', lat: 12.9784, lng: 77.6408, region: 'east' },
  { id: 'domlur', name: 'Domlur Police Station', lat: 12.961, lng: 77.638, region: 'east' },
  { id: 'hal', name: 'HAL Police Station', lat: 12.959, lng: 77.668, region: 'east' },
  { id: 'marathahalli', name: 'Marathahalli Police Station', lat: 12.9592, lng: 77.6974, region: 'east' },
  { id: 'bellandur', name: 'Bellandur Police Station', lat: 12.92, lng: 77.67, region: 'east' },
  { id: 'varthur', name: 'Varthur Police Station', lat: 12.938, lng: 77.746, region: 'east' },
  { id: 'kadugodi', name: 'Kadugodi Police Station', lat: 12.995, lng: 77.761, region: 'east' },
  { id: 'mahadevapura', name: 'Mahadevapura Police Station', lat: 12.9907, lng: 77.7028, region: 'east' },

  // South
  { id: 'koramangala', name: 'Koramangala Police Station', lat: 12.9352, lng: 77.6245, region: 'south' },
  { id: 'btm', name: 'BTM Layout Police Station', lat: 12.9166, lng: 77.6101, region: 'south' },
  { id: 'electronic-city', name: 'Electronic City Police Station', lat: 12.8456, lng: 77.6603, region: 'south' },
  { id: 'jayanagar', name: 'Jayanagar Police Station', lat: 12.925, lng: 77.5938, region: 'south' },
  { id: 'jp-nagar', name: 'JP Nagar Police Station', lat: 12.9077, lng: 77.5907, region: 'south' },
  { id: 'basavanagudi', name: 'Basavanagudi Police Station', lat: 12.9407, lng: 77.5738, region: 'south' },
  { id: 'banashankari', name: 'Banashankari Police Station', lat: 12.9255, lng: 77.5468, region: 'south' },
  { id: 'wilson-garden', name: 'Wilson Garden Police Station', lat: 12.9451, lng: 77.594, region: 'south' },
  { id: 'hsr', name: 'HSR Layout Police Station', lat: 12.9116, lng: 77.6389, region: 'south' },
  { id: 'bommanahalli', name: 'Bommanahalli Police Station', lat: 12.8795, lng: 77.6236, region: 'south' },
  { id: 'madiwala', name: 'Madiwala Police Station', lat: 12.918, lng: 77.616, region: 'south' },

  // North
  { id: 'hebbal', name: 'Hebbal Police Station', lat: 13.0358, lng: 77.597, region: 'north' },
  { id: 'yelahanka', name: 'Yelahanka Police Station', lat: 13.1007, lng: 77.5963, region: 'north' },
  { id: 'rt-nagar', name: 'RT Nagar Police Station', lat: 13.0221, lng: 77.5946, region: 'north' },
  { id: 'sadashivanagar', name: 'Sadashivanagar Police Station', lat: 12.998, lng: 77.58, region: 'north' },
  { id: 'sanjaynagar', name: 'Sanjaynagar Police Station', lat: 13.027, lng: 77.574, region: 'north' },
  { id: 'jalahalli', name: 'Jalahalli Police Station', lat: 13.05, lng: 77.55, region: 'north' },
  { id: 'dasarahalli', name: 'Dasarahalli Police Station', lat: 13.048, lng: 77.513, region: 'north' },
  { id: 'yeshwanthpur', name: 'Yeshwanthpur Police Station', lat: 12.9698, lng: 77.5536, region: 'north' },
  { id: 'peenya', name: 'Peenya Police Station', lat: 13.028, lng: 77.508, region: 'north' },

  // North-East
  { id: 'kr-puram', name: 'KR Puram Police Station', lat: 13.0067, lng: 77.7041, region: 'north_east' },
  { id: 'banaswadi', name: 'Banaswadi Police Station', lat: 13.035, lng: 77.648, region: 'north_east' },
  { id: 'hennur', name: 'Hennur Police Station', lat: 13.035, lng: 77.642, region: 'north_east' },
  { id: 'ramamurthy-nagar', name: 'Ramamurthy Nagar Police Station', lat: 13.012, lng: 77.672, region: 'north_east' },

  // West
  { id: 'rajajinagar', name: 'Rajajinagar Police Station', lat: 12.9915, lng: 77.5548, region: 'west' },
  { id: 'malleshwaram', name: 'Malleshwaram Police Station', lat: 12.995, lng: 77.5698, region: 'west' },
  { id: 'vijayanagar', name: 'Vijayanagar Police Station', lat: 12.971, lng: 77.537, region: 'west' },
  { id: 'kamakshipalya', name: 'Kamakshipalya Police Station', lat: 12.982, lng: 77.529, region: 'west' },
  { id: 'nagarbhavi', name: 'Nagarbhavi Police Station', lat: 12.959, lng: 77.512, region: 'west' },
  { id: 'kengeri', name: 'Kengeri Police Station', lat: 12.914, lng: 77.4836, region: 'west' },
  { id: 'rr-nagar', name: 'RR Nagar Police Station', lat: 12.928, lng: 77.518, region: 'west' },
]

export const BANGALORE_STATION_COUNT = BANGALORE_POLICE_STATIONS.length

export function stationById(id: string): BangalorePoliceStation | undefined {
  return BANGALORE_POLICE_STATIONS.find((s) => s.id === id)
}

export function stationsGroupedForSelect(): { region: BangaloreRegionId; label: string; stations: BangalorePoliceStation[] }[] {
  const order: BangaloreRegionId[] = ['central', 'east', 'south', 'north', 'north_east', 'west']
  return order.map((region) => ({
    region,
    label: BANGALORE_REGION_LABELS[region],
    stations: BANGALORE_POLICE_STATIONS.filter((s) => s.region === region),
  }))
}
