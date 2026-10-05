// src/components/admin/MarkCommunityPostReviewed.tsx
'use client'

import { Check, Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { markCommunityPostReviewed } from '@/lib/db/actions'

import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

/**
 * Clears a post from the "not yet reviewed" queue. A failure is said out loud
 * rather than leaving the tick looking pressed with nothing behind it.
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
  const [isPending, startTransition] = React.useTransition()

  return (
    <button
      type="button"
      disabled={isPending || reviewed}
      onClick={() => {
        startTransition(async () => {
          const result = await runAction(() => markCommunityPostReviewed(postId))
          if (!result.ok) {
            toast.error(result.message ?? 'Could not mark that post as reviewed.')
            return
          }
          toast.success(result.message ?? 'Marked as reviewed.')
          router.refresh()
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
