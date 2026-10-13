// src/hooks/useTheme.ts
'use client'

import * as React from 'react'

import {
  getThemePreference,
  isDarkTheme,
  setThemePreference,
  subscribeToTheme,
  type ThemePreference,
} from '@/lib/theme'

/** One string, so useSyncExternalStore can compare snapshots by value. */
const snapshot = () => `${getThemePreference()}:${isDarkTheme() ? 'dark' : 'light'}`

/**
 * The theme choice and what it resolves to.
 *
 * `mounted` is false on the server and during hydration, where the theme is
 * not known — it is set by an inline script the server never sees. A switch
 * should not show a choice as selected until it is true, or it would show
 * "Auto" for a frame to someone who chose "Dark".
 */
export function useTheme() {
  const value = React.useSyncExternalStore(subscribeToTheme, snapshot, () => null)
  const [preference, resolved] = (value ?? 'system:light').split(':') as [ThemePreference, 'light' | 'dark']

  return {
    preference,
    resolved,
    mounted: value !== null,
    setPreference: setThemePreference,
  }
}
