// src/components/station/WriteReviewForm.tsx
'use client'

import { CheckCircle2, Star, User } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Button, Input, Textarea } from '@/components/ui'
import { submitReview, type ReviewTarget } from '@/lib/db/review-actions'
import { useMyCar } from '@/hooks/useMyCar'
import { cn } from '@/lib/utils'

export interface WriteReviewFormProps {
  stationId: string
  stationName: string
  /** The listing's URL segment, for the sign-in link's way back. Not the id. */
  stationSlug: string
  /**
   * Which table the listing lives in. Business listings appear on the map
   * alongside stations, and a review of one has to be filed against the right
   * row or the owner never sees it.
   */
  target?: ReviewTarget
  onSuccess?: () => void
}

// Matches the server action's limit, so a review that fits here is never refused there.
const MAX_COMMENT = 1000
const MAX_VEHICLE = 120

const RATING_LABEL: Record<number, { text: string; className: string }> = {
  0: { text: 'Select a rating', className: 'text-muted' },
  1: { text: 'Poor', className: 'text-red-500' },
  2: { text: 'Fair', className: 'text-orange-500' },
  3: { text: 'Good', className: 'text-amber-500' },
  4: { text: 'Very Good', className: 'text-lime-600' },
  5: { text: 'Excellent', className: 'text-green-600' },
}

export function WriteReviewForm({
  stationId,
  stationName,
  stationSlug,
  target = 'station',
  onSuccess,
}: WriteReviewFormProps) {
  const [rating, setRating] = React.useState(0)
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)
  const [comment, setComment] = React.useState('')
  const [vehicle, setVehicle] = React.useState('')
  // The car the review was charged with: the driver's own, from their garage,
  // until they type something else.
  const myCar = useMyCar()
  React.useEffect(() => {
    if (myCar) setVehicle((current) => current || myCar.name)
  }, [myCar])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [needsSignIn, setNeedsSignIn] = React.useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)

  const reset = () => {
    setRating(0)
    setHoverRating(null)
    setComment('')
    setVehicle('')
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (rating === 0 || comment.trim().length === 0) {
      setError('Add a rating and a short description of your visit.')
      return
    }
    if (comment.length > MAX_COMMENT) {
      setError(`Reviews are limited to ${MAX_COMMENT} characters.`)
      return
    }

    setError(null)
    setNeedsSignIn(false)
    setAlreadyReviewed(false)
    setIsSubmitting(true)

    // This was `await new Promise(r => setTimeout(r, 1500))` followed by the
    // success screen — a fake delay standing in for a request never made, so
    // every review was discarded on the next page load.
    const result = await submitReview(target, stationId, rating, comment, vehicle)
    setIsSubmitting(false)

    if (!result.ok) {
      setNeedsSignIn(result.needsSignIn ?? false)
      setAlreadyReviewed(result.alreadyReviewed ?? false)
      setError(result.message ?? 'Could not post your review.')
      return
    }

    setIsSuccess(true)
    onSuccess?.()
  }

  if (isSuccess) {
    return (
      <div className="flex animate-scale-in flex-col items-center rounded-[22px] border border-ink/10 bg-paper p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-volt">
          <CheckCircle2 size={28} className="text-ink" aria-hidden="true" />
        </span>
        <p className="mt-4 font-display text-2xl text-ink">Review submitted</p>
        <p className="mt-1 text-muted">Thank you for helping the community.</p>
      </div>
    )
  }

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink"
        >
          <User size={20} className="text-volt" />
        </span>

        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="h-12 flex-1 rounded-full border-[1.5px] border-ink/10 bg-white px-5 text-left text-[15px] text-muted transition-colors duration-200 hover:border-ink/30 hover:text-ink"
        >
          Share your experience...
        </button>
      </div>
    )
  }

  const displayRating = hoverRating ?? rating
  const label = RATING_LABEL[displayRating] ?? RATING_LABEL[0]

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[22px] border border-ink/10 bg-paper p-5 sm:p-6"
    >
      <h3 className="mb-6 font-display text-[22px] leading-tight text-ink">Write a review</h3>

      <fieldset className="mb-6">
        <legend className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">Your rating *</legend>
        <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(null)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onFocus={() => setHoverRating(value)}
              onBlur={() => setHoverRating(null)}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              aria-pressed={rating === value}
              className={cn(
                'cursor-pointer rounded transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                rating === value && 'animate-scale-in',
              )}
            >
              <Star
                size={36}
                className={value <= displayRating ? 'fill-[#F5A524] text-[#F5A524]' : 'text-ink/15'}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <p className={cn('mt-2 text-sm font-medium', label?.className)}>{label?.text}</p>
      </fieldset>

      <div className="mb-5">
        <Input
          label="Your EV (optional)"
          value={vehicle}
          onChange={(event) => setVehicle(event.target.value)}
          maxLength={MAX_VEHICLE}
          placeholder="e.g. BYD Atto 3, MG ZS EV"
          className="h-11 rounded-xl"
        />
      </div>

      <div className="relative mb-1">
        <Textarea
          label="Your Review *"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={`Describe your experience... Was the charger working? How long did you wait? What speed did you get?`}
          className="min-h-[120px] resize-y"
        />
      </div>

      <p
        className={cn(
          'mb-4 text-right font-mono text-xs',
          comment.length > MAX_COMMENT ? 'text-red-600' : 'text-muted',
        )}
      >
        {comment.length}/{MAX_COMMENT}
      </p>

      {error ? (
        <p className="mb-4 text-sm text-red-600">
          {error}
          {/* Signing in is the one failure the visitor can act on directly, so
              it carries a link rather than leaving them to find the page. */}
          {needsSignIn ? (
            <>
              {' '}
              <Link
                href={`/login?redirect=${encodeURIComponent(`/station/${stationSlug}`)}`}
                className="font-semibold underline"
              >
                Sign in
              </Link>
            </>
          ) : null}
          {alreadyReviewed ? (
            <>
              {' '}
              <Link href="/dashboard/reviews" className="font-semibold underline">
                Your reviews
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setIsExpanded(false)
            reset()
          }}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={rating === 0 || comment.trim().length === 0}
        >
          Submit review
        </Button>
      </div>

      <input type="hidden" name="stationId" value={stationId} />
      <span className="sr-only">Reviewing {stationName}</span>
    </form>
  )
}
