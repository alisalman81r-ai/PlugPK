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
 *   - Route answers describe the planner as it plans now: from the listed
 *     stations and approved partners, against the car's real range, start
 *     charge and charging speed. Nothing claims live availability.
 *   - Community answers describe what is saved: posts, comments and likes are
 *     written to the database for signed-in members, and nothing else is.
 *   - One price and one turnaround, stated the same way as Partner Up's plans:
 *     PKR 4,999 a month arranged directly, and "checked before it goes live"
 *     with no promised number of hours, because nothing measures one.
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
      'A plan worked out for your car. You give it a start, a destination, your vehicle and your current charge, and it places charging stops using that car’s real range and charging speed, with an estimate of how long each stop takes. If the trip cannot be done with the chargers listed along the way, it says so rather than inventing a stop.',
  },
  {
    question: 'Which chargers does it plan with?',
    answer:
      'The ones on the map: the stations Plug.pk lists and partner businesses that have been checked and approved. It does not know whether a charger is in use or working right now — there is no live connection to the hardware — so call ahead using the number on a listing before you rely on a stop.',
  },
  {
    question: 'Why does it assume I will not charge to full?',
    answer:
      'Because charging slows sharply above roughly eighty per cent. On a long drive it is usually faster to make a shorter stop and move on than to wait out the last stretch of a full charge.',
  },
  {
    question: 'Can I save a route?',
    answer:
      'Yes, with an account. A saved route keeps the start, destination, car and starting charge, and opening it plans the trip again against the chargers listed at that moment.',
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
      'Yes, with an account. Sign in and you can start a discussion, reply to one and like posts; everything you post is saved and shown to everyone. Reading needs no account at all.',
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
      'A listing is PKR 4,999 a month. There is no card payment on the site: applying is free, every listing is checked by a person before it goes live, and the paid terms are agreed with you directly. Chains and multi-site operators can ask about an Enterprise arrangement.',
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

/*
  The range converter's questions. Every figure in these answers is one the
  converter itself uses (lib/range-standards), so the page never says one thing
  in the tool and another in the FAQ.
*/
export const RANGE_FAQS: FaqItem[] = [
  {
    question: "What's the difference between EPA, WLTP, NEDC and CLTC?",
    answer:
      'They are four official test drives for measuring range. WLTP is the European standard and the most common reference. EPA is the US rating and usually the strictest, because it is corrected for faster driving and climate control. NEDC is the older European test WLTP replaced, and CLTC is the Chinese one — both are gentler, so they give higher figures.',
  },
  {
    question: 'Why does the same EV have different range figures?',
    answer:
      'Because each figure comes from a different test, not a different car. The BYD Atto 3 with the 60.48 kWh battery, for example, is published at 510 km on CLTC and 420 km on WLTP. Slower, gentler tests with more idling use less energy per km, so the same battery goes further on paper.',
  },
  {
    question: 'Is WLTP my actual driving range?',
    answer:
      'No. WLTP is a lab drive at 23°C with a fixed speed pattern. In one comparison of 15 EVs, the range actually observed in mixed driving averaged about 79% of the WLTP figure, between 73% and 86% depending on the car. A Pakistani summer is a good deal harder on a battery than 23°C.',
  },
  {
    question: 'Why are CLTC figures often higher?',
    answer:
      'CLTC is modelled on Chinese city traffic: an average of about 29 km/h, a top speed of 114 km/h, and over a fifth of the test spent standing still. WLTP averages 46.5 km/h and reaches 131 km/h. Slow driving costs an EV very little, so CLTC figures typically come out around a quarter higher than WLTP for the same car.',
  },
  {
    question: 'How much range can I realistically expect in Pakistan?',
    answer:
      'It depends most on speed and heat. As a rough guide from published tests: about 73–86% of the WLTP figure in mild mixed driving, around 60–70% in 35°C-plus heat with the AC on, and roughly 60–80% on a motorway at 120 km/h. The converter works these out for your figure. They are estimates for a healthy battery, not guarantees.',
  },
  {
    question: 'Does using AC reduce EV range?',
    answer:
      'Yes. In testing by AAA, range fell by 17% at 35°C with the AC running, compared with mild weather; without the AC it fell by only 4%. The effect is largest in slow traffic, where the AC is a bigger share of what the car uses. Pre-cooling the cabin while the car is still plugged in helps.',
  },
  {
    question: 'Does motorway driving reduce range?',
    answer:
      'Yes, more than anything else you control. Air resistance rises steeply with speed. In one test of 57 EVs at a steady 130 km/h, most reached only 60–75% of their WLTP range. Driving at 100–110 km/h instead of 120 makes a noticeable difference on a long run.',
  },
  {
    question: 'Does hot weather affect EV range?',
    answer:
      'Yes. The battery has to be kept cool, and the cabin needs cooling too. Heat alone costs a little; heat with the AC running costs a lot more. A battery that has been sitting in the sun may also charge more slowly until it cools down.',
  },
  {
    question: 'How accurate is this converter?',
    answer:
      'It gives an approximate comparison, not a conversion. The typical figures come from cars published or measured on more than one standard, and each result shows a likely spread because cars differ in how they cope with each test. Two cars with the same WLTP figure can have quite different EPA or CLTC figures. Where a car publishes a figure on the standard you want, that figure beats this estimate.',
  },
  {
    question: 'Which range standard should I look at when comparing EVs?',
    answer:
      'Any one — as long as both cars are on the same one. WLTP is the most widely published, so it is usually the easiest common ground. If one car only has a CLTC figure, convert it to WLTP here and compare the spreads as well as the middle figures. And remember range is one factor among several, alongside battery size, charging speed and where you can charge.',
  },
]
