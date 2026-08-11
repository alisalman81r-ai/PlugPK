// src/components/station/PhotoGallery.tsx
'use client'

import { Camera, ChevronLeft, ChevronRight, Images, X, Zap } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface PhotoGalleryProps {
  photos: string[]
  stationName: string
}

const MAX_THUMBS = 5

/**
 * `fill` rather than fixed dimensions: every slot is sized by its parent
 * (16:9 hero, 88x64 thumb, lightbox frame), so the intrinsic size of the
 * source never needs to be known here.
 */
function PhotoSlot({
  src,
  label,
  sizes,
  priority = false,
  className,
}: {
  src: string
  label: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    <Image
      src={src}
      alt={label}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  )
}

export function PhotoGallery({ photos, stationName }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false)

  // Bound once so noUncheckedIndexedAccess narrowing carries into the JSX.
  const currentPhoto = photos[selectedIndex]
  const visibleThumbs = photos.slice(0, MAX_THUMBS)
  const remaining = photos.length - MAX_THUMBS

  const goPrev = React.useCallback(() => {
    setSelectedIndex((index) => (index - 1 + photos.length) % photos.length)
  }, [photos.length])

  const goNext = React.useCallback(() => {
    setSelectedIndex((index) => (index + 1) % photos.length)
  }, [photos.length])

  React.useEffect(() => {
    if (!isLightboxOpen) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false)
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isLightboxOpen, goPrev, goNext])

  return (
    <>
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 lg:aspect-video">
          {currentPhoto ? (
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              aria-label={`Open ${stationName} photo ${selectedIndex + 1} full screen`}
              className="relative h-full w-full cursor-zoom-in"
            >
              <PhotoSlot
                src={currentPhoto}
                label={`${stationName} photo ${selectedIndex + 1}`}
                sizes="(max-width: 1024px) 100vw, 720px"
                priority
              />
            </button>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50 to-cyan-50">
              <Zap size={64} className="text-blue-200" aria-hidden="true" />
              <p className="text-sm text-slate-400">No photos yet</p>
            </div>
          )}

          <button
            type="button"
            className="absolute right-3 top-3 flex items-center gap-2 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-md transition-colors hover:bg-black/80"
          >
            <Camera size={15} className="text-white" aria-hidden="true" />
            <span className="text-xs font-medium text-white">Add Photo</span>
          </button>

          {photos.length > 1 ? (
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
              <Images size={14} className="text-white" aria-hidden="true" />
              <span className="text-xs font-medium text-white">
                {selectedIndex + 1} / {photos.length}
              </span>
            </span>
          ) : null}
        </div>

        {photos.length > 1 ? (
          <div className="scrollbar-hide mt-3 flex gap-2.5 overflow-x-auto">
            {visibleThumbs.map((photo, index) => {
              const isLastVisible = index === MAX_THUMBS - 1 && remaining > 0

              return (
                <button
                  key={photo}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`View photo ${index + 1}`}
                  aria-current={selectedIndex === index}
                  className={cn(
                    'relative h-16 w-[88px] shrink-0 overflow-hidden rounded-xl transition-all duration-150',
                    selectedIndex === index
                      ? 'opacity-100 ring-2 ring-plug-blue-600 ring-offset-2'
                      : 'opacity-70 hover:opacity-100',
                  )}
                >
                  <PhotoSlot src={photo} label={`Photo ${index + 1}`} sizes="88px" />
                  {isLastVisible ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/[0.65] text-lg font-bold text-white">
                      +{remaining}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {isLightboxOpen && currentPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${stationName} photos`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close gallery"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goPrev()
                }}
                aria-label="Previous photo"
                className="absolute left-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goNext()
                }}
                aria-label="Next photo"
                className="absolute right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight size={22} />
              </button>
            </>
          ) : null}

          <div
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <PhotoSlot
              src={currentPhoto}
              label={`${stationName} photo ${selectedIndex + 1}`}
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-contain"
            />
          </div>

          <div
            className="scrollbar-hide absolute bottom-6 flex max-w-full gap-2 overflow-x-auto px-6"
            onClick={(event) => event.stopPropagation()}
          >
            {photos.map((photo, index) => (
              <button
                key={photo}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View photo ${index + 1}`}
                className={cn(
                  'relative h-12 w-16 shrink-0 overflow-hidden rounded-lg transition-all duration-150',
                  selectedIndex === index ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-90',
                )}
              >
                <PhotoSlot src={photo} label={`Photo ${index + 1}`} sizes="64px" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
