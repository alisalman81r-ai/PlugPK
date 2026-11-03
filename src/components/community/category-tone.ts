// src/components/community/category-tone.ts
//
// How each post category is coloured in the landing-v2 language: the tag
// tone it wears (.tag--green, --purple and so on in page-community.css) and
// the ground of the author's initial on a post card. Kept here rather than in
// lib/constants, which still carries the old palette's badge classes for any
// other reader of POST_CATEGORIES.

import type { TagTone } from '@/components/v2/ui'
import type { PostCategory } from '@/lib/types'

export const CATEGORY_TAG: Record<PostCategory, { tone: TagTone; className?: string }> = {
  // .tag--ink-soft: the neutral one.
  general: { tone: 'plain', className: 'border-ink/[0.12] bg-stone text-ink' },
  'charging-experience': { tone: 'green' },
  'trip-report': { tone: 'purple' },
  'vehicle-review': { tone: 'amber' },
  'buying-advice': { tone: 'volt' },
  'ev-news': { tone: 'red' },
}

/** The avatar ground on a post card, by category (.post[data-cat] .post__av). */
export const CATEGORY_AVATAR: Record<PostCategory, string> = {
  general: 'bg-ink',
  'charging-experience': 'bg-[#157A45]',
  'trip-report': 'bg-[#5B3FC4]',
  'vehicle-review': 'bg-[#8A5300]',
  'buying-advice': 'bg-volt-ink',
  'ev-news': 'bg-[#B42E05]',
}
