// src/components/community/auth-links.ts

/**
 * Sign-in and sign-up links that bring the reader back.
 *
 * The community's gates linked to bare /login and /signup, so somebody who
 * stopped to sign in halfway through a thread landed on their dashboard and had
 * to find the post again. Both auth pages honour ?redirect= (cleaned by
 * lib/safe-redirect), so every gate passes the page it was on.
 */
export function signInHref(here: string): string {
  return `/login?redirect=${encodeURIComponent(here)}`
}

export function signUpHref(here: string): string {
  return `/signup?redirect=${encodeURIComponent(here)}`
}
