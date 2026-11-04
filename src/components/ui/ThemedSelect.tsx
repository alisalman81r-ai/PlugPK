// src/components/ui/ThemedSelect.tsx
'use client'

import { Check, ChevronDown } from '@/components/ui/icons'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A dropdown in the site's own colours.
 *
 * The browser's native <select> paints its open list with the operating
 * system's highlight — bright blue on Windows — and no CSS reaches it. This is
 * a listbox drawn by us instead, the same as the site's searchable picker
 * (SearchSelect): white panel, the chosen option in bold with a volt-ink tick,
 * the hovered or arrow-key option on a soft grey.
 *
 * Keyboard: Enter, Space or ↓/↑ opens it; ↑/↓, Home/End and typing a letter
 * move; Enter or Space picks; Escape or Tab closes. Pass `name` to submit the
 * value with a <form> (a hidden input carries it).
 */

export interface ThemedSelectOption {
  value: string
  label: React.ReactNode
  /** Text used for type-ahead and the trigger when `label` is not a string. */
  text?: string
  disabled?: boolean
  /** Options sharing a group are listed under that heading. */
  group?: string
}

export interface ThemedSelectProps {
  value: string
  onChange: (value: string) => void
  options: ThemedSelectOption[]
  /** Accessible name, when there is no visible <label htmlFor={id}>. */
  'aria-label'?: string
  id?: string
  name?: string
  placeholder?: string
  disabled?: boolean
  /** Classes for the trigger button (size, border, radius…). */
  className?: string
  /** Classes for the outer wrapper (width…). */
  wrapperClassName?: string
  /** Which edge of the trigger the panel lines up with. */
  align?: 'left' | 'right'
  /** Dark trigger for ink grounds. */
  tone?: 'light' | 'dark'
}

const textOf = (o: ThemedSelectOption) => o.text ?? (typeof o.label === 'string' ? o.label : o.value)

export function ThemedSelect({
  value,
  onChange,
  options,
  id,
  name,
  placeholder = 'Select',
  disabled = false,
  className,
  wrapperClassName,
  align = 'left',
  tone = 'light',
  ...rest
}: ThemedSelectProps) {
  const autoId = React.useId()
  const baseId = id ?? `ts${autoId.replace(/:/g, '')}`
  const listId = `${baseId}-list`
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const typed = React.useRef({ text: '', at: 0 })

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  const enabledFrom = (start: number, step: 1 | -1) => {
    for (let i = start; i >= 0 && i < options.length; i += step) if (!options[i]?.disabled) return i
    return -1
  }

  const openList = (at?: number) => {
    if (disabled) return
    setOpen(true)
    setActive(at ?? (selectedIndex >= 0 ? selectedIndex : enabledFrom(0, 1)))
  }
  const close = (focusButton = true) => {
    setOpen(false)
    if (focusButton) buttonRef.current?.focus()
  }
  const pick = (i: number) => {
    const o = options[i]
    if (!o || o.disabled) return
    if (o.value !== value) onChange(o.value)
    close()
  }

  // Close on an outside click.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the active option in view.
  React.useEffect(() => {
    if (!open || active < 0) return
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const typeAhead = (key: string) => {
    const now = Date.now()
    typed.current.text = now - typed.current.at > 600 ? key : typed.current.text + key
    typed.current.at = now
    const q = typed.current.text.toLowerCase()
    const start = open ? active + 1 : selectedIndex + 1
    const order = [...options.keys()].map((k) => (k + Math.max(0, start)) % options.length)
    const hit = order.find((i) => !options[i]?.disabled && textOf(options[i]!).toLowerCase().startsWith(q))
    if (hit === undefined) return
    if (open) setActive(hit)
    else if (options[hit]!.value !== value) onChange(options[hit]!.value)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) openList()
        else setActive((a) => (enabledFrom(a + 1, 1) >= 0 ? enabledFrom(a + 1, 1) : a))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) openList()
        else setActive((a) => (enabledFrom(a - 1, -1) >= 0 ? enabledFrom(a - 1, -1) : a))
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setActive(enabledFrom(0, 1))
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setActive(enabledFrom(options.length - 1, -1))
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) pick(active)
        else openList()
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          close()
        }
        break
      case 'Tab':
        if (open) setOpen(false)
        break
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) typeAhead(e.key)
    }
  }

  const dark = tone === 'dark'
  let lastGroup: string | undefined

  return (
    <div ref={wrapRef} className={cn('relative inline-block', wrapperClassName)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${baseId}-o${active}` : undefined}
        aria-label={rest['aria-label']}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'inline-flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-full border-[1.5px] pl-[18px] pr-3.5 text-left text-sm font-medium outline-none transition-[border-color,box-shadow,background-color] duration-200 disabled:cursor-not-allowed disabled:opacity-50',
          dark
            ? 'border-white/15 bg-white/[0.06] text-white hover:border-white/30 focus-visible:border-volt'
            : 'border-ink/10 bg-white text-ink hover:border-ink/30 focus-visible:border-ink focus-visible:shadow-focus',
          open && (dark ? 'border-volt' : 'border-ink shadow-focus'),
          className,
        )}
      >
        <span className={cn('truncate', !selected && (dark ? 'text-white/50' : 'text-fog'))}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn('shrink-0 transition-transform duration-300 ease-out', dark ? 'text-white/60' : 'text-muted', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={baseId}
          data-lenis-prevent=""
          className={cn(
            'absolute top-[calc(100%+8px)] z-[60] max-h-80 min-w-full overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(11,12,14,0.45)] motion-safe:animate-[ts-in_.22s_cubic-bezier(.16,1,.3,1)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((o, i) => {
            const heading = o.group && o.group !== lastGroup ? o.group : null
            lastGroup = o.group
            const isSel = i === selectedIndex
            const isActive = i === active
            return (
              <React.Fragment key={`${o.value}-${i}`}>
                {heading ? (
                  <li role="presentation" className="px-3 pb-1 pt-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {heading}
                  </li>
                ) : null}
                <li
                  id={`${baseId}-o${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  onMouseEnter={() => !o.disabled && setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(i)}
                  className={cn(
                    'flex min-h-10 cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 text-ui text-slate-800',
                    o.disabled && 'cursor-not-allowed opacity-40',
                    isActive && 'bg-slate-100',
                    isSel && 'font-semibold text-ink',
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {isSel ? <Check size={16} aria-hidden="true" className="shrink-0 text-plug-cyan-700" /> : null}
                </li>
              </React.Fragment>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
