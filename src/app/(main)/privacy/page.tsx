// src/app/(main)/privacy/page.tsx
import type { Metadata } from 'next'

import { LegalPage, type LegalSection } from '@/components/shared/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Plug.pk collects, why, who it is shared with, and how to have it changed or deleted.',
}

/*
  Written from what the code stores and sends today (the User, SavedStation,
  SavedRoute, UserVehicle, Review, CommunityPost, Comment, Business,
  MeetingRequest and BusinessDailyStat tables; one session cookie; Vercel,
  Supabase, Vercel Blob, OpenFreeMap and Google Maps links). Keep it in step
  when that changes, and have it reviewed by a lawyer.
*/
const SECTIONS: LegalSection[] = [
  {
    id: 'summary',
    title: 'In short',
    body: (
      <ul>
        <li>We collect what you give us to run your account, and a little about how listings are used.</li>
        <li>We do not sell your information and we do not show advertising.</li>
        <li>Your password is stored only as a one-way hash — nobody at Plug.pk can read it.</li>
        <li>You can ask us to correct or delete your information at any time.</li>
      </ul>
    ),
  },
  {
    id: 'collect',
    title: 'What we collect',
    body: (
      <>
        <p>
          <strong>Your account:</strong> your name, email address and password (stored as a hash), and, if you add
          them, your city, profile picture and the cars you drive.
        </p>
        <p>
          <strong>What you save and post:</strong> saved stations and routes (start, destination, car and battery
          level), reviews, community posts and comments.
        </p>
        <p>
          <strong>If you are a partner:</strong> your business name and type, contact name, email and phone number,
          address and map location, charger details and the photos you upload. If you request a meeting from the
          Partner Up page, the details you enter there.
        </p>
        <p>
          <strong>Listing activity:</strong> how often a partner’s listing is viewed and how often drivers ask for
          directions to it, counted as daily totals so the partner can see them. These counts are not linked to who
          viewed the listing.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use it',
    body: (
      <ul>
        <li>to run your account and remember what you have saved;</li>
        <li>to suggest chargers that fit your car and plan routes around its range;</li>
        <li>to show your reviews, posts and comments with your name and picture;</li>
        <li>to check partner listings before they go live, and to show approved listings to drivers;</li>
        <li>to keep the site secure and to deal with abuse.</li>
      </ul>
    ),
  },
  {
    id: 'public',
    title: 'What other people can see',
    body: (
      <p>
        Your name and profile picture appear beside your reviews, posts and comments. Your email address, city, cars
        and saved items are not shown to other users. For an approved partner listing, the business name, address,
        location, chargers, photos and contact phone number are public — for a home charger this includes where it
        is, and you are told so before you submit.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        We use one essential cookie to keep you signed in. It holds a signed reference to your account, cannot be read
        by scripts on the page, and is removed when you sign out. We do not use advertising or tracking cookies.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    body: (
      <>
        <p>We do not sell or rent your information. It is processed by the services that run the site:</p>
        <ul>
          <li>Vercel, which hosts the site and stores uploaded photos;</li>
          <li>Supabase, which hosts the database;</li>
          <li>OpenFreeMap, which serves map tiles (it sees the map area you are viewing, not who you are).</li>
        </ul>
        <p>
          When you press Navigate, the destination opens in Google Maps, under Google’s own privacy policy. We may also
          disclose information if the law requires it.
        </p>
      </>
    ),
  },
  {
    id: 'keep',
    title: 'How long we keep it',
    body: (
      <p>
        We keep your account information for as long as your account is open. Removing a car, saved station or saved
        route deletes it straight away. When an account is deleted, its saved stations, saved routes and cars are
        deleted with it.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices',
    body: (
      <p>
        You can change your name, city, picture and cars from your dashboard at any time. To get a copy of your
        information, correct something you cannot edit yourself, or delete your account, write to{' '}
        <a href="mailto:hello@plug.pk">hello@plug.pk</a> from the email address on the account.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        Passwords are hashed with scrypt and a unique salt, sessions are signed and sent only over HTTPS, and access to
        the admin portal is limited to staff accounts. No system is perfectly secure, so please use a password you do
        not use anywhere else.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        If what we collect or how we use it changes, we will update this page and the date at the top. Significant
        changes will be announced on the site.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What Plug.pk collects, why, who it is shared with, and how to have it changed or deleted."
      updated="2 October 2026"
      sections={SECTIONS}
    />
  )
}
