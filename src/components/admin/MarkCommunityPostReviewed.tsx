// src/components/admin/MarkCommunityPostReviewed.tsx
'use client'

import { Check } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { markCommunityPostReviewed } from '@/lib/db/actions'

import { useAdminToast } from './AdminToast'
import { useReviewState } from './ReviewQueue'
import { runAction } from './run-action'

/**
 * Clears a post from the "not yet reviewed" queue.
 *
 * Optimistic: inside a ReviewQueueItem the click hides this tick and moves the
 * post to the bottom straight away, and the save runs behind it. A failure is
 * said out loud and the post goes back to unreviewed, rather than leaving the
 * screen claiming something the database does not.
 */
export function MarkCommunityPostReviewed({
  postId,
  reviewed = false,
}: {
  postId: string
  reviewed?: boolean
}) {
  const router = useRouter()
  const toast = useAdminToast()
  const queue = useReviewState()
  const [, startTransition] = React.useTransition()

  // Nothing left to do on a reviewed post, so there is no tick to press.
  if (queue ? queue.reviewed : reviewed) return null

  const markReviewed = async () => {
    queue?.setReviewed(true)
    const result = await runAction(() => markCommunityPostReviewed(postId))
    if (!result.ok) {
      queue?.setReviewed(false)
      toast.error(result.message ?? 'Could not mark that post as reviewed.')
      return
    }
    toast.success(result.message ?? 'Marked as reviewed.')
    // Updates the counts and the nav badge without holding up the click.
    startTransition(() => router.refresh())
  }

  return (
    <button
      type="button"
      onClick={() => void markReviewed()}
      aria-label="Mark post as reviewed"
      title="Mark as reviewed"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <Check size={16} aria-hidden="true" />
    </button>
  )
}
