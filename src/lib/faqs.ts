// src/lib/faqs.ts
import type { FaqItem } from '@/components/shared/FaqSection'

/**
 * The common questions for each page.
 *
 * Kept together so every answer can be read against the others in one place,
 * and because a published answer is a promise in the same way a published
 * price is. Each one below describes what the application actually does today,
 * not what it is intended to do:
 *
 *   - Nothing here claims live availability. The map carries installed port
 *     counts entered by operators; there is no telemetry feed.
 *   - Nothing here claims route planning uses the live station list. It does
 *     not — useRoutePlanner works from fixtures and estimates stops from
 *     distance, so the answer describes it as an estimate.
 *   - Nothing here invites someone to post to the community as though it will
 *     be saved. CreatePostForm does not write yet, and the answer says so.
 *
 * If a feature changes, its answer changes with it.
 */

export const MAP_FAQS: FaqItem[] = [
  {
    question: 'Where do the chargers on this map come from?',
    answer:
      'Two places. Stations entered and checked by the Plug.pk team, and listings submitted by businesses and home owners that we have verified. Both appear as pins; a partner listing says so under its name, and a home charger is labelled as one so you know you are heading to a driveway rather than a forecourt.',
  },
  {
    question: 'Does the map show whether a charger is free right now?',
    answer:
      'No, and it does not pretend to. What you see is how many ports are installed, not how many are in use — Plug.pk has no live connection to the hardware. Call ahead using the number on a listing if arriving to a free bay matters for your trip.',
  },
  {
    question: 'Can I filter for the connector my car uses?',
    answer:
      'Yes. Filter by connector type, charging speed and city, and the list beside the map narrows with it. Each listing also shows the connector types and maximum power at that location before you set off.',
  },
  {
    question: 'A charger is missing, or the details are wrong. What now?',
    answer:
      'If it is yours, list it through Partner Up and it will appear once we have checked the address and specs. If it belongs to someone else, tell us and we will look into it — accuracy is the whole point of the map, and a wrong pin costs a driver a journey.',
  },
  {
    question: 'Does it cost anything to use the map?',
    answer:
      'No. Searching, filtering, opening a listing and taking directions are free, with no account needed. An account only becomes useful when you want to save listings or leave a review.',
  },
]

export const ROUTES_FAQS: FaqItem[] = [
  {
    question: 'What does the route planner give me?',
    answer:
      'An estimate. You give it a start, a destination, your vehicle and your current charge, and it works out roughly how many charging stops a trip that long needs and where they would fall. Treat it as a sanity check on whether a journey is realistic, then confirm the stops on the map before you rely on them.',
  },
  {
    question: 'Is it using live charger data?',
    answer:
      'Not yet. Stop planning currently works from a fixed set of stations rather than the live map, so a suggested stop may not match what is on the map today. Connecting the two is on the list; until it is done, the map is the source of truth for what actually exists.',
  },
  {
    question: 'Why does it assume I will not charge to full?',
    answer:
      'Because charging slows sharply above roughly eighty per cent. On a long drive it is usually faster to make a shorter stop and move on than to wait out the last stretch of a full charge.',
  },
  {
    question: 'Can I save a route?',
    answer:
      'Saving routes is not stored yet, so a plan lasts as long as the page. Saved listings do persist to your account — bookmark the stops you care about from the map instead.',
  },
]

export const SERVICES_FAQS: FaqItem[] = [
  {
    question: 'What counts as an EV service here?',
    answer:
      'The businesses an EV owner needs that are not charging: workshops and service centres, insurers, charger installers, battery specialists and dealerships. Each entry carries its category, city, contact details and opening hours where we have them.',
  },
  {
    question: 'Are these businesses vetted?',
    answer:
      'We check that the contact details and location are real before an entry is published. That is not the same as endorsing the work — a listing here is a lead, not a recommendation, and the rating shown comes from people who used them.',
  },
  {
    question: 'How do I get my business listed?',
    answer:
      'Ask us. Service entries are added by the Plug.pk team rather than through a public form, so send a meeting request from the business page and we will take the details. If what you actually have is a charger, list it yourself through Partner Up instead.',
  },
  {
    question: 'Do you show prices?',
    answer:
      'No. Rates for servicing, insurance and installation vary too much by vehicle and condition for a published figure to be useful, and a stale price is worse than none. Contact the business directly for a quote.',
  },
]

export const COMMUNITY_FAQS: FaqItem[] = [
  {
    question: 'What is the community for?',
    answer:
      'The things a map cannot tell you: which chargers are actually reliable, what a car is like to live with in Pakistani traffic, what an import really costs by the time it is on the road. Posts are grouped by category, and clubs are listed separately for people who want to meet in person.',
  },
  {
    question: 'Can I post or comment?',
    answer:
      'Not yet. The composer opens and accepts what you write, but posting is not connected to storage, so nothing you submit is kept — we would rather say that than quietly discard it. Reading is fully working, and reviews on a charging listing do save if you want to share an experience today.',
  },
  {
    question: 'Do I need an account to read?',
    answer:
      'No. Posts, comments and clubs are open to everyone. An account matters for the parts tied to you — saved listings, your reviews, and a business listing if you have chargers to share.',
  },
  {
    question: 'How are clubs different from posts?',
    answer:
      'A club is a group that meets, usually around a city or a make of car. A post is a single question or story. Clubs are listed with their city and focus so you can find one near you.',
  },
]

export const PARTNER_FAQS: FaqItem[] = [
  {
    question: 'What does it cost to list my charger?',
    answer:
      'Nothing. A free listing puts you on the map and in the partner directory, with photos, reviews and a dashboard, for as long as you want it and with no card required. The paid plans add placement and promotion on top of that; they do not unlock being listed.',
  },
  {
    question: 'Do you take a cut of what drivers pay me?',
    answer:
      'No. Plug.pk does not set your rates, process the payment or take a percentage. Whatever a driver pays to charge is between you and them, and we do not publish your prices, because a stale rate on a map is a promise you would have to honour.',
  },
  {
    question: 'Can I list the charger at my house?',
    answer:
      'Yes — choose Home Charger when you list. It works exactly like a venue listing, and it is labelled as a home on the map so drivers know what they are arriving at. Be aware it puts your address, its coordinates and your phone number in front of anyone using the map; the form says so before you submit.',
  },
  {
    question: 'How long until my listing is live?',
    answer:
      'It goes live once we have checked it. We confirm the address, the map pin and the charger details before publishing, because a driver who sets off towards a wrong pin loses a journey. You can see the status of your listing in your dashboard at any time.',
  },
  {
    question: 'How do I pay for a paid plan?',
    answer:
      'By arrangement with us, not on the site — there is no card payment here yet. Send a meeting request and we will go through what you need and what it costs before anything is agreed.',
  },
]
