# City photographs

Cover photographs for the EV club cards on `/community/clubs`.

Drop a file in here and the cards for that city start using it on the next
request. There is nothing to import, register, or redeploy — `src/lib/city-photos.ts`
resolves covers by reading this folder.

## Naming

The filename is the city name, lowercased, with anything that is not a letter or
a digit turned into a hyphen:

| City       | File               |
| ---------- | ------------------ |
| Lahore     | `lahore.jpg`       |
| Islamabad  | `islamabad.jpg`    |
| Karachi    | `karachi.jpg`      |
| Rawalpindi | `rawalpindi.jpg`   |
| Faisalabad | `faisalabad.jpg`   |
| Peshawar   | `peshawar.jpg`     |
| Multan     | `multan.jpg`       |
| Quetta     | `quetta.jpg`       |

`.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` all work. Any city without a file
here falls back to a drawn landmark (`src/components/community/CityLandmark.tsx`),
so a missing photograph is never a broken card.

## Specification

- **2:1**, landscape. The covers render at about 280×136 on a desktop grid and
  full width on a phone.
- **1200×600 minimum.** `next/image` resizes down to the served width, so larger
  is fine and smaller is not — an 800px file upscaled into a full-width phone
  cover looks soft.
- **The subject belongs in the top two thirds.** The cover is cropped with
  `object-cover` and a dark scrim runs across the top for the city chip, so a
  skyline sitting on the bottom edge gets cut.
- Compress before committing. The station photographs in `../stations` sit
  between 120 and 420 kB at 1600px, which is the right neighbourhood.

## Licensing

These ship inside a commercial product, so each one needs a licence that permits
that. Unsplash and Pexels both do, and both have usable Pakistani city
photography. A commissioned shoot is better again, and is the only way to get
pictures of the actual clubs.

An image saved from a search results page is not licensed, whatever it looks
like. Please do not add one.

## Why this folder matters

Until a city has a file here, its cards show that city drawn instead — a scene
built around its best-known landmark, in `src/components/community/CityLandmark.tsx`.
The drawings are good, but they are drawings, and a photograph of Badshahi Mosque
at dusk beats an illustration of it.

The resolution order lives in `src/lib/city-photos.ts`:

1. the club's own `coverPhoto` from the database
2. **this folder**
3. the drawn scene

There was briefly a step between 2 and 3 that used the project's own EV
photography from `../stations`. It is gone. Those are real, licensed photographs
— of charging hardware, shot in Europe. A cover is meant to tell you which city
a club is in at a glance, and a German parking sign on the Rawalpindi card does
the opposite. A drawing of the right city beats a photograph of the wrong one.
