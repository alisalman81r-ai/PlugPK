// src/components/ui/Avatar.tsx
import { cn } from '@/lib/utils'

/**
 * Somebody's picture, or their initial.
 *
 * One component because the fallback has to match everywhere: a header showing
 * a photo and a sidebar showing a coloured initial for the same person reads as
 * two different accounts.
 *
 * A plain img rather than next/image — these are user uploads of unknown
 * dimensions, and the optimizer earns nothing on a 28px circle.
 */

export interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  className?: string
}

export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        // Empty, because the name is always rendered beside this in the places
        // it is used. Repeating it would make a screen reader say it twice.
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn('shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-brand font-bold text-white',
        className,
      )}
    >
      {initial}
    </span>
  )
}
