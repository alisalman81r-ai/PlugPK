// src/components/shared/LegalPage.tsx
import Link from 'next/link'

import { Hl, PageHero, WRAP } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * The layout shared by /terms and /privacy, in the landing-v2 language: the
 * ink page hero (title with its last word in volt, the intro, the date),
 * then the clauses on chalk — a sticky contents card beside one white sheet
 * of numbered sections, each with an anchor so a clause can be linked to.
 */

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

export interface LegalPageProps {
  eyebrow: string
  title: string
  intro: string
  updated: string
  sections: LegalSection[]
}

/** "Terms of Service" → "Terms of" + volt "Service". */
function splitTitle(title: string) {
  const at = title.lastIndexOf(' ')
  return at === -1 ? { head: '', tail: title } : { head: title.slice(0, at + 1), tail: title.slice(at + 1) }
}

/** Body copy: lists, links and emphasis in the account pages' type. */
export const LEGAL_PROSE =
  'space-y-4 text-base leading-[1.7] text-muted [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:decoration-volt [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a:hover]:bg-volt-tint [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-fog'

export function LegalPage({ eyebrow, title, intro, updated, sections }: LegalPageProps) {
  const { head, tail } = splitTitle(title)
  const isTerms = title.startsWith('Terms')

  return (
    <div>
      <PageHero
        lift={false}
        eyebrow={eyebrow}
        title={
          <>
            {head}
            <Hl dark>{tail}</Hl>
          </>
        }
        sub={intro}
        note={
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/55">Last updated {updated}</span>
        }
      />

      <section data-theme="light" className="bg-chalk py-[clamp(48px,6vw,88px)]">
        <div className={cn(WRAP, 'grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10')}>
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-[calc(var(--nav-h)+20px)] rounded-3xl border border-ink/10 bg-white p-5">
              <p className="mb-3 px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                On this page
              </p>
              <ol className="grid gap-0.5">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex min-h-10 items-baseline gap-2.5 rounded-xl px-2 py-2 text-sm leading-snug text-[#33363b] transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      <span className="font-mono text-xs tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="min-w-0 rounded-[28px] border border-ink/10 bg-white px-[clamp(20px,4vw,56px)] py-[clamp(12px,2vw,24px)] shadow-e1">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="max-w-[46rem] scroll-mt-[calc(var(--nav-h)+24px)] border-t border-ink/10 py-8 first:border-t-0"
              >
                <h2 className="m-0 flex items-baseline gap-3 font-display text-[clamp(24px,2.4vw,30px)] leading-[1.15] text-ink">
                  <span className="font-mono text-sm font-semibold tabular-nums text-volt-ink">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </h2>
                <div className={cn('mt-4', LEGAL_PROSE)}>{section.body}</div>
              </section>
            ))}

            <p className="max-w-[46rem] border-t border-ink/10 py-8 text-[15px] text-muted">
              Questions about this page? Write to{' '}
              <a href="mailto:hello@plug.pk" className="font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4">
                hello@plug.pk
              </a>
              . See also the{' '}
              <Link
                href={isTerms ? '/privacy' : '/terms'}
                className="font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4"
              >
                {isTerms ? 'Privacy Policy' : 'Terms of Service'}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
