// src/components/ui/SearchSelect.tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

import { Check, ChevronDown, Search } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * A searchable picker that stays inside the window — used for cities on
 * Services and brands on Cars.
 *
 * It replaces a native <select>. With 103 cities The browser draws a native
 * select's list itself, at whatever height it likes: on a desktop it ran the
 * full height of the screen, over the page and up into the browser's own tab
 * bar, and no CSS can size or place that list. This one is ours, so it can:
 *
 *   - It opens below the button, or above when there is more room there, and
 *     is never taller than the space it has — the list scrolls inside it.
 *   - It is rendered into the document body at a fixed position, so a parent
 *     with overflow-hidden (the Services hero has one) cannot clip it.
 *   - A search field at the top narrows 103 names to a few as you type.
 *
 * Works in a plain GET form: with `name`, a hidden input carries the choice,
 * so the Services hero still submits `?city=` exactly as before. Or it can be
 * controlled with `value` and `onChange`.
 *
 * Keyboard: the combobox pattern — arrows move, Enter picks, Escape closes and
 * returns focus to the button, Home and End jump.
 */

export interface SearchSelectProps {
  /** The choices, as their labels (the label is the value). */
  options: readonly string[]
  /** The search field's placeholder, e.g. "Type a city". */
  searchPlaceholder?: string
  /** The "no filter" option. Its value is `allValue`. */
  allLabel?: string
  allValue?: string
  /** For a plain form: a hidden input with this name carries the value. */
  name?: string
  /** Controlled value; omit to let the component hold it. */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  ariaLabel: string
  tone?: 'dark' | 'light'
  className?: string
}

interface Placement {
  top: number
  left: number
  width: number
  maxHeight: number
  above: boolean
}

const GAP = 8
const IDEAL = 320

export function SearchSelect({
  options: choices,
  searchPlaceholder = 'Type to search',
  allLabel = 'All cities',
  allValue = 'all',
  name,
  value,
  defaultValue,
  onChange,
  ariaLabel,
  tone = 'light',
  className,
}: SearchSelectProps) {
  const [inner, setInner] = React.useState(defaultValue ?? allValue)
  const current = value ?? inner
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const [place, setPlace] = React.useState<Placement | null>(null)
  const [mounted, setMounted] = React.useState(false)

  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const id = React.useId()
  const listId = `${id}-list`

  React.useEffect(() => setMounted(true), [])

  const options = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const found = q ? choices.filter((c) => c.toLowerCase().includes(q)) : choices
    return [{ value: allValue, label: allLabel }, ...found.map((c) => ({ value: c, label: c }))]
  }, [choices, query, allLabel, allValue])

  const labelFor = (v: string) => (v === allValue ? allLabel : v)

  /** Where the panel goes: below if it fits, else whichever side has more room. */
  const measure = React.useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - GAP * 2
    const above = r.top - GAP * 2
    const openAbove = below < 240 && above > below
    const room = Math.max(160, Math.min(IDEAL, openAbove ? above : below))
    const width = Math.max(r.width, 240)
    const left = Math.min(Math.max(GAP, r.left), window.innerWidth - width - GAP)
    setPlace({
      top: openAbove ? r.top - GAP - room : r.bottom + GAP,
      left,
      width,
      maxHeight: room,
      above: openAbove,
    })
  }, [])

  const openPanel = () => {
    setQuery('')
    const index = options.findIndex((o) => o.value === current)
    setActive(index > 0 ? index : 0)
    measure()
    setOpen(true)
  }

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }

  const choose = (next: string) => {
    if (value === undefined) setInner(next)
    onChange?.(next)
    close()
  }

  React.useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false)
    }
    // The panel is fixed to the window, so it follows the button on scroll.
    const onMove = () => measure()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, measure])

  React.useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(options.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // With a query and nothing matching, the only row is 'All cities'.
      const pick = options[Math.min(active, options.length - 1)]
      if (pick) choose(pick.value)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const dark = tone === 'dark'

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${ariaLabel}: ${labelFor(current)}`}
        onClick={() => (open ? close(false) : openPanel())}
        className={cn(
          'flex items-center justify-between gap-2 text-left font-medium outline-none transition-colors',
          dark
            ? 'h-12 rounded-full border border-white/15 bg-plug-navy-900 px-4 text-ui text-white hover:border-white/25 focus-visible:border-plug-cyan-400 focus-visible:ring-2 focus-visible:ring-plug-cyan-400/40'
            : 'h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-ui text-slate-700 hover:border-slate-300 focus-visible:border-plug-blue-500 focus-visible:ring-2 focus-visible:ring-plug-blue-500/40',
          open && (dark ? 'border-plug-cyan-400' : 'border-plug-blue-500'),
          className,
        )}
      >
        <span className="truncate">{labelFor(current)}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn('shrink-0 transition-transform duration-200', dark ? 'text-white/60' : 'text-slate-400', open && 'rotate-180')}
        />
      </button>

      {open && mounted && place
        ? createPortal(
            <div
              ref={panelRef}
              style={{ top: place.top, left: place.left, width: place.width, maxHeight: place.maxHeight }}
              className="fixed z-[80] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(5,36,30,0.45)]"
            >
              <div className="border-b border-slate-100 p-2">
                <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3">
                  <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="search"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={`${id}-opt-${active}`}
                    aria-label={`Search ${ariaLabel.toLowerCase()}`}
                    placeholder={searchPlaceholder}
                    value={query}
                    onChange={(e) => {
                      // In the same event, not an effect: an Enter pressed straight
                      // after typing must land on the first match, not the old row.
                      setQuery(e.target.value)
                      setActive(e.target.value.trim() ? 1 : 0)
                    }}
                    onKeyDown={onKeyDown}
                    className="h-full w-full min-w-0 bg-transparent text-ui text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
                  />
                </div>
              </div>
              <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
                {options.map((option, index) => {
                  const selected = option.value === current
                  return (
                    <li
                      key={option.value}
                      id={`${id}-opt-${index}`}
                      role="option"
                      aria-selected={selected}
                      data-index={index}
                      onMouseEnter={() => setActive(index)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(option.value)}
                      className={cn(
                        'flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-ui text-slate-800',
                        index === active && 'bg-slate-100',
                        index === 0 && 'font-semibold text-plug-blue-600',
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected ? <Check size={16} className="shrink-0 text-plug-cyan-700" aria-hidden="true" /> : null}
                    </li>
                  )
                })}
                {options.length === 1 ? (
                  <li role="presentation" className="px-3 py-4 text-center text-ui-sm text-slate-500">
                    Nothing matches &ldquo;{query}&rdquo;
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
