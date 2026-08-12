// src/components/community/CreatePostForm.tsx
'use client'

import { CheckCircle2, Lock, MessageCircle, X, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { POST_CATEGORIES } from '@/lib/constants'
import type { CommunityPost, PostCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { POST_ICON } from './CategoryTabs'

export interface CreatePostFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (post: Partial<CommunityPost>) => void
}

const MAX_TITLE = 120
const MAX_CONTENT = 2000

export function CreatePostForm({ isOpen, onClose, onSubmit }: CreatePostFormProps) {
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [category, setCategory] = React.useState<PostCategory | ''>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = React.useState(true)

  React.useEffect(() => {
    if (!isOpen) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Reset back to the gate each time the modal is reopened.
  React.useEffect(() => {
    if (isOpen) return
    setShowLoginPrompt(true)
    setIsSuccess(false)
    setTitle('')
    setContent('')
    setCategory('')
  }, [isOpen])

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && category !== '' && !isSubmitting

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    // Stands in for the create-post API.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSuccess(true)
    onSubmit?.({ title, content, category: category as PostCategory })
    setTimeout(onClose, 3000)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-8 shadow-modal"
      >
        {isSuccess ? (
          <div className="animate-scale-in text-center">
            <CheckCircle2 size={48} className="mx-auto text-green-500" aria-hidden="true" />
            <p id="create-post-title" className="mt-4 text-2xl font-bold text-slate-900">
              Discussion posted!
            </p>
            <p className="mt-2 text-slate-500">Your post is now live.</p>
            <div className="mt-6">
              <Button href="/community" onClick={onClose}>
                View Post
              </Button>
            </div>
          </div>
        ) : showLoginPrompt ? (
          <div className="text-center">
            <span className="mb-6 inline-flex rounded-2xl bg-slate-50 p-4">
              <Lock size={48} className="text-slate-300" aria-hidden="true" />
            </span>

            <h2 id="create-post-title" className="mb-3 text-2xl font-bold text-slate-900">
              Join to Start a Discussion
            </h2>

            <p className="mb-8 text-slate-500">
              Create a free account to post, comment, and connect with Pakistan&apos;s EV community.
            </p>

            <div className="flex flex-col gap-3">
              <Button href="/signup" fullWidth>
                Create Free Account
              </Button>
              <Button href="/login" variant="secondary" fullWidth>
                Sign In
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setShowLoginPrompt(false)}>
                Continue as Guest
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 flex items-center justify-between">
              <h2 id="create-post-title" className="text-xl font-bold text-slate-900">
                New Discussion
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <fieldset className="mb-6">
              <legend className="mb-3 text-sm font-semibold text-slate-700">Category *</legend>
              <div className="grid grid-cols-2 gap-2">
                {POST_CATEGORIES.map((option) => {
                  const Icon: LucideIcon = POST_ICON[option.icon] ?? MessageCircle
                  const isSelected = category === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCategory(option.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-all duration-150',
                        isSelected ? option.badge : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <Icon size={16} className="shrink-0" aria-hidden="true" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="mb-6">
              <label htmlFor="post-title" className="mb-2 block text-sm font-semibold text-slate-700">
                Title *
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                maxLength={MAX_TITLE}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What's your question or topic?"
                className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 px-4 text-base font-semibold text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:shadow-focus"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {title.length}/{MAX_TITLE}
              </p>
            </div>

            <div className="mb-2">
              <label htmlFor="post-content" className="mb-2 block text-sm font-semibold text-slate-700">
                Content *
              </label>
              <textarea
                id="post-content"
                value={content}
                maxLength={MAX_CONTENT}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share your experience, question, or news with the community..."
                className="min-h-[160px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 p-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:shadow-focus"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {content.length}/{MAX_CONTENT}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">Fields marked * are required</p>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit}>
                  Post Discussion
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
