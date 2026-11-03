// src/components/home/v2/Phone.tsx
//
// The phone frame and the small pieces of app UI drawn inside it, shared by
// the home page's hero, how-it-works and app sections (landing-v2 .phone).

import * as React from 'react'

import { cn } from '@/lib/utils'

export function Phone({
  children,
  light = false,
  className,
  style,
}: {
  children: React.ReactNode
  light?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        'absolute h-[600px] w-[292px] rounded-[50px] bg-[linear-gradient(145deg,#3a3d43,#121417_40%,#2a2d32)] p-2.5 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.12),0_60px_120px_-40px_rgba(0,0,0,.85),0_30px_60px_-30px_rgba(0,0,0,.6)]',
        className,
      )}
    >
      <div
        className={cn(
          'relative h-full overflow-hidden rounded-[40px] px-3 text-[11px] leading-[1.35]',
          light ? 'bg-[#F7F6F2] text-ink' : 'bg-[#0E1013] text-white',
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** 9:41, the island, signal and battery. */
export function StatusBar({ ink = false }: { ink?: boolean }) {
  return (
    <div className={cn('flex h-11 items-center justify-between px-3 text-xs font-semibold', ink && 'text-ink')}>
      <span>9:41</span>
      <i className="h-6 w-[86px] rounded-[20px] bg-black" />
      <span className="flex items-end gap-0.5">
        <b className="h-[5px] w-[3px] rounded-[1px] bg-current" />
        <b className="h-[7px] w-[3px] rounded-[1px] bg-current" />
        <b className="h-[9px] w-[3px] rounded-[1px] bg-current" />
        <em className="relative ml-1 h-2.5 w-5 rounded-[3px] border-[1.5px] border-current after:absolute after:inset-[1.5px_5px_1.5px_1.5px] after:rounded-[1px] after:bg-current" />
      </span>
    </div>
  )
}

/** The bottom tab bar of the app, with one tab lit. */
export function PhoneTabs({ on }: { on: 'Home' | 'Map' }) {
  const tabs: { label: string; d: string }[] = [
    { label: 'Home', d: 'M4 10.5 12 4l8 6.5V20h-5v-6h-6v6H4z' },
    { label: 'Map', d: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20' },
    { label: 'Routes', d: 'M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16' },
    { label: 'Services', d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
    { label: 'Profile', d: 'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6.5 18.5c1.4-2 3.3-3 5.5-3s4.1 1 5.5 3' },
  ]
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-white/[0.06] bg-[#0E1013] px-1.5 pb-[18px] pt-2.5 text-[8.5px] text-white/45">
      {tabs.map((tab) => (
        <span key={tab.label} className={cn('grid justify-items-center gap-[3px]', tab.label === on && 'text-volt')}>
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path d={tab.d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          {tab.label}
        </span>
      ))}
    </div>
  )
}

/* Icons used inside the phones, at the design's stroke weights. */
export const BOLT_D = 'M13.5 2 4 14h7l-1.5 8L20 10h-7z'

export function BoltFill({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={BOLT_D} fill="currentColor" />
    </svg>
  )
}

export function NavArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M20 4 4 11l7 2 2 7z" fill="currentColor" />
    </svg>
  )
}

export function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </g>
    </svg>
  )
}
