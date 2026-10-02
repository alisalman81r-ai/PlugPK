// src/app/(main)/terms/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage, type LegalSection } from '@/components/shared/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms for using Plug.pk as a driver or as a partner listing a charger or an EV service.',
}

/*
  Plain-language terms written from what the site actually does today. They
  are a starting point and should be reviewed by a lawyer before they are
  relied on.
*/
const SECTIONS: LegalSection[] = [
  {
    id: 'about',
    title: 'About Plug.pk',
    body: (
      <p>
        Plug.pk is a guide to electric driving in Pakistan: a map of charging stations, a route planner, a car
        catalogue with prices and specifications, EV services, and a community for drivers. By using the site you
        agree to these terms. If you do not agree, please do not use it.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: (
      <>
        <p>
          You can browse without an account. Saving stations and routes, keeping your cars, writing reviews and
          posting in the community need one. When you create an account you agree to give accurate details and to
          keep your password private. You are responsible for what is done from your account.
        </p>
        <p>
          One account works both as a driver and as a partner. You can ask us to close it at any time by writing to{' '}
          <a href="mailto:hello@plug.pk">hello@plug.pk</a>.
        </p>
      </>
    ),
  },
  {
    id: 'information',
    title: 'Information on the site',
    body: (
      <>
        <p>
          We work to keep station details, car prices and specifications accurate, but they come from manufacturers,
          dealers, station operators and public sources, and they change. Prices marked “indicative”, “promo” or
          “launch price” are not offers from Plug.pk. Range and charging-time figures are estimates.
        </p>
        <p>
          Always confirm a price with the dealer and check a charger before you rely on it for a journey. Plug.pk does
          not sell cars or charging and is not responsible for a third party’s prices, service or equipment.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Reviews, posts and comments',
    body: (
      <>
        <p>What you post must be your own, honest and lawful. Do not post:</p>
        <ul>
          <li>false or misleading reviews, including reviews of your own business or a competitor’s;</li>
          <li>abuse, harassment, hate speech or anyone’s private information;</li>
          <li>spam, advertising or links to unrelated sites;</li>
          <li>anything that infringes someone else’s rights.</li>
        </ul>
        <p>
          You keep ownership of what you post and give Plug.pk permission to show it on the site. We may remove
          content, or suspend an account, that breaks these rules.
        </p>
      </>
    ),
  },
  {
    id: 'partners',
    title: 'Partners and business listings',
    body: (
      <>
        <p>
          A partner is anyone who lists a charger or an EV service. Every listing is checked before it goes live, and
          we may decline or remove a listing that is inaccurate, unsafe or breaks these terms. By submitting a listing
          you confirm that:
        </p>
        <ul>
          <li>you own or are authorised to represent the business or charger;</li>
          <li>its address, location, chargers and photos are accurate, and the photos are yours to share;</li>
          <li>the contact details you give may be shown publicly.</li>
        </ul>
        <p>
          If you list a home charger, its location and your phone number will be shown to drivers — you are told this
          before you submit. Paid plans are arranged with you directly; see{' '}
          <Link href="/partners">Partner Up</Link> for what each plan includes.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'Using the site fairly',
    body: (
      <p>
        Do not try to break, overload or gain unauthorised access to the site, scrape it in bulk, or use it to send
        unsolicited messages. Do not pretend to be someone else or a business you do not represent.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    body: (
      <p>
        The site is provided as it is. To the extent the law allows, Plug.pk is not liable for loss caused by relying
        on information on the site — for example a charger that is out of service, a price that has changed or a
        journey that took longer than estimated. Nothing in these terms limits rights you have under Pakistani law
        that cannot be limited.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as the site changes. The date at the top of this page shows when they last changed.
        If a change is significant, we will say so on the site.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        For questions about these terms, or to report content or a listing, write to{' '}
        <a href="mailto:hello@plug.pk">hello@plug.pk</a>. These terms are governed by the laws of Pakistan.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The rules for using Plug.pk — as a driver finding chargers and comparing cars, and as a partner listing a charger or an EV service."
      updated="2 October 2026"
      sections={SECTIONS}
    />
  )
}
