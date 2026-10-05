// src/components/admin/ReviewQueue.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Optimistic review state for one post in the community queue.
 *
 * Marking a post reviewed used to wait for the whole round trip — the write,
 * the audit row, then a re-render of the entire page against a database in
 * another region — before anything on screen changed, which read as a frozen
 * button. Now the click is answered at once: the tick and the "Not reviewed"
 * badge go, and the post drops to the bottom of the list (CSS `order` inside
 * the list's flex column, so no re-sorting of server-rendered markup). The
 * save carries on in the background and is rolled back with a message if it
 * fails.
 */

interface ReviewState {
  reviewed: boolean
  setReviewed: (value: boolean) => void
}

const ReviewContext = React.createContext<ReviewState | null>(null)

export function useReviewState(): ReviewState | null {
  return React.useContext(ReviewContext)
}

export function ReviewQueueItem({
  initiallyReviewed,
  className,
  children,
}: {
  initiallyReviewed: boolean
  className?: string
  children: React.ReactNode
}) {
  const [reviewed, setReviewed] = React.useState(initiallyReviewed)
  // When the server's fresh render arrives it is the truth again.
  React.useEffect(() => setReviewed(initiallyReviewed), [initiallyReviewed])

  const justReviewed = reviewed && !initiallyReviewed
  const value = React.useMemo(() => ({ reviewed, setReviewed }), [reviewed])

  return (
    <ReviewContext.Provider value={value}>
      <article
        className={cn(className, 'transition-opacity duration-300', justReviewed && 'opacity-75')}
        // Order 1 sends a post reviewed on this screen after every other post.
        style={justReviewed ? { order: 1 } : undefined}
      >
        {children}
      </article>
    </ReviewContext.Provider>
  )
}

/** The amber "Not reviewed" pill, gone the moment the tick is pressed. */
export function NotReviewedBadge() {
  const state = useReviewState()
  if (state?.reviewed) return null
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
      Not reviewed
    </span>
  )
}
