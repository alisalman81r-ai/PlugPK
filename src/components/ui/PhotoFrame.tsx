// src/components/ui/PhotoFrame.tsx
import { ImageOff } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

export interface PhotoFrameProps {
  /** Undefined renders the fallback rather than a broken <Image>. */
  src?: string
  alt: string
  /** Required: without it next/image ships the largest candidate to every viewport. */
  sizes: string
  priority?: boolean
  /** Applied to the image itself, not the frame — e.g. `object-top`. */
  imageClassName?: string
  /** Scrim for text laid over the photo. Off by default. */
  overlay?: boolean
  /** Scales the image on group-hover. Requires a `group` ancestor. */
  zoomOnHover?: boolean
  className?: string
}

/**
 * One frame for every photo in the product, so aspect ratio, cover behaviour,
 * hover motion and the missing-image fallback stay identical everywhere.
 *
 * Sizing comes from the parent — the frame is `absolute inset-0`, so callers
 * control the aspect ratio and this never distorts the source.
 */
export function PhotoFrame({
  src,
  alt,
  sizes,
  priority = false,
  imageClassName,
  overlay = false,
  zoomOnHover = false,
  className,
}: PhotoFrameProps) {
  return (
    <span className={cn('absolute inset-0 block overflow-hidden bg-slate-100', className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            'object-cover',
            // transform-only, so the hover stays on the compositor
            zoomOnHover &&
              'transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04]',
            imageClassName,
          )}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200"
        >
          <ImageOff size={28} className="text-slate-300" />
        </span>
      )}

      {overlay ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
        />
      ) : null}
    </span>
  )
}
