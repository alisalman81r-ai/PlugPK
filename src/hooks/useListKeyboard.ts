// src/hooks/useListKeyboard.ts
'use client'

import * as React from 'react'

/**
 * Keyboard control for a suggestion list or picker — the combobox pattern.
 *
 * The site has several of these (city suggestions, the EV picker, the car
 * picker, the map search), and each used to decide for itself whether the
 * keyboard worked at all. Two did not: you could type "fa" into the route
 * planner and see Faisalabad offered, but only a mouse could pick it.
 *
 * Focus stays in the input (or on the trigger); the highlight moves:
 *
 *   ↓ / ↑     move the highlight, wrapping at either end
 *   Enter     pick the highlighted option
 *   Escape    close the list
 *   Tab       close the list and move on as usual
 *
 * The first option is highlighted as soon as the list opens, so typing a few
 * letters and pressing Enter picks the top match. The highlighted option is
 * scrolled into view, and pointing at an option moves the same highlight, so
 * mouse and keyboard never disagree about which one Enter would pick.
 */
export interface ListKeyboard {
  /** Index of the highlighted option, or -1. */
  active: number
  setActive: (index: number) => void
  /** Attach to the input or trigger that owns the list. */
  onKeyDown: (event: React.KeyboardEvent) => void
  /** Spread onto each option. */
  optionProps: (index: number) => {
    id: string
    ref: (element: HTMLElement | null) => void
    'aria-selected': boolean
    'data-active': boolean | undefined
    onMouseEnter: () => void
  }
  /** For aria-activedescendant on the input. */
  activeId: string | undefined
  listId: string
}

export function useListKeyboard({
  count,
  open,
  onPick,
  onClose,
  onOpen,
  resetKey,
}: {
  /** How many options are showing. */
  count: number
  /** Whether the list is showing. */
  open: boolean
  onPick: (index: number) => void
  onClose: () => void
  /** Called on ↓ while the list is closed, to open it. */
  onOpen?: () => void
  /** Anything that changes the options (e.g. the query) — resets the highlight. */
  resetKey?: unknown
}): ListKeyboard {
  const [active, setActive] = React.useState(-1)
  const items = React.useRef<(HTMLElement | null)[]>([])
  const listId = React.useId()

  // A fresh list starts on its first option.
  React.useEffect(() => {
    setActive(open && count > 0 ? 0 : -1)
  }, [open, count, resetKey])

  React.useEffect(() => {
    if (active >= 0) items.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' && onOpen) {
        event.preventDefault()
        onOpen()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        if (count === 0) return
        event.preventDefault()
        setActive((index) => (index + 1) % count)
        break
      case 'ArrowUp':
        if (count === 0) return
        event.preventDefault()
        setActive((index) => (index <= 0 ? count - 1 : index - 1))
        break
      case 'Enter':
        if (active >= 0 && active < count) {
          // Stops the surrounding form submitting with a half-typed value.
          event.preventDefault()
          onPick(active)
        }
        break
      case 'Escape':
        event.preventDefault()
        onClose()
        break
      case 'Tab':
        onClose()
        break
    }
  }

  return {
    active,
    setActive,
    onKeyDown,
    optionProps: (index) => ({
      id: `${listId}-option-${index}`,
      ref: (element) => {
        items.current[index] = element
      },
      'aria-selected': index === active,
      'data-active': index === active || undefined,
      onMouseEnter: () => setActive(index),
    }),
    activeId: active >= 0 ? `${listId}-option-${active}` : undefined,
    listId,
  }
}

/**
 * Arrow keys for a dropdown menu of links (the header's Tools and account
 * menus). Focus moves between the menu's links and buttons; Enter follows
 * the focused link natively. ↓ on the trigger opens the menu on its first
 * item.
 */
export function useMenuKeyboard(
  menu: React.RefObject<HTMLElement>,
  open: boolean,
  setOpen: (open: boolean) => void,
) {
  // Which end to focus once the menu has rendered, after ↓/↑ opened it.
  const pending = React.useRef<'first' | 'last' | null>(null)

  const focusables = React.useCallback(
    () => Array.from(menu.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []),
    [menu],
  )

  const focusAt = React.useCallback(
    (index: number) => {
      const list = focusables()
      if (list.length === 0) return
      list[(index + list.length) % list.length]?.focus()
    },
    [focusables],
  )

  React.useEffect(() => {
    if (!open || !pending.current) return
    focusAt(pending.current === 'first' ? 0 : -1)
    pending.current = null
  }, [open, focusAt])

  /** Attach to the button that opens the menu. */
  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    pending.current = event.key === 'ArrowDown' ? 'first' : 'last'
    if (open) {
      focusAt(pending.current === 'first' ? 0 : -1)
      pending.current = null
    } else {
      setOpen(true)
    }
  }

  /** Attach to the menu container. */
  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return
    const list = focusables()
    const current = list.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusAt(current + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusAt(current <= 0 ? list.length - 1 : current - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAt(list.length - 1)
    }
  }

  return { onTriggerKeyDown, onMenuKeyDown }
}
