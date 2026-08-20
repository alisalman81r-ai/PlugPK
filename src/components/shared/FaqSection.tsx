// src/components/shared/FaqSection.tsx
import { ChevronDown, HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The common questions block, shared by every page that has one.
 *
 * Built on native details/summary rather than React state, for three reasons:
 * it is keyboard and screen-reader accessible without any work, it opens
 * before JavaScript arrives, and it has no hooks — so the same component drops
 * into the server-rendered pages and the client-rendered ones (map, routes,
 * services, community are all 'use client') without a wrapper.
 *
 * Styling follows the Partner Up cards: weight from the edge and the depth,
 * never a fill.
 */

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqSectionProps {
  items: FaqItem[]
  /** Overrides the default heading when a page wants to be more specific. */
  title?: string
  eyebrow?: string
  /** Alternates with the section above it on each page. */
  tone?: 'white' | 'muted'
  className?: string
}

export function FaqSection({
  items,
  title = 'Common questions',
  eyebrow = 'FAQ',
  tone = 'muted',
  className,
}: FaqSectionProps) {
  if (items.length === 0) return null

  return (
    <section
      className={cn(
        'py-16 lg:py-24',
        tone === 'muted' ? 'bg-slate-50' : 'bg-white',
        className,
      )}
    >
      <div className="container-plug">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 text-ui-sm font-bold uppercase tracking-widest text-plug-blue-600">
            <HelpCircle size={14} aria-hidden="true" />
            {eyebrow}
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {items.map((item) => (
            <details
              key={item.question}
              className={cn(
                'group rounded-2xl bg-gradient-to-b from-slate-300 via-slate-300 to-slate-200 p-[1.5px]',
                'shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_28px_-20px_rgba(15,23,42,0.35)]',
                'transition-all duration-300',
                'hover:from-plug-blue-500 hover:via-plug-cyan-400 hover:to-plug-blue-300',
                'open:from-plug-blue-500 open:via-plug-cyan-400 open:to-plug-blue-300',
                'open:shadow-[0_12px_26px_-8px_rgba(37,99,235,0.20),0_28px_60px_-24px_rgba(37,99,235,0.34)]',
              )}
            >
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center justify-between gap-4 rounded-[calc(1rem-1.5px)] bg-white px-6 py-5',
                  'text-ui font-semibold text-slate-900 transition-colors',
                  'marker:hidden [&::-webkit-details-marker]:hidden',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                  'group-open:rounded-b-none group-open:pb-3.5',
                )}
              >
                {item.question}
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180 group-open:text-plug-blue-600"
                />
              </summary>

              <div className="rounded-b-[calc(1rem-1.5px)] bg-white px-6 pb-5">
                <p className="border-t border-slate-100 pt-4 text-ui leading-relaxed text-slate-500">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
