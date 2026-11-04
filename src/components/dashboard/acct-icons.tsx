// src/components/dashboard/acct-icons.tsx
//
// The account pages' icons, drawn exactly as the design's SVG sprite
// (plugpk-account-pages: i-* and a-* symbols). Each takes a pixel size and
// a className; all are decorative (aria-hidden) unless given a title.

import * as React from 'react'

type IconProps = { size?: number; className?: string }

function Svg({ size = 19, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={className}>
      {children}
    </svg>
  )
}

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const S7 = { ...S, strokeWidth: 1.7 } as const

export const IGrid = (p: IconProps) => (
  <Svg {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </g>
  </Svg>
)
export const ICar = (p: IconProps) => (
  <Svg {...p}>
    <g {...S}>
      <path d="M3 16.5V13l2.4-5.2a2 2 0 0 1 1.8-1.2h9.6a2 2 0 0 1 1.8 1.2L21 13v3.5M3 13h18M9 16.5h6" />
      <circle cx="6.5" cy="16.5" r="2" />
      <circle cx="17.5" cy="16.5" r="2" />
    </g>
  </Svg>
)
export const IBookmark = (p: IconProps) => (
  <Svg {...p}>
    <path {...S} d="M6.5 3.5h11v17L12 16.5l-5.5 4z" />
  </Svg>
)
export const IRoute = (p: IconProps) => (
  <Svg {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" />
    </g>
  </Svg>
)
export const ICal = (p: IconProps) => (
  <Svg {...p}>
    <g {...S}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" />
    </g>
  </Svg>
)
export const IUsers = (p: IconProps) => (
  <Svg {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 19.5c.9-3 3.4-4.8 6.5-4.8s5.6 1.8 6.5 4.8" />
      <path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4M18 14.9c1.7.7 2.9 2.3 3.5 4.6" />
    </g>
  </Svg>
)
export const IGear = (p: IconProps) => (
  <Svg {...p}>
    <g {...S}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </g>
  </Svg>
)
export const IOut = (p: IconProps) => (
  <Svg {...p}>
    <path {...S} d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l-4-4 4-4M6 12h10" />
  </Svg>
)
export const IPen = (p: IconProps) => (
  <Svg {...p}>
    <path {...S} d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
  </Svg>
)
export const IImg = (p: IconProps) => (
  <Svg {...p}>
    <g {...S}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m4 18 5-5 4 4 2.5-2.5L20 19" />
    </g>
  </Svg>
)
export const ITrash = (p: IconProps) => (
  <Svg {...p}>
    <path {...S} d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h8a1.5 1.5 0 0 0 1.5-1.4l1-12M9 7V4.5h6V7" />
  </Svg>
)
export const IBack = (p: IconProps) => (
  <Svg {...p}>
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6 6-6-6 6-6" />
  </Svg>
)
export const ILock = (p: IconProps) => (
  <Svg {...p}>
    <g {...S}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </g>
  </Svg>
)
export const IDevices = (p: IconProps) => (
  <Svg {...p}>
    <g {...S}>
      <rect x="2.5" y="4.5" width="14" height="10" rx="1.8" />
      <path d="M6 18h7" />
      <rect x="16.5" y="9" width="5" height="11" rx="1.4" />
    </g>
  </Svg>
)
export const IEye = (p: IconProps) => (
  <Svg {...p}>
    <g {...S}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  </Svg>
)
export const IEyeOff = (p: IconProps) => (
  <Svg {...p}>
    <path {...S} d="M3 3l18 18M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.9 3.7M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
)
export const ICheck = (p: IconProps) => (
  <Svg {...p}>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
)
export const IPin = (p: IconProps) => (
  <Svg {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </g>
  </Svg>
)
export const IStar = (p: IconProps) => (
  <Svg {...p}>
    <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="m12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z" />
  </Svg>
)
export const IChat = (p: IconProps) => (
  <Svg {...p}>
    <path {...S7} d="M4 5h16v11H9l-5 4z" />
  </Svg>
)
export const ISearch = (p: IconProps) => (
  <Svg {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </g>
  </Svg>
)
export const IArrow = (p: IconProps) => (
  <Svg {...p}>
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
  </Svg>
)
export const IClock = (p: IconProps) => (
  <Svg {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </g>
  </Svg>
)
export const IBattery = (p: IconProps) => (
  <Svg {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="7" y="4" width="10" height="17" rx="2" />
      <path d="M10 2h4" />
      <path d="m12.6 8.5-2.2 3.5h3.2l-2.2 3.5" />
    </g>
  </Svg>
)
export const IBolt = (p: IconProps) => (
  <Svg {...p}>
    <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M13.5 2 4 14h7l-1.5 8L20 10h-7z" />
  </Svg>
)
export const IPlus = (p: IconProps) => (
  <Svg {...p}>
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M12 5v14M5 12h14" />
  </Svg>
)
export const ISpin = ({ size = 16, className }: IconProps) => (
  <span
    aria-hidden="true"
    style={{ width: size, height: size }}
    className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? ''}`}
  />
)
