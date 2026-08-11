// src/components/station/WriteReviewForm.tsx
'use client'

import { CheckCircle2, Star, User } from 'lucide-react'
import * as React from 'react'

import { Button, Input, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface WriteReviewFormProps {
  stationId: string
  stationName: string
  onSuccess?: () => void
}

const MAX_COMMENT = 500

const RATING_LABEL: Record<number, { text: string; className: string }> = {
  0: { text: 'Select a rating', className: 'text-slate-400' },
  1: { text: 'Poor', className: 'text-red-500' },
  2: { text: 'Fair', className: 'text-orange-500' },
  3: { text: 'Good', className: 'text-amber-500' },
  4: { text: 'Very Good', className: 'text-lime-600' },
  5: { text: 'Excellent', className: 'text-green-600' },
}

export function WriteReviewForm({ stationId, stationName, onSuccess }: WriteReviewFormProps) {
  const [rating, setRating] = React.useState(0)
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)
  const [comment, setComment] = React.useState('')
  const [vehicle, setVehicle] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
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
    setIsSubmitting(true)
    // Stands in for the review API until the backend exists.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSuccess(true)
    onSuccess?.()
  }

  if (isSuccess) {
    return (
      <div className="flex animate-scale-in flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <CheckCircle2 size={48} className="text-green-500" aria-hidden="true" />
        <p className="mt-4 text-xl font-bold text-slate-900">Review submitted!</p>
        <p className="mt-1 text-slate-500">Thank you for helping the community.</p>
      </div>
    )
  }

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand"
        >
          <User size={20} className="text-white" />
        </span>

        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-400 transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50"
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
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
    >
      <h3 className="mb-6 text-lg font-bold text-slate-900">Write a Review</h3>

      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-semibold text-slate-700">Your Rating *</legend>
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
                'cursor-pointer rounded transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                rating === value && 'animate-scale-in',
              )}
            >
              <Star
                size={36}
                className={value <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
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
          'mb-4 text-right text-xs',
          comment.length > MAX_COMMENT ? 'text-red-600' : 'text-slate-400',
        )}
      >
        {comment.length}/{MAX_COMMENT}
      </p>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

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
          Submit Review
        </Button>
      </div>

      <input type="hidden" name="stationId" value={stationId} />
      <span className="sr-only">Reviewing {stationName}</span>
    </form>
  )
}
