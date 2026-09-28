// src/components/tools/CarPicker.tsx
'use client'

import * as React from 'react'

import { Check, ChevronDown, Search, X } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * Pick a car by typing, not by scrolling.
 *
 * The EV tools used a native select of 30–40 cars in brand groups. It works,
 * but it asks the driver to scroll a list of names with nothing to tell two
 * trims apart. This opens a search field over the list instead: type "atto"
 * or "byd seal" and the list narrows as you go, and each row carries the one
 * or two numbers that tool cares about — battery and charging limits in the
 * calculator, rated range and its standard in the converter — so the right
 * trim is obvious before it is picked.
 *
 * ── Behaviour ─────────────────────────────────────────────────────────
 *
 * The ARIA combobox pattern: the search field owns focus, arrow keys move an
 * active option (aria-activedescendant), Enter picks it, Escape closes and
 * returns focus to the trigger. Home and End jump. Clicking outside closes.
 *
 * On a phone the list rises as a bottom sheet above the tab bar, where a
 * thumb can reach it and the keyboard does not cover it; from `sm` up it drops
 * down under the field like a menu.
 *
 * The first option is always the way out — "my car isn't listed" — because
 * the tools work without a car, and a driver whose car we don't carry should
 * never feel stuck.
 */

export interface PickerCar {
  slug: string
  name: string
  brand: string
  /** The row's supporting line: the numbers this tool uses. */
  meta: string
  /** A short caution shown beside the meta, e.g. "standard not stated". */
  flag?: string | null
}

export interface CarPickerProps {
  id: string
  label: string
  cars: PickerCar[]
  value: string
  onChange: (slug: string) => void
  /** The no-car option's wording. */
  noneLabel: string
  /** What the field says before a car is chosen. */
  placeholder?: string
  /** Shown under the field. */
  hint?: React.ReactNode
}

/** Every word typed must appear somewhere in "brand name". */
function matches(car: PickerCar, query: string): boolean {
  const hay = `${car.brand} ${car.name}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word))
}

export function CarPicker({ id, label, cars, value, onChange, noneLabel, placeholder = 'Select your EV', hint }: CarPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const selected = cars.find((c) => c.slug === value) ?? null
  const labelId = `${id}-label`
  const listId = `${id}-list`
  const optionId = (slug: string) => `${id}-opt-${slug || 'none'}`

  // The visible options, in order: the way out first, then matching cars.
  const visible = React.useMemo(() => {
    const found = query.trim() ? cars.filter((c) => matches(c, query)) : cars
    return [null, ...found] as (PickerCar | null)[]
  }, [cars, query])

  // Brand headers go in front of the first car of each brand.
  const groups = React.useMemo(() => {
    const out: { brand: string | null; items: { car: PickerCar | null; index: number }[] }[] = []
    visible.forEach((car, index) => {
      const brand = car ? car.brand : null
      const last = out[out.length - 1]
      if (last && last.brand === brand) last.items.push({ car, index })
      else out.push({ brand, items: [{ car, index }] })
    })
    return out
  }, [visible])

  const openPicker = () => {
    setQuery('')
    const current = visible.findIndex((c) => (c?.slug ?? '') === value)
    setActive(current > 0 ? current : 0)
    setOpen(true)
  }

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  const pick = (car: PickerCar | null) => {
    onChange(car?.slug ?? '')
    close()
  }

  React.useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  // Keep the active option in view while arrowing through a long list.
  React.useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  // A new query starts from its first match rather than a stale position.
  React.useEffect(() => {
    setActive(query.trim() && visible.length > 1 ? 1 : 0)
  }, [query, visible.length])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(visible.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(visible.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(visible[active] ?? null)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const activeCar = visible[active]

  return (
    <div ref={rootRef} className="relative">
      <span id={labelId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${id}`}
        onClick={() => (open ? close(false) : openPicker())}
        className={cn(
          'flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl border-[1.5px] bg-white py-2 pl-4 pr-3 text-left transition-all duration-150',
          'focus-visible:border-plug-blue-500 focus-visible:shadow-focus focus-visible:outline-none',
          open ? 'border-plug-blue-500 shadow-focus' : 'border-slate-200 hover:border-slate-300',
        )}
      >
        {selected ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ui font-semibold text-slate-900">{selected.name}</span>
            <span className="block truncate text-ui-sm text-slate-500">{selected.meta}</span>
          </span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-2 text-ui text-slate-500">
            <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{placeholder}</span>
          </span>
        )}
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn('shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {hint ? <div className="mt-2.5">{hint}</div> : null}

      {open ? (
        <>
          {/* The phone's sheet needs a scrim; the desktop menu does not. */}
          <div aria-hidden="true" className="fixed inset-0 z-[65] bg-slate-900/30 sm:hidden" onClick={() => close(false)} />

          <div
            className={cn(
              'z-[70] flex flex-col overflow-hidden bg-white',
              'fixed inset-x-0 bottom-0 max-h-[82vh] rounded-t-3xl pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_60px_-20px_rgba(5,36,30,0.45)]',
              'sm:absolute sm:inset-x-0 sm:bottom-auto sm:top-full sm:mt-2 sm:max-h-[26rem] sm:rounded-2xl sm:border sm:border-slate-200 sm:pb-0 sm:shadow-[0_24px_60px_-24px_rgba(5,36,30,0.4)]',
            )}
          >
            <div className="flex items-center gap-2 border-b border-slate-100 p-3">
              <div className="flex min-h-12 flex-1 items-center gap-2.5 rounded-xl bg-slate-50 px-3.5">
                <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={optionId(activeCar?.slug ?? '')}
                  aria-label={`Search ${label.toLowerCase()}`}
                  placeholder="Type a make or model"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="h-12 w-full min-w-0 bg-transparent text-ui text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => close()}
                aria-label="Close"
                className="grid size-11 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 sm:hidden"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <ul ref={listRef} id={listId} role="listbox" aria-labelledby={labelId} className="flex-1 overflow-y-auto overscroll-contain p-2">
              {groups.map((group) => (
                <li key={group.brand ?? 'none'} role="presentation">
                  {group.brand ? (
                    <p
                      role="presentation"
                      className="px-3 pb-1 pt-3 text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-400"
                    >
                      {group.brand}
                    </p>
                  ) : null}
                  <ul role="presentation">
                    {group.items.map(({ car, index }) => {
                      const slug = car?.slug ?? ''
                      const isActive = index === active
                      const isSelected = slug === value
                      return (
                        <li
                          key={slug || 'none'}
                          id={optionId(slug)}
                          role="option"
                          aria-selected={isSelected}
                          data-index={index}
                          onMouseEnter={() => setActive(index)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pick(car)}
                          className={cn(
                            'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2',
                            isActive ? 'bg-slate-100' : 'bg-transparent',
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                'block truncate text-ui',
                                car ? 'font-medium text-slate-900' : 'font-medium text-plug-blue-600',
                              )}
                            >
                              {car ? car.name : noneLabel}
                            </span>
                            {car ? (
                              <span className="block truncate text-ui-sm text-slate-500">
                                {car.meta}
                                {car.flag ? <span className="text-amber-700"> · {car.flag}</span> : null}
                              </span>
                            ) : null}
                          </span>
                          {isSelected ? (
                            <Check size={18} className="shrink-0 text-plug-cyan-700" aria-hidden="true" />
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
              {visible.length === 1 ? (
                <li role="presentation" className="px-3 py-6 text-center text-ui-sm text-slate-500">
                  No car matches &ldquo;{query}&rdquo;. Choose &ldquo;{noneLabel}&rdquo; and enter its figures.
                </li>
              ) : null}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  )
}
