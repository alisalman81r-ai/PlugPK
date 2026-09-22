'use client'

import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { markCommunityPostReviewed } from '@/lib/db/actions'

export function MarkCommunityPostReviewed({
  postId,
  reviewed = false,
}: {
  postId: string
  reviewed?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  return (
    <button
      type="button"
      disabled={isPending || reviewed}
      onClick={() => {
        startTransition(async () => {
          const result = await markCommunityPostReviewed(postId)
          if (result.ok) router.refresh()
        })
      }}
      aria-label={reviewed ? 'Post reviewed' : 'Mark post as reviewed'}
      title={reviewed ? 'Post reviewed' : 'Mark as reviewed'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-70"
    >
      {isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} aria-hidden="true" />}
    </button>
  )
}