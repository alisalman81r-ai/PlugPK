// src/components/shared/FaqSection.tsx
import type * as React from 'react'

import { Faq, SectionHead, WRAP } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * The common questions block, shared by every page that has one.
 *
 * Built on native details/summary (see Faq in components/v2/ui), so it is
 * keyboard and screen-reader accessible without any work, opens before
 * JavaScript arrives, and drops into server and client pages alike.
 *
 * Styled as landing-v2's .faq: white rows on chalk, a disc that turns volt
 * and rotates as a row opens.
 */

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqSectionProps {
  items: FaqItem[]
  /** Overrides the default heading when a page wants to be more specific. */
  title?: React.ReactNode
  eyebrow?: string
  /** muted is chalk, white is paper: alternate with the section above. */
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
      data-theme="light"
      className={cn('py-[clamp(80px,9vw,128px)]', tone === 'muted' ? 'bg-chalk' : 'bg-paper', className)}
    >
      <div className={WRAP}>
        <SectionHead eyebrow={eyebrow} title={title} />
        <Faq items={items.map((item) => ({ q: item.question, a: item.answer }))} />
      </div>
    </section>
  )
}
