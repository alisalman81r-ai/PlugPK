// src/components/map/map-style.ts
//
// The look of the website's map, shared with the app (public/app-prototype,
// screens-map.js): OpenFreeMap's detailed `liberty` basemap — road names,
// shops, banks, mosques, transit, house numbers — recoloured in the brand's
// palette, with crisp labels and buildings that rise in 3D at street level.

import type { ExpressionSpecification, Map as MaplibreMap } from 'maplibre-gl'

/**
 * OpenFreeMap serves OpenStreetMap vector tiles with no key and no account.
 * Liberty is its most detailed style (~111 layers, points of interest at
 * street level); positron, the quiet one, has no POIs at all.
 */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

/** The app's light palette. The ground colour also backs the loading state. */
export const PALETTE = {
  bg: '#F2F6F4',
  water: '#A9DDD6',
  waterText: '#2F7D74',
  park: '#CFEBD9',
  wood: '#C6E6D2',
  sand: '#F1EEDC',
  residential: '#E8EEEB',
  landuse: '#E3ECE7',
  building: '#DEE6E2',
  building3d: '#D3DDD9',
  boundary: '#8FA39D',
  motorway: '#9FE3D3',
  motorwayCase: '#5CC2AC',
  primary: '#FFFFFF',
  primaryCase: '#BCCDC7',
  secondary: '#FFFFFF',
  secondaryCase: '#CCD8D4',
  minor: '#FFFFFF',
  minorCase: '#D8E0DD',
  path: '#FFFFFF',
  rail: '#AEBAB6',
  text: '#12302A',
  textSoft: '#3E5751',
  poiText: '#2F4A44',
  roadText: '#3E5751',
  halo: '#F2F6F4',
} as const

type RoadKey =
  | 'rail' | 'path'
  | 'motorway' | 'primary' | 'secondary' | 'minor'
  | 'motorwayCase' | 'primaryCase' | 'secondaryCase' | 'minorCase'

/** Which palette colour a road line takes, read from its layer id. */
function roadKey(id: string): RoadKey {
  if (id.includes('rail')) return 'rail'
  if (id.includes('path_pedestrian')) return 'path'
  const cls = id.includes('motorway')
    ? 'motorway'
    : id.includes('trunk_primary')
      ? 'primary'
      : id.includes('secondary_tertiary') || id.includes('_link')
        ? 'secondary'
        : 'minor'
  return id.includes('casing') ? (`${cls}Case` as RoadKey) : cls
}

/**
 * Shops, places and street names shown one zoom step sooner than the base
 * style, so more of the city is named at every zoom.
 */
const EARLIER: Record<string, number> = {
  poi_r1: 14,
  poi_r7: 15,
  poi_r20: 16,
  'highway-name-minor': 14,
  'highway-name-major': 11.5,
  'highway-name-path': 15,
}

/**
 * Labels in English.
 *
 * OpenFreeMap styles draw each place as "latin name / local-script name".
 * Across the border that second line is Devanagari, so half the frame was
 * labelled in Hindi on a map for Pakistan. The tiles carry `name:en` and
 * `name:latin`, so every symbol layer whose text comes from a name is
 * rewritten to use them, falling back to the plain name only where neither
 * exists. Layers labelled from something else — road shields use `ref` — are
 * left alone.
 */
const ENGLISH_NAME: ExpressionSpecification = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]

export const BUILDINGS_3D = 'plug-3d'

/** Applies the brand look to a freshly loaded liberty style. Safe to repeat. */
export function brandMap(map: MaplibreMap) {
  const c = PALETTE
  const paint = (id: string, prop: string, value: unknown) => {
    try {
      map.setPaintProperty(id, prop, value)
    } catch {
      // A property this layer does not have; leave it as the style drew it.
    }
  }

  for (const layer of map.getStyle()?.layers ?? []) {
    const { id, type } = layer
    const src = 'source-layer' in layer ? (layer['source-layer'] ?? '') : ''

    if (type === 'background') {
      paint(id, 'background-color', c.bg)
    } else if (type === 'raster') {
      // The relief shading under the country view, toned down to a hint.
      paint(id, 'raster-opacity', ['interpolate', ['linear'], ['zoom'], 0, 0.3, 6, 0.04])
      paint(id, 'raster-saturation', -0.6)
    } else if (type === 'fill') {
      if (id === 'road_area_pattern' || id === 'landcover_wetland') continue
      const color =
        src === 'water' ? c.water
        : id === 'park' ? c.park
        : id === 'landcover_wood' || id === 'landcover_grass' ? c.wood
        : id === 'landcover_sand' ? c.sand
        : id === 'landcover_ice' ? c.bg
        : id === 'landuse_residential' ? c.residential
        : id === 'building' ? c.building
        : src === 'landuse' || src === 'aeroway' ? c.landuse
        : null
      if (color) {
        paint(id, 'fill-color', color)
        paint(id, 'fill-outline-color', color)
      }
    } else if (type === 'line') {
      if (src === 'waterway') paint(id, 'line-color', c.water)
      else if (src === 'boundary') paint(id, 'line-color', c.boundary)
      else if (id === 'park_outline') paint(id, 'line-color', c.park)
      else if (src === 'aeroway') paint(id, 'line-color', c.minor)
      else if (src === 'transportation') paint(id, 'line-color', c[roadKey(id)])
    } else if (type === 'fill-extrusion' && id !== BUILDINGS_3D) {
      // The base style's own 3D buildings; ours below grows in more gently.
      map.setLayoutProperty(id, 'visibility', 'none')
    } else if (type === 'symbol') {
      const field = map.getLayoutProperty(id, 'text-field') as unknown
      if (field === undefined || field === null) continue
      if (/"name|\{name/.test(JSON.stringify(field))) {
        try {
          map.setLayoutProperty(id, 'text-field', ENGLISH_NAME)
        } catch {
          // A layer the style does not let us restyle keeps its own labels.
        }
      }
      const color =
        src === 'place' ? (/country|city|town/.test(id) ? c.text : c.textSoft)
        : src === 'poi' || src === 'aerodrome_label' ? c.poiText
        : src === 'transportation_name' ? c.roadText
        : src === 'water_name' || src === 'waterway' ? c.waterText
        : null
      if (!color) continue
      // A solid, unblurred halo: crisp letters over roads and buildings.
      paint(id, 'text-color', color)
      paint(id, 'text-halo-color', c.halo)
      paint(id, 'text-halo-width', 1.6)
      paint(id, 'text-halo-blur', 0)
      const earlier = EARLIER[id]
      if (earlier !== undefined) map.setLayerZoomRange(id, earlier, 24)
    }
  }

  // Buildings rise from street level: drawn from zoom 15, full height by 16.
  if (map.getLayer(BUILDINGS_3D) || !map.getSource('openmaptiles')) return
  const firstLabel = (map.getStyle()?.layers ?? []).find((layer) => layer.type === 'symbol')?.id
  map.addLayer(
    {
      id: BUILDINGS_3D,
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': c.building3d,
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          15, 0,
          16, ['coalesce', ['get', 'render_height'], 8],
        ],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.82,
      },
    },
    firstLabel,
  )
}
