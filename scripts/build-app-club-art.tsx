// scripts/build-app-club-art.tsx
//
// Writes the website's club covers into the app prototype, so both show the
// same picture of each city. Renders CityScene — the component the website's
// club cards use (src/components/community/CityLandmark.tsx) — to one static
// SVG per city in public/app-prototype/clubs/. Run after changing a drawing:
//
//   npx tsx scripts/build-app-club-art.tsx

import fs from 'node:fs'
import path from 'node:path'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { CityScene } from '../src/components/community/CityLandmark'

/** `Dera Ghazi Khan` → `dera-ghazi-khan`, as in src/lib/city-photos. */
const citySlug = (city: string) => city.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Every city with a club in the app's data, plus the eight drawn landmarks, so a
// new club in a drawn city has its cover ready.
const DRAWN = ['Lahore', 'Islamabad', 'Karachi', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan', 'Quetta']
const dataFile = fs.readFileSync(path.resolve('public/app-prototype/data.js'), 'utf8')
const data = JSON.parse(dataFile.slice(dataFile.indexOf('{'), dataFile.lastIndexOf('}') + 1)) as {
  clubs: { city: string }[]
}
const cities = [...new Set([...DRAWN, ...data.clubs.map((club) => club.city)])]

const out = path.resolve('public/app-prototype/clubs')
fs.mkdirSync(out, { recursive: true })
for (const city of cities) {
  const svg = renderToStaticMarkup(<CityScene city={city} />)
    // A standalone file needs the namespace; inline in a page it is implied.
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  fs.writeFileSync(path.join(out, `${citySlug(city)}.svg`), svg)
}
// A city with no drawing gets the website's generic skyline, never another city's landmark.
fs.writeFileSync(path.join(out, 'generic.svg'), renderToStaticMarkup(<CityScene city="generic" />).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))
console.log(`wrote ${cities.length} club covers and generic.svg to public/app-prototype/clubs`)
