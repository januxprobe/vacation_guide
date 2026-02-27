import type { TripConfig } from '../trip-config';

export const andalusia2026: TripConfig = {
  id: 'andalusia-2026',
  slug: 'andalusia-2026',
  name: {
    nl: 'Andalusië Vakantiegids',
    en: 'Andalusia Travel Guide',
  },
  description: {
    nl: 'Een complete gids voor een familiereis door Sevilla, Córdoba en Granada',
    en: 'A complete guide for a family trip through Seville, Córdoba and Granada',
  },
  region: {
    nl: 'Andalusië, Spanje',
    en: 'Andalusia, Spain',
  },
  dates: {
    start: '2026-09-01',
    end: '2026-09-07',
  },
  cities: [
    {
      id: 'seville',
      name: { nl: 'Sevilla', en: 'Seville' },
      color: '#f97316', // orange-500
      coordinates: { lat: 37.3886, lng: -5.9823 },
    },
    {
      id: 'cordoba',
      name: { nl: 'Córdoba', en: 'Córdoba' },
      color: '#dc2626', // red-600
      coordinates: { lat: 37.8882, lng: -4.7794 },
    },
    {
      id: 'granada',
      name: { nl: 'Granada', en: 'Granada' },
      color: '#16a34a', // green-600
      coordinates: { lat: 37.1773, lng: -3.5986 },
    },
  ],
  categories: [
    'monument',
    'church',
    'palace',
    'museum',
    'neighborhood',
    'nature',
  ],
  travelerGroups: [
    {
      id: 'adults50Plus',
      label: { nl: 'Volwassenen (50+)', en: 'Adults (50+)' },
      defaultCount: 2,
      hasStudentDiscount: false,
    },
    {
      id: 'youngAdults20',
      label: { nl: 'Jongvolwassenen (~20 jaar)', en: 'Young Adults (~20 years)' },
      defaultCount: 3,
      hasStudentDiscount: true,
    },
  ],
  stats: {
    totalDays: 7,
    totalCities: 3,
    totalAttractions: 25,
    totalDistance: '~350 km',
  },
  theme: {
    primaryColor: '#f97316', // orange-500 (Seville as primary city)
  },
  highlights: [
    'granada-alhambra',
    'cordoba-mezquita',
    'seville-real-alcazar',
  ],
  dataDirectory: 'andalusia-2026',
};
