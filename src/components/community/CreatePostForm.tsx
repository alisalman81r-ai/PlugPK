// src/components/community/CreatePostForm.tsx
'use client'

import { CheckCircle2, Loader2, Lock, MessageCircle, X, type IconType } from '@/components/ui/icons'
import * as React from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { getLenis } from '@/components/motion/MotionProvider'
import { Btn, BtnArrow, FLABEL, INPUT, chipClass } from '@/components/v2/ui'
import { gsap, prefersReduced } from '@/lib/gsap'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createPost } from '@/lib/db/community-actions'
import { COMMUNITY_LIMITS, POST_CATEGORIES } from '@/lib/constants'
import type { CommunityPost, PostCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { signInHref, signUpHref } from './auth-links'
import { POST_ICON } from './CategoryTabs'

export interface CreatePostFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (post: Partial<CommunityPost>) => void
}

/** The same limits the server applies — see COMMUNITY_LIMITS. */
const MAX_TITLE = COMMUNITY_LIMITS.title
const MAX_CONTENT = COMMUNITY_LIMITS.content

/**
 * Where an unfinished post waits while its author signs in.
 *
 * sessionStorage rather than localStorage: it is a draft for this tab's trip
 * to the login page and back, not something to resurface on another device or
 * a week later. Cleared once the post is published.
 */
const DRAFT_KEY = 'plug:community-draft'

interface Draft {
  title: string
  content: string
  category: PostCategory | ''
}

function readDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Draft>
    return {
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, MAX_TITLE) : '',
      content: typeof parsed.content === 'string' ? parsed.content.slice(0, MAX_CONTENT) : '',
      category: POST_CATEGORIES.some((option) => option.id === parsed.category)
        ? (parsed.category as PostCategory)
        : '',
    }
  } catch {
    return null
  }
}

function writeDraft(draft: Draft | null) {
  try {
    if (!draft || (!draft.title && !draft.content && !draft.category)) {
      window.sessionStorage.removeItem(DRAFT_KEY)
    } else {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }
  } catch {
    // Private mode or blocked storage: the draft simply does not survive.
  }
}

export function CreatePostForm({ isOpen, onClose, onSubmit }: CreatePostFormProps) {
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [category, setCategory] = React.useState<PostCategory | ''>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [postSlug, setPostSlug] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  /*
    ── Who is asking ─────────────────────────────────────────────────

    A signed-out visitor sees the sign-in prompt, and nothing else. There used
    to be a "Continue as Guest" button under it that opened the form anyway —
    but the server refuses a post with no account behind it, so a guest could
    write a whole trip report and lose it on submit. The prompt's links now
    carry ?redirect= back here, and whatever was typed is kept as a draft.
  */
  const { user, loading: sessionLoading } = useCurrentUser()
  const showLoginPrompt = !sessionLoading && !user

  // Bring back a draft left before a sign-in round-trip.
  React.useEffect(() => {
    if (!isOpen) return
    const draft = readDraft()
    if (!draft) return
    setTitle((current) => current || draft.title)
    setContent((current) => current || draft.content)
    setCategory((current) => current || draft.category)
  }, [isOpen])

  // Keep the draft as it is typed, so nothing is lost if the tab navigates.
  React.useEffect(() => {
    if (!isOpen || isSuccess) return
    writeDraft({ title, content, category })
  }, [isOpen, isSuccess, title, content, category])

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

  /*
    page-community.js openAuth: the page stops scrolling under the dialog, the
    card rises in, and closing hands focus back to whatever opened it.
  */
  const panelRef = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (!isOpen) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const lenis = getLenis()
    lenis?.stop()
    const panel = panelRef.current
    const tween =
      panel && !prefersReduced()
        ? gsap.fromTo(panel, { y: 30, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' })
        : null
    return () => {
      tween?.kill()
      lenis?.start()
      opener?.focus()
    }
  }, [isOpen])

  // Clear the form each time the modal closes. The draft in sessionStorage is
  // what survives a close, not the component's state.
  React.useEffect(() => {
    if (isOpen) return
    setIsSuccess(false)
    setPostSlug(null)
    setError(null)
    setTitle('')
    setContent('')
    setCategory('')
  }, [isOpen])

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && category !== '' && !isSubmitting

  /*
    This announced success and threw the post away.

    It set isSuccess, called an onSubmit callback that the community page
    never passes, and closed the modal three seconds later. Nothing was ever
    written. The author saw a tick and lost what they wrote — a failure that
    is indistinguishable from working until they reload and find nothing.

    The success state is now set only after the server says the row exists,
    and router.refresh() brings the feed back from the database rather than
    inserting an optimistic copy that may not be there.
  */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    const form = new FormData()
    form.set('title', title)
    form.set('content', content)
    form.set('category', category)

    try {
      const result = await createPost(form)
      if (!result.ok) {
        setError(result.message ?? 'Could not publish that.')
        return
      }
      writeDraft(null)
      setPostSlug(result.slug ?? null)
      setIsSuccess(true)
      onSubmit?.({ title, content, category: category as PostCategory })
      router.refresh()
      // No auto-close. It used to dismiss itself after two seconds, taking
      // the "View Post" button with it before most people had read the tick.
    } catch {
      setError('Could not publish that. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
      data-theme="light"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[6px]"
    >
      <div
        ref={panelRef}
        data-lenis-prevent=""
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-modal w-full max-w-[600px] overflow-y-auto rounded-[28px] bg-paper px-5 pb-6 pt-7 text-ink shadow-e4 sm:px-8 sm:pb-7 sm:pt-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-[250ms] hover:bg-stone focus-visible:outline-none focus-visible:shadow-focus"
        >
          <X size={18} />
        </button>

        {isSuccess ? (
          <div className="animate-scale-in">
            <span aria-hidden="true" className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-ink text-volt">
              <CheckCircle2 size={24} />
            </span>
            <p id="create-post-title" className="mt-[18px] font-display text-[26px] leading-[1.12] text-ink">
              Discussion posted
            </p>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-muted">Your post is now live.</p>
            <div className="mt-[22px] flex flex-wrap gap-2.5">
              <Btn magnetic={false} href={postSlug ? `/community/post/${postSlug}` : '/community'} onClick={onClose}>
                View post
                <BtnArrow />
              </Btn>
              <Btn magnetic={false} variant="ghost" onClick={onClose}>
                Close
              </Btn>
            </div>
          </div>
        ) : showLoginPrompt ? (
          <div>
            <span aria-hidden="true" className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-ink text-volt">
              <Lock size={24} />
            </span>

            <h2 id="create-post-title" className="mt-[18px] text-balance pr-10 font-display text-[26px] leading-[1.12] text-ink">
              Sign in to start a discussion
            </h2>

            <p className="mt-2.5 text-[15px] leading-[1.6] text-muted">
              Sign in and you can start a discussion, reply to one and like posts; everything you post
              is saved and shown to everyone. Reading needs no account at all.
            </p>

            <div className="mt-[22px] flex flex-wrap gap-2.5">
              <Btn magnetic={false} href={signInHref(`${pathname}?compose=1`)}>Sign in</Btn>
              <Btn magnetic={false} href={signUpHref(`${pathname}?compose=1`)} variant="ghost">
                Create account
              </Btn>
              <Btn magnetic={false} variant="ghost" onClick={onClose} className="border-transparent bg-transparent hover:border-ink/10">
                Keep reading
              </Btn>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="create-post-title" className="pr-12 font-display text-[26px] leading-[1.12] text-ink">
              New discussion
            </h2>
            <p className="mt-1.5 text-sm text-muted">Everything you post is saved and shown to everyone.</p>

            <fieldset className="mt-6">
              <legend className={cn(FLABEL, 'mb-3')}>Category *</legend>
              <div className="flex flex-wrap gap-2">
                {POST_CATEGORIES.map((option) => {
                  const Icon: IconType = POST_ICON[option.icon] ?? MessageCircle
                  const isSelected = category === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCategory(option.id)}
                      aria-pressed={isSelected}
                      className={chipClass(isSelected, 'h-11 focus-visible:outline-none focus-visible:shadow-focus')}
                    >
                      <Icon aria-hidden="true" className={isSelected ? 'text-volt' : 'text-muted'} />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="mt-6">
              <label htmlFor="post-title" className={cn(FLABEL, 'mb-2 block')}>
                Title *
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                maxLength={MAX_TITLE}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What's your question or topic?"
                className={cn(INPUT, 'font-medium')}
              />
              <p className="mt-1 text-right font-mono text-xs text-muted">
                {title.length}/{MAX_TITLE}
              </p>
            </div>

            <div className="mt-2">
              <label htmlFor="post-content" className={cn(FLABEL, 'mb-2 block')}>
                Content *
              </label>
              <textarea
                id="post-content"
                value={content}
                maxLength={MAX_CONTENT}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share your experience, question, or news with the community..."
                className={cn(INPUT, 'h-auto min-h-[160px] resize-y py-3.5 text-[15px] leading-[1.6]')}
              />
              <p className="mt-1 text-right font-mono text-xs text-muted">
                {content.length}/{MAX_CONTENT}
              </p>
            </div>

            {/* Above the buttons, not below them: a message under the fold of
                a scrolled modal is a message nobody reads. */}
            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-2xl border border-[#FFCDBC] bg-[#FFECE6] px-3.5 py-2.5 text-sm text-[#B42E05]"
              >
                {error}
                {/* A session that ended mid-draft: the draft is already in
                    sessionStorage, so signing in loses nothing. */}
                {error.startsWith('Sign in') ? (
                  <>
                    {' '}
                    <a
                      href={signInHref(`${pathname}?compose=1`)}
                      className="font-semibold underline underline-offset-2"
                    >
                      Sign in — your draft is kept
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted">Fields marked * are required</p>
              <div className="flex gap-2.5">
                <Btn magnetic={false} variant="ghost" onClick={onClose}>
                  Cancel
                </Btn>
                <Btn magnetic={false} type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                  {isSubmitting ? 'Posting…' : 'Post discussion'}
                </Btn>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
