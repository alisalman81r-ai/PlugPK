// src/lib/upload-urls.ts

/**
 * Recognises URLs this application's own upload action issued.
 *
 * Uploads land in one of two places: public/uploads on a developer's machine
 * (a site-relative path) or the Vercel Blob store in production (an absolute
 * https URL on *.public.blob.vercel-storage.com). Anything that stores or
 * deletes an upload URL checks it here first, so a listing can never be made to
 * point at, or delete, an arbitrary address.
 *
 * Checking only the local prefix is what broke business sign-up in production:
 * every Blob URL failed it, so every charger photo was silently dropped.
 */

export type UploadBucket = 'chargers' | 'avatars' | 'cars'

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

export function isLocalUploadUrl(bucket: UploadBucket, url: string): boolean {
  return url.startsWith(`/uploads/${bucket}/`) && !url.includes('..')
}

export function isBlobUploadUrl(bucket: UploadBucket, url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.hostname.endsWith(BLOB_HOST_SUFFIX) &&
    parsed.pathname.startsWith(`/${bucket}/`) &&
    !parsed.pathname.includes('..')
  )
}

/** True for a URL in this bucket, from either backend. */
export function isUploadUrl(bucket: UploadBucket, url: unknown): url is string {
  return typeof url === 'string' && (isLocalUploadUrl(bucket, url) || isBlobUploadUrl(bucket, url))
}
