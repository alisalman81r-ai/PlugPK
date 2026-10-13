// src/components/layout/ThemeSwitcher.tsx
'use client'

import * as React from 'react'

import { Check, Monitor, Moon, Sun, type IconType } from '@/components/ui/icons'
import { useMenuKeyboard } from '@/hooks/useListKeyboard'
import { useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/utils'

/**
 * Light, Dark, or Auto.
 *
 * Auto is the default, and it is not the same as either of the others: it
 * follows the device, live, so a phone that goes dark at sunset takes the site
 * with it. Choosing Light or Dark pins the site to that, on this browser.
 *
 * Two shapes. ThemeMenu is an icon button for a header — the public navbar,
 * the admin top bar. ThemeSegmented is all three options in a row, for a menu
 * sheet where there is room to show them and a tap is cheaper than a popover.
 */

type Option = { value: ThemePreference; label: string; hint: string; Icon: IconType }

const AUTO: Option = { value: 'system', label: 'Auto', hint: 'Matches your device', Icon: Monitor }

const OPTIONS: Option[] = [
  { value: 'light', label: 'Light', hint: 'Always light', Icon: Sun },
  { value: 'dark', label: 'Dark', hint: 'Always dark', Icon: Moon },
  AUTO,
]

const optionFor = (value: ThemePreference) => OPTIONS.find((option) => option.value === value) ?? AUTO

/** Which ground the control sits on. The navbar is pine in both themes. */
type Tone = 'onDark' | 'onSurface'

export function ThemeMenu({ tone = 'onDark', className }: { tone?: Tone; className?: string }) {
  const { preference, mounted, setPreference } = useTheme()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const menuKeys = useMenuKeyboard(menuRef, open, setOpen)
  const current = optionFor(preference)
  const menuId = React.useId()

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onDark = tone === 'onDark'
  // Until the theme is known, the button shows no choice rather than a wrong one.
  const Icon = mounted ? current.Icon : Sun

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={menuKeys.onTriggerKeyDown}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={mounted ? `Theme: ${current.label}` : 'Theme'}
        title="Theme"
        className={cn(
          'flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2',
          onDark
            ? 'h-11 w-11 rounded-xl text-white/75 hover:bg-white/10 hover:text-white focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950'
            : 'rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-plug-blue-500',
          open && (onDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'),
        )}
      >
        <Icon size={onDark ? 20 : 17} aria-hidden="true" className={cn(!mounted && 'opacity-0')} />
      </button>

      {open ? (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label="Theme"
          onKeyDown={menuKeys.onMenuKeyDown}
          className={cn(
            'absolute right-0 z-50 w-60 overflow-hidden p-1.5',
            onDark
              ? 'top-[calc(100%+6px)] rounded-2xl border border-white/10 bg-plug-navy-950 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]'
              : 'mt-1.5 rounded-xl border border-slate-200 bg-white shadow-e3',
          )}
        >
          {OPTIONS.map(({ value, label, hint, Icon: OptionIcon }) => {
            const selected = mounted && value === preference
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setPreference(value)
                  setOpen(false)
                }}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none',
                  onDark
                    ? cn(
                        'focus-visible:bg-white/10',
                        selected ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/[0.06] hover:text-white',
                      )
                    : cn(
                        'rounded-lg focus-visible:bg-slate-100',
                        selected ? 'bg-plug-blue-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50',
                      ),
                )}
              >
                <OptionIcon
                  size={18}
                  aria-hidden="true"
                  className={cn(
                    'shrink-0',
                    selected ? (onDark ? 'text-plug-cyan-400' : 'text-plug-blue-600') : onDark ? 'text-white/45' : 'text-slate-400',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">{label}</span>
                  <span className={cn('block text-ui-xs', onDark ? 'text-white/45' : 'text-slate-500')}>{hint}</span>
                </span>
                {selected ? (
                  <Check
                    size={16}
                    aria-hidden="true"
                    className={cn('shrink-0', onDark ? 'text-plug-cyan-400' : 'text-plug-blue-600')}
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

/** All three choices in a row: a radio group, so arrow keys move the choice. */
export function ThemeSegmented({
  tone = 'onDark',
  className,
  tabIndex,
}: {
  tone?: Tone
  className?: string
  /** -1 while the sheet holding it is closed, so it is not reachable by Tab. */
  tabIndex?: number
}) {
  const { preference, mounted, setPreference } = useTheme()
  const onDark = tone === 'onDark'
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + OPTIONS.length) % OPTIONS.length
    const option = OPTIONS[next]
    if (!option) return
    setPreference(option.value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        'grid grid-cols-3 gap-1 rounded-xl p-1',
        onDark ? 'bg-white/[0.06]' : 'bg-slate-100',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }, index) => {
        const selected = mounted && value === preference
        // Roving tab stop: only the chosen option (or the first, before the
        // theme is known) is in the tab order.
        const isTabStop = mounted ? selected : index === 0
        return (
          <button
            key={value}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={tabIndex ?? (isTabStop ? 0 : -1)}
            onClick={() => setPreference(value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
              onDark
                ? cn(
                    'focus-visible:ring-plug-cyan-400',
                    selected ? 'bg-white/[0.14] text-white' : 'text-white/60 hover:text-white',
                  )
                : cn(
                    'focus-visible:ring-plug-blue-500',
                    selected ? 'bg-white text-slate-900 shadow-e1' : 'text-slate-500 hover:text-slate-800',
                  ),
            )}
          >
            <Icon size={17} aria-hidden="true" className={cn(selected && (onDark ? 'text-plug-cyan-400' : 'text-plug-blue-600'))} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
